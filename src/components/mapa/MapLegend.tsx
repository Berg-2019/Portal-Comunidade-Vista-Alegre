import { cn } from "@/lib/utils";
import { STATUS_ATIVIDADE } from "@/types/diary";

interface MapLegendProps {
    className?: string;
}

// Cores para marcadores do mapa
export const STATUS_CORES_MAPA = {
    concluido: '#22c55e',      // verde
    em_andamento: '#f97316',   // laranja
    pendente: '#6b7280',       // cinza
    pausado: '#3b82f6',        // azul
    cancelado: '#ef4444',      // vermelho
} as const;

export function MapLegend({ className }: MapLegendProps) {
    return (
        <div className={cn(
            "bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 border",
            className
        )}>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                Legenda
            </h4>
            <div className="space-y-1.5">
                {STATUS_ATIVIDADE.map((status) => (
                    <div key={status.value} className="flex items-center gap-2 text-sm">
                        <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: STATUS_CORES_MAPA[status.value as keyof typeof STATUS_CORES_MAPA] }}
                        />
                        <span className="text-gray-700">{status.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
