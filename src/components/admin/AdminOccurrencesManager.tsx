import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Eye,
  EyeOff,
  Trash2,
  MapPin,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  MessageSquare,
  Loader2,
  RefreshCw,
  Check,
  X,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";

interface Occurrence {
  id: number;
  title: string | null;
  description: string;
  category: string;
  location: string;
  reporter_name: string;
  reporter_phone: string | null;
  status: string;
  priority: string;
  image_url: string | null;
  admin_notes: string | null;
  published: boolean;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Stats {
  total: string;
  pending: string;
  in_progress: string;
  resolved: string;
  rejected: string;
  published: string;
  urgent: string;
  high_priority: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; class: string }> = {
  pending: { label: "Pendente", icon: Clock, class: "bg-warning/10 text-warning" },
  in_progress: { label: "Em Andamento", icon: AlertCircle, class: "bg-info/10 text-info" },
  resolved: { label: "Resolvida", icon: CheckCircle, class: "bg-success/10 text-success" },
  rejected: { label: "Rejeitada", icon: XCircle, class: "bg-destructive/10 text-destructive" },
};

const PRIORITY_CONFIG: Record<string, { label: string; class: string }> = {
  low: { label: "Baixa", class: "bg-muted text-muted-foreground" },
  normal: { label: "Normal", class: "bg-muted text-foreground" },
  high: { label: "Alta", class: "bg-warning/10 text-warning" },
  urgent: { label: "Urgente", class: "bg-destructive/10 text-destructive" },
};

const CATEGORIES: Record<string, string> = {
  iluminacao: "Iluminação",
  buraco: "Buracos/Vias",
  agua: "Água/Esgoto",
  lixo: "Lixo/Limpeza",
  seguranca: "Segurança",
  outros: "Outros",
};

export default function AdminOccurrencesManager() {
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOccurrence, setSelectedOccurrence] = useState<Occurrence | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [occurrencesData, statsData] = await Promise.all([
        api.getAllOccurrences(),
        api.getOccurrenceStats(),
      ]);
      setOccurrences(occurrencesData);
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro ao carregar ocorrências',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredOccurrences = occurrences.filter((item) => {
    const title = item.title || '';
    const matchesSearch =
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reporter_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const openDetailModal = (occurrence: Occurrence) => {
    setSelectedOccurrence(occurrence);
    setAdminNotes(occurrence.admin_notes || "");
    setIsModalOpen(true);
  };

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      await api.approveOccurrence(String(id));
      toast({ title: "Ocorrência aprovada e publicada!" });
      loadData();
    } catch (error: any) {
      toast({
        title: "Erro ao aprovar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    setActionLoading(id);
    try {
      await api.rejectOccurrence(String(id));
      toast({ title: "Ocorrência rejeitada!" });
      loadData();
    } catch (error: any) {
      toast({
        title: "Erro ao rejeitar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolve = async (id: number) => {
    setActionLoading(id);
    try {
      await api.resolveOccurrence(String(id));
      toast({ title: "Ocorrência marcada como resolvida!" });
      loadData();
    } catch (error: any) {
      toast({
        title: "Erro ao resolver",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    setActionLoading(id);
    try {
      await api.updateOccurrence(String(id), { status: newStatus });
      toast({ title: `Status alterado para ${STATUS_CONFIG[newStatus]?.label || newStatus}` });
      loadData();
    } catch (error: any) {
      toast({
        title: "Erro ao alterar status",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublishToggle = async (id: number, currentPublished: boolean) => {
    setActionLoading(id);
    try {
      await api.updateOccurrence(String(id), { published: !currentPublished });
      toast({ title: currentPublished ? "Ocorrência despublicada!" : "Ocorrência publicada!" });
      loadData();
    } catch (error: any) {
      toast({
        title: "Erro ao alterar publicação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedOccurrence) return;
    try {
      await api.updateOccurrence(String(selectedOccurrence.id), { admin_notes: adminNotes });
      setIsModalOpen(false);
      toast({ title: "Observações salvas!" });
      loadData();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.deleteOccurrence(String(deleteId));
      toast({ title: "Ocorrência excluída!" });
      setDeleteId(null);
      loadData();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <AlertCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{stats?.total || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold">{stats?.pending || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10">
              <AlertCircle className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Em Andamento</p>
              <p className="text-2xl font-bold">{stats?.in_progress || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Resolvidas</p>
              <p className="text-2xl font-bold">{stats?.resolved || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, local ou nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="resolved">Resolvida</SelectItem>
            <SelectItem value="rejected">Rejeitada</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Occurrences List */}
      <div className="space-y-4">
        {filteredOccurrences.length === 0 ? (
          <div className="bg-card rounded-xl p-12 shadow-sm border border-border text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma ocorrência encontrada</p>
          </div>
        ) : (
          filteredOccurrences.map((occurrence) => {
            const statusConfig = STATUS_CONFIG[occurrence.status] || STATUS_CONFIG.pending;
            const priorityConfig = PRIORITY_CONFIG[occurrence.priority] || PRIORITY_CONFIG.normal;
            const StatusIcon = statusConfig.icon;
            const isLoading = actionLoading === occurrence.id;

            return (
              <div
                key={occurrence.id}
                className="bg-card rounded-xl p-4 shadow-sm border border-border"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", statusConfig.class)}>
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.label}
                      </span>
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", priorityConfig.class)}>
                        {priorityConfig.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted">
                        {CATEGORIES[occurrence.category] || occurrence.category}
                      </span>
                      {occurrence.published ? (
                        <Badge variant="default" className="bg-success/10 text-success hover:bg-success/20">
                          Publicado
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          Não publicado
                        </Badge>
                      )}
                    </div>
                    
                    <h4 className="font-medium text-lg mb-1">
                      {occurrence.title || `Ocorrência de ${CATEGORIES[occurrence.category] || occurrence.category}`}
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {occurrence.description}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {occurrence.location}
                      </span>
                      <span>Reportado por: {occurrence.reporter_name}</span>
                      {occurrence.reporter_phone && (
                        <a 
                          href={`https://wa.me/${occurrence.reporter_phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Phone className="h-4 w-4" />
                          {occurrence.reporter_phone}
                        </a>
                      )}
                      <span>
                        {new Date(occurrence.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {/* Quick Actions for Pending */}
                    {occurrence.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(occurrence.id)}
                          disabled={isLoading}
                          className="bg-success hover:bg-success/90"
                        >
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(occurrence.id)}
                          disabled={isLoading}
                        >
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-1" />}
                          Rejeitar
                        </Button>
                      </div>
                    )}

                    {/* Resolve button for in_progress */}
                    {occurrence.status === 'in_progress' && (
                      <Button
                        size="sm"
                        onClick={() => handleResolve(occurrence.id)}
                        disabled={isLoading}
                        className="bg-success hover:bg-success/90"
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                        Resolver
                      </Button>
                    )}

                    {/* Status Select */}
                    <Select
                      value={occurrence.status}
                      onValueChange={(value) => handleStatusChange(occurrence.id, value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="in_progress">Em Andamento</SelectItem>
                        <SelectItem value="resolved">Resolvida</SelectItem>
                        <SelectItem value="rejected">Rejeitada</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePublishToggle(occurrence.id, occurrence.published)}
                        disabled={isLoading}
                        title={occurrence.published ? "Despublicar" : "Publicar"}
                      >
                        {occurrence.published ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetailModal(occurrence)}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(occurrence.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* WhatsApp Info */}
      <div className="bg-info/10 border border-info/20 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <MessageSquare className="h-6 w-6 text-info flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-heading font-semibold text-info mb-2">
              Recebimento via WhatsApp Bot
            </h3>
            <p className="text-sm text-muted-foreground">
              As ocorrências são recebidas via WhatsApp Bot e aparecem aqui automaticamente como "Pendente". 
              Analise cada ocorrência e clique em "Aprovar" para publicar ou "Rejeitar" para descartar.
            </p>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Ocorrência</DialogTitle>
          </DialogHeader>

          {selectedOccurrence && (
            <div className="space-y-4 py-4">
              <div>
                <h4 className="font-medium mb-1">
                  {selectedOccurrence.title || `Ocorrência de ${CATEGORIES[selectedOccurrence.category] || selectedOccurrence.category}`}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {selectedOccurrence.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Local:</span>
                  <p className="font-medium">{selectedOccurrence.location}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Categoria:</span>
                  <p className="font-medium">
                    {CATEGORIES[selectedOccurrence.category] || selectedOccurrence.category}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Reportado por:</span>
                  <p className="font-medium">{selectedOccurrence.reporter_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Telefone:</span>
                  <p className="font-medium">{selectedOccurrence.reporter_phone || "Não informado"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Data:</span>
                  <p className="font-medium">
                    {new Date(selectedOccurrence.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Prioridade:</span>
                  <p className="font-medium">
                    {PRIORITY_CONFIG[selectedOccurrence.priority]?.label || selectedOccurrence.priority}
                  </p>
                </div>
              </div>

              {selectedOccurrence.image_url && (
                <div>
                  <span className="text-sm text-muted-foreground">Imagem:</span>
                  <img 
                    src={selectedOccurrence.image_url} 
                    alt="Foto da ocorrência" 
                    className="mt-2 rounded-lg max-h-48 object-cover"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="adminNotes">Observações Internas (Admin)</Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Adicione observações sobre esta ocorrência..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveNotes}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Ocorrência</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta ocorrência? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
