import { useState } from "react";
import { MapPin, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Atividade, STATUS_ATIVIDADE } from "@/types/diary";
import { FormContestacao } from "./FormContestacao";

interface AtividadeCardProps {
    atividade: Atividade;
    showContest?: boolean;
}

export function AtividadeCard({ atividade, showContest = true }: AtividadeCardProps) {
    const [expanded, setExpanded] = useState(false);
    const [contestOpen, setContestOpen] = useState(false);

    const statusInfo = STATUS_ATIVIDADE.find((s) => s.value === atividade.status) || {
        label: atividade.status,
        color: "bg-gray-100 text-gray-800",
    };

    const getStatusIcon = () => {
        switch (atividade.status) {
            case "concluido":
                return "✓";
            case "em_andamento":
                return "⏳";
            case "pausado":
                return "⏸️";
            case "pendente":
                return "○";
            case "cancelado":
                return "✕";
            default:
                return "•";
        }
    };

    return (
        <>
            <div
                className={cn(
                    "border rounded-lg p-4 bg-card transition-all duration-200 hover:shadow-md",
                    expanded && "ring-2 ring-primary/20"
                )}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span className="text-lg mt-0.5">{getStatusIcon()}</span>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span
                                    className={cn(
                                        "px-2 py-0.5 rounded-full text-xs font-medium",
                                        statusInfo.color
                                    )}
                                >
                                    {statusInfo.label}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {atividade.tipo}
                                </span>
                            </div>
                            <h4 className="font-medium text-sm mb-1 truncate">{atividade.descricao}</h4>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{atividade.local}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        {atividade.observacoes && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpanded(!expanded)}
                                className="h-8 w-8 p-0"
                            >
                                {expanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                ) : (
                                    <ChevronDown className="h-4 w-4" />
                                )}
                            </Button>
                        )}
                        {showContest && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setContestOpen(true)}
                                className="h-8 text-xs"
                            >
                                <MessageSquare className="h-3 w-3 mr-1" />
                                Contestar
                            </Button>
                        )}
                    </div>
                </div>

                {expanded && atividade.observacoes && (
                    <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-muted-foreground">{atividade.observacoes}</p>
                    </div>
                )}

                {atividade.total_contestacoes !== undefined && atividade.total_contestacoes > 0 && (
                    <div className="mt-2 pt-2 border-t">
                        <span className="text-xs text-muted-foreground">
                            {atividade.total_contestacoes} contestação(ões)
                        </span>
                    </div>
                )}
            </div>

            <FormContestacao
                atividadeId={atividade.id}
                atividadeDescricao={atividade.descricao}
                isOpen={contestOpen}
                onClose={() => setContestOpen(false)}
            />
        </>
    );
}
