import { useState, useCallback, useMemo, useEffect } from 'react';
import Map, { Marker, Popup, NavigationControl, ScaleControl, GeolocateControl } from 'react-map-gl/maplibre';
import { MapPin, Navigation } from 'lucide-react';
import { Atividade, STATUS_ATIVIDADE } from '@/types/diary';
import { cn } from '@/lib/utils';
import 'maplibre-gl/dist/maplibre-gl.css';

// Coordenadas centrais de Vista Alegre do Abunã, RO
const VISTA_ALEGRE_CENTER = {
    latitude: -9.6569063,
    longitude: -65.7326129,
    zoom: 17,
    pitch: 45,    // Inclinação da câmera para efeito 3D
    bearing: 0    // Rotação do mapa
};

// Cores por status para marcadores
const STATUS_CORES: Record<string, string> = {
    concluido: '#22c55e',      // verde
    em_andamento: '#f97316',   // laranja
    pendente: '#6b7280',       // cinza
    pausado: '#3b82f6',        // azul
    cancelado: '#ef4444',      // vermelho
};

// Estilo do mapa - Satélite via MapTiler
const MAP_STYLE = 'https://api.maptiler.com/maps/hybrid/style.json?key=UBn1Wso9uzyHEZR7FCGM';

// Chave para cookies de localização
const LOCATION_COOKIE_KEY = 'user_location';

interface ObrasMapProps {
    atividades: Atividade[];
    selectedAtividadeId?: number;
    onSelectAtividade?: (atividade: Atividade) => void;
    className?: string;
}

// Função para salvar localização em cookie
function saveLocationCookie(lat: number, lng: number) {
    const expires = new Date();
    expires.setDate(expires.getDate() + 30); // 30 dias
    document.cookie = `${LOCATION_COOKIE_KEY}=${lat},${lng}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    console.log('📍 Localização salva em cookie:', lat, lng);
}

// Função para ler localização do cookie
function getLocationFromCookie(): { latitude: number; longitude: number } | null {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [key, value] = cookie.trim().split('=');
        if (key === LOCATION_COOKIE_KEY && value) {
            const [lat, lng] = value.split(',').map(Number);
            if (!isNaN(lat) && !isNaN(lng)) {
                return { latitude: lat, longitude: lng };
            }
        }
    }
    return null;
}

export function ObrasMap({ 
    atividades, 
    selectedAtividadeId, 
    onSelectAtividade,
    className 
}: ObrasMapProps) {
    const [popupInfo, setPopupInfo] = useState<Atividade | null>(null);
    const [viewState, setViewState] = useState(VISTA_ALEGRE_CENTER);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

    // Solicitar permissão de geolocalização ao montar o componente
    useEffect(() => {
        // Primeiro, tentar carregar do cookie
        const savedLocation = getLocationFromCookie();
        if (savedLocation) {
            setUserLocation(savedLocation);
            console.log('📍 Localização carregada do cookie:', savedLocation);
        }

        // Solicitar geolocalização do navegador
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation({ latitude, longitude });
                    saveLocationCookie(latitude, longitude);
                    console.log('✅ Geolocalização obtida:', latitude, longitude);
                },
                (error) => {
                    console.log('⚠️ Geolocalização negada ou indisponível:', error.message);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutos
                }
            );
        }
    }, []);

    // Filtrar atividades com coordenadas válidas
    const atividadesNoMapa = useMemo(() => 
        atividades.filter(a => a.latitude && a.longitude),
        [atividades]
    );

    const handleMarkerClick = useCallback((atividade: Atividade) => {
        setPopupInfo(atividade);
        onSelectAtividade?.(atividade);
    }, [onSelectAtividade]);

    const getStatusInfo = (status: string) => {
        return STATUS_ATIVIDADE.find(s => s.value === status) || { 
            label: status, 
            color: 'bg-gray-100 text-gray-800' 
        };
    };

    return (
        <div className={cn("relative rounded-xl overflow-hidden", className)}>
            <Map
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                style={{ width: '100%', height: '100%', minHeight: '400px' }}
                mapStyle={MAP_STYLE}
            >
                {/* Controles */}
                <NavigationControl position="top-left" />
                <ScaleControl position="bottom-left" />
                
                {/* Controle de Geolocalização */}
                <GeolocateControl
                    position="top-left"
                    trackUserLocation={true}
                    showUserHeading={true}
                    showAccuracyCircle={true}
                    onGeolocate={(e) => {
                        const { latitude, longitude } = e.coords;
                        setUserLocation({ latitude, longitude });
                        saveLocationCookie(latitude, longitude);
                    }}
                />

                {/* Marcador da localização do usuário */}
                {userLocation && (
                    <Marker
                        latitude={userLocation.latitude}
                        longitude={userLocation.longitude}
                        anchor="center"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 animate-ping bg-blue-400 rounded-full opacity-75" style={{ width: 24, height: 24 }} />
                            <div className="relative bg-blue-500 rounded-full p-1 border-2 border-white shadow-lg">
                                <Navigation className="h-4 w-4 text-white" />
                            </div>
                        </div>
                    </Marker>
                )}

                {/* Marcadores de atividades */}
                {atividadesNoMapa.map((atividade) => (
                    <Marker
                        key={atividade.id}
                        latitude={atividade.latitude!}
                        longitude={atividade.longitude!}
                        anchor="bottom"
                        onClick={(e) => {
                            e.originalEvent.stopPropagation();
                            handleMarkerClick(atividade);
                        }}
                    >
                        <div 
                            className={cn(
                                "cursor-pointer transform transition-transform hover:scale-110",
                                selectedAtividadeId === atividade.id && "scale-125"
                            )}
                        >
                            <div
                                style={{
                                    backgroundColor: STATUS_CORES[atividade.status] || '#6b7280',
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50% 50% 50% 0',
                                    transform: 'rotate(-45deg)',
                                    border: '3px solid white',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <div
                                    style={{
                                        width: '10px',
                                        height: '10px',
                                        backgroundColor: 'white',
                                        borderRadius: '50%',
                                        transform: 'rotate(45deg)'
                                    }}
                                />
                            </div>
                        </div>
                    </Marker>
                ))}

                {/* Popup */}
                {popupInfo && (
                    <Popup
                        latitude={popupInfo.latitude!}
                        longitude={popupInfo.longitude!}
                        anchor="bottom"
                        onClose={() => setPopupInfo(null)}
                        closeOnClick={false}
                        maxWidth="320px"
                    >
                        <div className="p-2 min-w-[250px]">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="font-semibold text-gray-900 text-sm leading-tight flex-1">
                                    {popupInfo.descricao}
                                </h3>
                                <span className={cn(
                                    "px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0",
                                    getStatusInfo(popupInfo.status).color
                                )}>
                                    {getStatusInfo(popupInfo.status).label}
                                </span>
                            </div>

                            {/* Info */}
                            <div className="space-y-1.5 text-xs text-gray-600">
                                <div className="flex items-start gap-2">
                                    <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                                    <span>{popupInfo.local}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="font-medium">Tipo:</span>
                                    <span>{popupInfo.tipo}</span>
                                </div>
                                {popupInfo.observacoes && (
                                    <p className="text-gray-500 mt-2 line-clamp-2">
                                        {popupInfo.observacoes}
                                    </p>
                                )}
                                {popupInfo.image_url && (
                                    <img 
                                        src={popupInfo.image_url} 
                                        alt={popupInfo.descricao}
                                        className="w-full h-24 object-cover rounded mt-2"
                                    />
                                )}
                            </div>
                        </div>
                    </Popup>
                )}
            </Map>

            {/* Legenda */}
            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 border z-10">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                    Legenda
                </h4>
                <div className="space-y-1.5">
                    {STATUS_ATIVIDADE.map((status) => (
                        <div key={status.value} className="flex items-center gap-2 text-xs">
                            <span 
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: STATUS_CORES[status.value] }}
                            />
                            <span className="text-gray-700">{status.label}</span>
                        </div>
                    ))}
                    <div className="flex items-center gap-2 text-xs pt-1 border-t mt-1">
                        <span className="w-3 h-3 rounded-full flex-shrink-0 bg-blue-500" />
                        <span className="text-gray-700">Você está aqui</span>
                    </div>
                </div>
            </div>

            {/* Contador de atividades */}
            {atividades.length > atividadesNoMapa.length && (
                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-muted-foreground shadow border z-10">
                    📍 {atividadesNoMapa.length} de {atividades.length} atividades com localização
                </div>
            )}
        </div>
    );
}
