import { useState, useEffect } from "react";
import {
    Calendar, Filter, Loader2, ChevronDown, ChevronRight,
    Sun, Cloud, CloudRain, CloudLightning, CloudSun, HardHat
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { api } from "@/services/api";
import { Diario, TipoAtividade, CONDICOES_TEMPO } from "@/types/diary";
import { AtividadeCard } from "./AtividadeCard";
import { cn } from "@/lib/utils";

const weatherIcons: Record<string, React.ElementType> = {
    ensolarado: Sun,
    nublado: Cloud,
    chuvoso: CloudRain,
    tempestade: CloudLightning,
    parcialmente_nublado: CloudSun,
};

export function DiarioObrasTab() {
    const [diarios, setDiarios] = useState<Diario[]>([]);
    const [tipos, setTipos] = useState<TipoAtividade[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedDiario, setExpandedDiario] = useState<number | null>(null);
    const [diarioDetails, setDiarioDetails] = useState<Record<number, Diario>>({});
    const [loadingDetails, setLoadingDetails] = useState<number | null>(null);

    // Filter state
    const [dataInicio, setDataInicio] = useState("");
    const [dataFim, setDataFim] = useState("");
    const [tipoSelecionado, setTipoSelecionado] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [diariosData, tiposData] = await Promise.all([
                api.getDiarios({ data_inicio: dataInicio, data_fim: dataFim, tipo: tipoSelecionado }),
                api.getTiposAtividade(),
            ]);
            setDiarios(diariosData);
            setTipos(tiposData);
        } catch (error) {
            console.error("Error loading diarios:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadDiarioDetails = async (diarioId: number) => {
        if (diarioDetails[diarioId]) {
            setExpandedDiario(expandedDiario === diarioId ? null : diarioId);
            return;
        }

        try {
            setLoadingDetails(diarioId);
            const details = await api.getDiario(diarioId);
            setDiarioDetails((prev) => ({ ...prev, [diarioId]: details }));
            setExpandedDiario(diarioId);
        } catch (error) {
            console.error("Error loading diary details:", error);
        } finally {
            setLoadingDetails(null);
        }
    };

    const handleFilter = () => {
        loadData();
    };

    const clearFilters = () => {
        setDataInicio("");
        setDataFim("");
        setTipoSelecionado("");
        setTimeout(loadData, 0);
    };

    const getWeatherIcon = (condicao: string) => {
        const Icon = weatherIcons[condicao] || Sun;
        return <Icon className="h-4 w-4" />;
    };

    const getWeatherLabel = (condicao: string) => {
        return CONDICOES_TEMPO.find((c) => c.value === condicao)?.label || condicao;
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    return (
        <div className="space-y-6">
            {/* Info Box */}
            <div className="bg-accent/10 border border-accent/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <HardHat className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-accent mb-1">Diário de Obras</p>
                        <p className="text-sm text-muted-foreground">
                            Acompanhe as atividades realizadas nas obras da comunidade.
                            Caso identifique alguma inconsistência, você pode contestar qualquer atividade.
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Filtros:</span>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground">Data Início</label>
                        <Input
                            type="date"
                            value={dataInicio}
                            onChange={(e) => setDataInicio(e.target.value)}
                            className="w-40 h-9"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground">Data Fim</label>
                        <Input
                            type="date"
                            value={dataFim}
                            onChange={(e) => setDataFim(e.target.value)}
                            className="w-40 h-9"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground">Tipo de Serviço</label>
                        <select
                            value={tipoSelecionado}
                            onChange={(e) => setTipoSelecionado(e.target.value)}
                            className="h-9 px-3 rounded-md border border-input bg-background text-sm"
                        >
                            <option value="">Todos</option>
                            {tipos.map((tipo) => (
                                <option key={tipo.id} value={tipo.nome}>
                                    {tipo.nome}
                                </option>
                            ))}
                        </select>
                    </div>

                    <Button size="sm" onClick={handleFilter} className="h-9">
                        Filtrar
                    </Button>
                    <Button size="sm" variant="outline" onClick={clearFilters} className="h-9">
                        Limpar
                    </Button>
                </div>
            </div>

            {/* Loading */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : diarios.length === 0 ? (
                <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum diário de obras encontrado.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {diarios.map((diario) => {
                        const isExpanded = expandedDiario === diario.id;
                        const details = diarioDetails[diario.id];
                        const isLoading = loadingDetails === diario.id;

                        return (
                            <Collapsible
                                key={diario.id}
                                open={isExpanded}
                                onOpenChange={() => loadDiarioDetails(diario.id)}
                            >
                                <div className="bg-card rounded-xl shadow-card overflow-hidden">
                                    <CollapsibleTrigger asChild>
                                        <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-5 w-5 text-primary" />
                                                    <span className="font-semibold capitalize">
                                                        {formatDate(diario.data)}
                                                    </span>
                                                </div>

                                                {diario.tempo && diario.tempo.length > 0 && (
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        {getWeatherIcon(diario.tempo[0].condicao)}
                                                        <span>{getWeatherLabel(diario.tempo[0].condicao)}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <span className="text-sm text-muted-foreground">
                                                    {diario.total_atividades || 0} atividade(s)
                                                </span>
                                                {isLoading ? (
                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                ) : isExpanded ? (
                                                    <ChevronDown className="h-5 w-5" />
                                                ) : (
                                                    <ChevronRight className="h-5 w-5" />
                                                )}
                                            </div>
                                        </button>
                                    </CollapsibleTrigger>

                                    <CollapsibleContent>
                                        <div className="border-t p-4 space-y-4 bg-muted/30">
                                            {/* Weather info */}
                                            {details?.tempo && details.tempo.length > 0 && (
                                                <div className="flex flex-wrap gap-3 pb-3 border-b">
                                                    {details.tempo.map((t) => (
                                                        <div
                                                            key={t.id}
                                                            className={cn(
                                                                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs",
                                                                "bg-background border"
                                                            )}
                                                        >
                                                            {getWeatherIcon(t.condicao)}
                                                            <span className="capitalize">{t.periodo}</span>:
                                                            <span>{getWeatherLabel(t.condicao)}</span>
                                                            {t.temperatura_min && t.temperatura_max && (
                                                                <span className="text-muted-foreground">
                                                                    ({t.temperatura_min}° - {t.temperatura_max}°)
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Activities */}
                                            {details?.atividades && details.atividades.length > 0 ? (
                                                <div className="space-y-3">
                                                    {details.atividades.map((atividade) => (
                                                        <AtividadeCard key={atividade.id} atividade={atividade} />
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground text-center py-4">
                                                    Nenhuma atividade registrada para este dia.
                                                </p>
                                            )}

                                            {/* Observations */}
                                            {details?.observacoes && (
                                                <div className="pt-3 border-t">
                                                    <p className="text-sm text-muted-foreground">
                                                        <span className="font-medium">Observações:</span> {details.observacoes}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </CollapsibleContent>
                                </div>
                            </Collapsible>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
