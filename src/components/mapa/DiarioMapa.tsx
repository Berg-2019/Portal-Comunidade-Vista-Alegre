import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Atividade } from '@/types/diary';
import { MarkerPopup } from './MarkerPopup';
import { MapLegend, STATUS_CORES_MAPA } from './MapLegend';
import 'leaflet/dist/leaflet.css';

// Corrigir ícones do Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Coordenadas de Vista Alegre do Abunã, RO
const CENTRO_PADRAO: [number, number] = [-9.6050, -65.3600];
const ZOOM_PADRAO = 14;

interface DiarioMapaProps {
    atividades: Atividade[];
    selectedAtividadeId?: number;
    onSelectAtividade?: (atividade: Atividade) => void;
    className?: string;
}

// Criar ícone customizado por cor
function createColoredIcon(color: string): L.DivIcon {
    return L.divIcon({
        className: 'custom-marker',
        html: `
      <div style="
        background-color: ${color};
        width: 28px;
        height: 28px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      ">
        <div style="
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        "></div>
      </div>
    `,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28],
    });
}

// Componente para ajustar a visão do mapa
function MapBounds({ atividades }: { atividades: Atividade[] }) {
    const map = useMap();

    useEffect(() => {
        const atividadesComCoordenadas = atividades.filter(
            a => a.latitude && a.longitude
        );

        if (atividadesComCoordenadas.length > 0) {
            const bounds = L.latLngBounds(
                atividadesComCoordenadas.map(a => [a.latitude!, a.longitude!])
            );
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        }
    }, [atividades, map]);

    return null;
}

export function DiarioMapa({
    atividades,
    selectedAtividadeId,
    onSelectAtividade,
    className
}: DiarioMapaProps) {
    const markerRefs = useRef<Map<number, L.Marker>>(new Map());

    // Filtrar apenas atividades com coordenadas
    const atividadesNoMapa = useMemo(() =>
        atividades.filter(a => a.latitude && a.longitude),
        [atividades]
    );

    // Criar ícones memoizados
    const icones = useMemo(() => ({
        concluido: createColoredIcon(STATUS_CORES_MAPA.concluido),
        em_andamento: createColoredIcon(STATUS_CORES_MAPA.em_andamento),
        pendente: createColoredIcon(STATUS_CORES_MAPA.pendente),
        pausado: createColoredIcon(STATUS_CORES_MAPA.pausado),
        cancelado: createColoredIcon(STATUS_CORES_MAPA.cancelado),
    }), []);

    // Abrir popup da atividade selecionada
    useEffect(() => {
        if (selectedAtividadeId) {
            const marker = markerRefs.current.get(selectedAtividadeId);
            if (marker) {
                marker.openPopup();
            }
        }
    }, [selectedAtividadeId]);

    return (
        <div className={`relative ${className}`}>
            <MapContainer
                center={CENTRO_PADRAO}
                zoom={ZOOM_PADRAO}
                className="h-full w-full rounded-xl"
                style={{ minHeight: '400px' }}
            >
                {/* Camada de Satélite ESRI */}
                <TileLayer
                    attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, Maxar, Earthstar Geographics'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
                {/* Camada de labels/rótulos sobre o satélite */}
                <TileLayer
                    attribution=''
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                />

                <MapBounds atividades={atividadesNoMapa} />

                {atividadesNoMapa.map((atividade) => (
                    <Marker
                        key={atividade.id}
                        position={[atividade.latitude!, atividade.longitude!]}
                        icon={icones[atividade.status as keyof typeof icones] || icones.pendente}
                        ref={(ref) => {
                            if (ref) {
                                markerRefs.current.set(atividade.id, ref);
                            }
                        }}
                        eventHandlers={{
                            click: () => onSelectAtividade?.(atividade),
                        }}
                    >
                        <Popup maxWidth={320} minWidth={250}>
                            <MarkerPopup atividade={atividade} />
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Legenda */}
            <MapLegend className="absolute top-3 right-3 z-[1000]" />

            {/* Indicador de atividades sem localização */}
            {atividades.length > atividadesNoMapa.length && (
                <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-muted-foreground shadow border">
                    📍 {atividadesNoMapa.length} de {atividades.length} atividades com localização
                </div>
            )}
        </div>
    );
}
