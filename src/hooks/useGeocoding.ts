import { useState, useCallback } from 'react';

interface GeocodingResult {
    latitude: number;
    longitude: number;
    displayName?: string;
}

interface GeocodingError {
    message: string;
}

interface UseGeocodingReturn {
    geocode: (address: string) => Promise<GeocodingResult | null>;
    loading: boolean;
    error: GeocodingError | null;
}

// Coordenadas centrais de Vista Alegre do Abunã
const VISTA_ALEGRE_CENTER = {
    lat: -9.6050,
    lon: -65.3600
};

// Locais conhecidos em Vista Alegre do Abunã (adicione mais conforme necessário)
const LOCAIS_CONHECIDOS: Record<string, { lat: number; lon: number }> = {
    'centro': { lat: -9.6050, lon: -65.3600 },
    'rodoviaria': { lat: -9.6048, lon: -65.3580 },
    'escola': { lat: -9.6055, lon: -65.3610 },
    'posto de saude': { lat: -9.6045, lon: -65.3595 },
    'igreja': { lat: -9.6052, lon: -65.3605 },
    'mercado': { lat: -9.6047, lon: -65.3590 },
    'br-364': { lat: -9.6035, lon: -65.3585 },
    'br 364': { lat: -9.6035, lon: -65.3585 },
    'prefeitura': { lat: -9.6050, lon: -65.3598 },
    'quadra': { lat: -9.6060, lon: -65.3615 },
    'praca': { lat: -9.6048, lon: -65.3602 },
    'praça': { lat: -9.6048, lon: -65.3602 },
};

/**
 * Hook para geocodificação local de Vista Alegre do Abunã
 * Usa coordenadas conhecidas ou gera coordenadas próximas ao centro
 */
export function useGeocoding(): UseGeocodingReturn {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<GeocodingError | null>(null);

    const geocode = useCallback(async (address: string): Promise<GeocodingResult | null> => {
        if (!address || address.trim().length < 2) {
            setError({ message: 'Endereço muito curto' });
            return null;
        }

        setLoading(true);
        setError(null);

        try {
            const addressLower = address.toLowerCase().trim();

            // Buscar em locais conhecidos
            for (const [key, coords] of Object.entries(LOCAIS_CONHECIDOS)) {
                if (addressLower.includes(key)) {
                    console.log(`✅ Local conhecido encontrado: ${key}`);
                    return {
                        latitude: coords.lat,
                        longitude: coords.lon,
                        displayName: `${address} - Vista Alegre do Abunã`
                    };
                }
            }

            // Se não encontrou, gerar coordenadas próximas ao centro
            // com pequeno offset baseado no hash do endereço para consistência
            const hash = addressLower.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const offsetLat = ((hash % 100) - 50) * 0.0001; // ~10m por unidade
            const offsetLon = ((hash % 73) - 36) * 0.0001;

            console.log(`📍 Gerando coordenadas próximas ao centro para: ${address}`);

            return {
                latitude: VISTA_ALEGRE_CENTER.lat + offsetLat,
                longitude: VISTA_ALEGRE_CENTER.lon + offsetLon,
                displayName: `${address} - Vista Alegre do Abunã (aproximado)`
            };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao buscar localização';
            console.error('❌ Erro geocoding:', message);
            setError({ message });
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return { geocode, loading, error };
}
