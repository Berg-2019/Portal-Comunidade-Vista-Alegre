import { MapPin, Clock, FileText, Tag } from "lucide-react";
import { Atividade, STATUS_ATIVIDADE } from "@/types/diary";
import { cn } from "@/lib/utils";

interface MarkerPopupProps {
    atividade: Atividade;
}

export function MarkerPopup({ atividade }: MarkerPopupProps) {
    const statusInfo = STATUS_ATIVIDADE.find(s => s.value === atividade.status);

    return (
        <div className="min-w-[250px] max-w-[300px] p-1">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-gray-900 text-sm leading-tight flex-1">
                    {atividade.descricao}
                </h3>
                <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0",
                    statusInfo?.color
                )}>
                    {statusInfo?.label}
                </span>
            </div>

            {/* Info Grid */}
            <div className="space-y-1.5 text-xs text-gray-600">
                <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                    <span>{atividade.local}</span>
                </div>

                <div className="flex items-start gap-2">
                    <Tag className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Tipo: {atividade.tipo}</span>
                </div>

                {atividade.observacoes && (
                    <div className="flex items-start gap-2">
                        <FileText className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{atividade.observacoes}</span>
                    </div>
                )}

                {atividade.image_url && (
                    <div className="mt-2">
                        <img
                            src={atividade.image_url}
                            alt={atividade.descricao}
                            className="w-full h-24 object-cover rounded"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
