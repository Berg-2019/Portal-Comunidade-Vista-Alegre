import { useState, useEffect } from "react";
import {
    Plus, Loader2, Calendar, HardHat, Trash2, Pencil, ChevronDown, ChevronRight,
    Sun, Cloud, CloudRain, CloudLightning, CloudSun, MapPin, MessageSquare, Check, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";
import { Diario, Atividade, TipoAtividade, Contestacao, STATUS_ATIVIDADE, CONDICOES_TEMPO } from "@/types/diary";
import ImageUpload from "./ImageUpload";
import VideoUpload from "./VideoUpload";

const weatherIcons: Record<string, React.ElementType> = {
    ensolarado: Sun,
    nublado: Cloud,
    chuvoso: CloudRain,
    tempestade: CloudLightning,
    parcialmente_nublado: CloudSun,
};

export default function AdminDiarioManager() {
    const { toast } = useToast();
    const [diarios, setDiarios] = useState<Diario[]>([]);
    const [tipos, setTipos] = useState<TipoAtividade[]>([]);
    const [contests, setContests] = useState<Contestacao[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedDiario, setExpandedDiario] = useState<number | null>(null);
    const [diarioDetails, setDiarioDetails] = useState<Record<number, Diario>>({});

    // Modal states
    const [diarioModalOpen, setDiarioModalOpen] = useState(false);
    const [atividadeModalOpen, setAtividadeModalOpen] = useState(false);
    const [contestsModalOpen, setContestsModalOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const [editingDiario, setEditingDiario] = useState<Partial<Diario> | null>(null);
    const [editingAtividade, setEditingAtividade] = useState<Partial<Atividade> & { diario_id?: number } | null>(null);
    const [deletingItem, setDeletingItem] = useState<{ type: 'diario' | 'atividade'; id: number; diarioId?: number } | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [diariosData, tiposData, contestsData] = await Promise.all([
                api.getDiarios(),
                api.getTiposAtividade(),
                api.getContests().catch(() => []),
            ]);
            setDiarios(diariosData);
            setTipos(tiposData);
            setContests(contestsData);
        } catch (error) {
            console.error("Error loading data:", error);
            toast({ title: "Erro", description: "Falha ao carregar dados.", variant: "destructive" });
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
            const details = await api.getDiario(diarioId);
            setDiarioDetails((prev) => ({ ...prev, [diarioId]: details }));
            setExpandedDiario(diarioId);
        } catch (error) {
            console.error("Error loading diary details:", error);
        }
    };

    // Diario CRUD
    const openDiarioModal = (diario?: Diario) => {
        setEditingDiario(diario || { data: new Date().toISOString().split('T')[0], observacoes: '' });
        setDiarioModalOpen(true);
    };

    const handleSaveDiario = async () => {
        if (!editingDiario?.data) return;
        setSaving(true);
        try {
            if (editingDiario.id) {
                await api.updateDiario(editingDiario.id, { observacoes: editingDiario.observacoes });
                toast({ title: "Sucesso", description: "Diário atualizado." });
            } else {
                await api.createDiario({ data: editingDiario.data, observacoes: editingDiario.observacoes });
                toast({ title: "Sucesso", description: "Diário criado." });
            }
            setDiarioModalOpen(false);
            loadData();
        } catch (error: any) {
            toast({ title: "Erro", description: error.message || "Falha ao salvar.", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    // Atividade CRUD
    const openAtividadeModal = (diarioId: number, atividade?: Atividade) => {
        setEditingAtividade(atividade || {
            diario_id: diarioId,
            descricao: '',
            local: '',
            tipo: tipos[0]?.nome || '',
            status: 'pendente',
            image_url: '',
            video_url: '',
        });
        setAtividadeModalOpen(true);
    };

    const handleSaveAtividade = async () => {
        if (!editingAtividade?.descricao || !editingAtividade?.local) return;
        setSaving(true);
        try {
            const diarioId = editingAtividade.diario_id!;
            if (editingAtividade.id) {
                await api.updateAtividade(diarioId, editingAtividade.id, {
                    descricao: editingAtividade.descricao,
                    local: editingAtividade.local,
                    tipo: editingAtividade.tipo,
                    status: editingAtividade.status,
                    observacoes: editingAtividade.observacoes,
                    image_url: editingAtividade.image_url || undefined,
                    video_url: editingAtividade.video_url || undefined,
                });
                toast({ title: "Sucesso", description: "Atividade atualizada." });
            } else {
                await api.createAtividade(diarioId, {
                    descricao: editingAtividade.descricao,
                    local: editingAtividade.local,
                    tipo: editingAtividade.tipo || tipos[0]?.nome,
                    status: editingAtividade.status,
                    observacoes: editingAtividade.observacoes,
                    image_url: editingAtividade.image_url || undefined,
                    video_url: editingAtividade.video_url || undefined,
                });
                toast({ title: "Sucesso", description: "Atividade criada." });
            }
            setAtividadeModalOpen(false);
            // Reload diario details
            const details = await api.getDiario(diarioId);
            setDiarioDetails((prev) => ({ ...prev, [diarioId]: details }));
            loadData();
        } catch (error: any) {
            toast({ title: "Erro", description: error.message || "Falha ao salvar.", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    // Delete
    const openDeleteDialog = (type: 'diario' | 'atividade', id: number, diarioId?: number) => {
        setDeletingItem({ type, id, diarioId });
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!deletingItem) return;
        try {
            if (deletingItem.type === 'diario') {
                await api.deleteDiario(deletingItem.id);
                toast({ title: "Sucesso", description: "Diário excluído." });
            } else {
                await api.deleteAtividade(deletingItem.diarioId!, deletingItem.id);
                toast({ title: "Sucesso", description: "Atividade excluída." });
                // Reload diario details
                const details = await api.getDiario(deletingItem.diarioId!);
                setDiarioDetails((prev) => ({ ...prev, [deletingItem.diarioId!]: details }));
            }
            loadData();
        } catch (error: any) {
            toast({ title: "Erro", description: error.message || "Falha ao excluir.", variant: "destructive" });
        } finally {
            setDeleteDialogOpen(false);
            setDeletingItem(null);
        }
    };

    // Contest management
    const handleContestUpdate = async (id: number, status: string, resposta?: string) => {
        try {
            await api.updateContest(id, { status, resposta_admin: resposta });
            setContests(prev => prev.map(c => c.id === id ? { ...c, status: status as any, resposta_admin: resposta } : c));
            toast({ title: "Sucesso", description: "Contestação atualizada." });
        } catch (error: any) {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("pt-BR", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const pendingContests = contests.filter(c => c.status === 'pendente' || c.status === 'em_analise');

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <HardHat className="h-5 w-5" />
                        Diário de Obras
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Gerencie os diários de obras e atividades da comunidade.
                    </p>
                </div>
                <div className="flex gap-2">
                    {pendingContests.length > 0 && (
                        <Button variant="outline" onClick={() => setContestsModalOpen(true)}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Contestações ({pendingContests.length})
                        </Button>
                    )}
                    <Button onClick={() => openDiarioModal()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Diário
                    </Button>
                </div>
            </div>

            {/* Diarios List */}
            {diarios.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-xl border">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum diário de obras cadastrado.</p>
                    <Button className="mt-4" onClick={() => openDiarioModal()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Primeiro Diário
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {diarios.map((diario) => {
                        const isExpanded = expandedDiario === diario.id;
                        const details = diarioDetails[diario.id];

                        return (
                            <Collapsible key={diario.id} open={isExpanded}>
                                <div className="bg-card rounded-xl border overflow-hidden">
                                    <CollapsibleTrigger asChild>
                                        <button
                                            onClick={() => loadDiarioDetails(diario.id)}
                                            className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <Calendar className="h-5 w-5 text-primary" />
                                                <span className="font-medium">{formatDate(diario.data)}</span>
                                                <span className="text-sm text-muted-foreground">
                                                    {diario.total_atividades || 0} atividade(s)
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={(e) => { e.stopPropagation(); openDiarioModal(diario); }}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive"
                                                    onClick={(e) => { e.stopPropagation(); openDeleteDialog('diario', diario.id); }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                                            </div>
                                        </button>
                                    </CollapsibleTrigger>

                                    <CollapsibleContent>
                                        <div className="border-t p-4 space-y-4 bg-muted/30">
                                            {/* Add Activity Button */}
                                            <Button size="sm" variant="outline" onClick={() => openAtividadeModal(diario.id)}>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Adicionar Atividade
                                            </Button>

                                            {/* Activities */}
                                            {details?.atividades && details.atividades.length > 0 ? (
                                                <div className="space-y-2">
                                                    {details.atividades.map((atividade) => {
                                                        const statusInfo = STATUS_ATIVIDADE.find(s => s.value === atividade.status);
                                                        return (
                                                            <div key={atividade.id} className="bg-card p-3 rounded-lg border flex items-start justify-between gap-3">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", statusInfo?.color)}>
                                                                            {statusInfo?.label}
                                                                        </span>
                                                                        <span className="text-xs text-muted-foreground">{atividade.tipo}</span>
                                                                    </div>
                                                                    <p className="font-medium text-sm">{atividade.descricao}</p>
                                                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                                        <MapPin className="h-3 w-3" />
                                                                        {atividade.local}
                                                                    </p>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7"
                                                                        onClick={() => openAtividadeModal(diario.id, atividade)}
                                                                    >
                                                                        <Pencil className="h-3 w-3" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7 text-destructive"
                                                                        onClick={() => openDeleteDialog('atividade', atividade.id, diario.id)}
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground text-center py-4">
                                                    Nenhuma atividade registrada.
                                                </p>
                                            )}
                                        </div>
                                    </CollapsibleContent>
                                </div>
                            </Collapsible>
                        );
                    })}
                </div>
            )}

            {/* Diario Modal */}
            <Dialog open={diarioModalOpen} onOpenChange={setDiarioModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingDiario?.id ? "Editar Diário" : "Novo Diário"}</DialogTitle>
                        <DialogDescription>Preencha os dados do diário de obras.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Data *</Label>
                            <Input
                                type="date"
                                value={editingDiario?.data || ''}
                                onChange={(e) => setEditingDiario({ ...editingDiario, data: e.target.value })}
                                disabled={!!editingDiario?.id}
                            />
                        </div>
                        <div>
                            <Label>Observações</Label>
                            <Textarea
                                value={editingDiario?.observacoes || ''}
                                onChange={(e) => setEditingDiario({ ...editingDiario, observacoes: e.target.value })}
                                placeholder="Observações gerais do dia..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDiarioModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveDiario} disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Atividade Modal */}
            <Dialog open={atividadeModalOpen} onOpenChange={setAtividadeModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingAtividade?.id ? "Editar Atividade" : "Nova Atividade"}</DialogTitle>
                        <DialogDescription>Preencha os dados da atividade.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Descrição *</Label>
                            <Input
                                value={editingAtividade?.descricao || ''}
                                onChange={(e) => setEditingAtividade({ ...editingAtividade, descricao: e.target.value })}
                                placeholder="Ex: Pavimentação da Rua Principal"
                            />
                        </div>
                        <div>
                            <Label>Local *</Label>
                            <Input
                                value={editingAtividade?.local || ''}
                                onChange={(e) => setEditingAtividade({ ...editingAtividade, local: e.target.value })}
                                placeholder="Ex: Rua Principal, próximo à praça"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Tipo</Label>
                                <Select
                                    value={editingAtividade?.tipo || ''}
                                    onValueChange={(v) => setEditingAtividade({ ...editingAtividade, tipo: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {tipos.map((t) => (
                                            <SelectItem key={t.id} value={t.nome}>{t.nome}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Status</Label>
                                <Select
                                    value={editingAtividade?.status || 'pendente'}
                                    onValueChange={(v) => setEditingAtividade({ ...editingAtividade, status: v as any })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STATUS_ATIVIDADE.map((s) => (
                                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label>Observações</Label>
                            <Textarea
                                value={editingAtividade?.observacoes || ''}
                                onChange={(e) => setEditingAtividade({ ...editingAtividade, observacoes: e.target.value })}
                                placeholder="Observações sobre a atividade..."
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Foto da Atividade</Label>
                                <ImageUpload
                                    value={editingAtividade?.image_url || ''}
                                    onChange={(url) => setEditingAtividade({ ...editingAtividade, image_url: url })}
                                    category="diary"
                                    aspectRatio="video"
                                    recommendedSize="1280x720"
                                />
                            </div>
                            <div>
                                <Label>Vídeo da Atividade</Label>
                                <VideoUpload
                                    value={editingAtividade?.video_url || ''}
                                    onChange={(url) => setEditingAtividade({ ...editingAtividade, video_url: url })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAtividadeModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveAtividade} disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Contests Modal */}
            <Dialog open={contestsModalOpen} onOpenChange={setContestsModalOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Contestações Pendentes</DialogTitle>
                        <DialogDescription>Gerencie as contestações da comunidade.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {pendingContests.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">Nenhuma contestação pendente.</p>
                        ) : (
                            pendingContests.map((contest) => (
                                <div key={contest.id} className="border rounded-lg p-4 space-y-2">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-medium">{contest.nome_morador}</p>
                                            <p className="text-xs text-muted-foreground">{contest.contato}</p>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(contest.created_at).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                    <p className="text-sm bg-muted p-2 rounded">{contest.mensagem}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Atividade: {contest.atividade_descricao} | Local: {contest.atividade_local}
                                    </p>
                                    <div className="flex gap-2 pt-2">
                                        <Button size="sm" variant="outline" onClick={() => handleContestUpdate(contest.id, 'resolvida')}>
                                            <Check className="h-4 w-4 mr-1" />
                                            Resolver
                                        </Button>
                                        <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleContestUpdate(contest.id, 'rejeitada')}>
                                            <X className="h-4 w-4 mr-1" />
                                            Rejeitar
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir {deletingItem?.type === 'diario' ? 'este diário e todas suas atividades' : 'esta atividade'}? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
