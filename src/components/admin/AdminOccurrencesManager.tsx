import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Occurrence, OccurrenceStatus } from "@/types";
import { occurrences as initialOccurrences, occurrenceCategories } from "@/data/mockData";

const STATUS_CONFIG: Record<OccurrenceStatus, { label: string; icon: typeof Clock; class: string }> = {
  pendente: { label: "Pendente", icon: Clock, class: "bg-warning/10 text-warning" },
  em_analise: { label: "Em Análise", icon: AlertCircle, class: "bg-info/10 text-info" },
  em_andamento: { label: "Em Andamento", icon: Clock, class: "bg-primary/10 text-primary" },
  resolvida: { label: "Resolvida", icon: CheckCircle, class: "bg-success/10 text-success" },
  rejeitada: { label: "Rejeitada", icon: XCircle, class: "bg-destructive/10 text-destructive" },
};

export default function AdminOccurrencesManager() {
  const [occurrencesList, setOccurrencesList] = useState<Occurrence[]>(initialOccurrences);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOccurrence, setSelectedOccurrence] = useState<Occurrence | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const { toast } = useToast();

  const filteredOccurrences = occurrencesList.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: occurrencesList.length,
    pendente: occurrencesList.filter((o) => o.status === "pendente").length,
    em_andamento: occurrencesList.filter((o) => o.status === "em_andamento" || o.status === "em_analise").length,
    resolvida: occurrencesList.filter((o) => o.status === "resolvida").length,
  };

  const openDetailModal = (occurrence: Occurrence) => {
    setSelectedOccurrence(occurrence);
    setAdminNotes(occurrence.adminNotes || "");
    setIsModalOpen(true);
  };

  const handleStatusChange = (id: string, newStatus: OccurrenceStatus) => {
    setOccurrencesList((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: newStatus, updatedAt: new Date().toISOString() }
          : item
      )
    );
    toast({ title: `Status alterado para ${STATUS_CONFIG[newStatus].label}` });
  };

  const handlePublishToggle = (id: string) => {
    setOccurrencesList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, published: !item.published } : item
      )
    );
    toast({ title: "Status de publicação alterado!" });
  };

  const handleSaveNotes = () => {
    if (!selectedOccurrence) return;
    setOccurrencesList((prev) =>
      prev.map((item) =>
        item.id === selectedOccurrence.id
          ? { ...item, adminNotes }
          : item
      )
    );
    setIsModalOpen(false);
    toast({ title: "Observações salvas!" });
  };

  const handleDelete = (id: string) => {
    setOccurrencesList((prev) => prev.filter((item) => item.id !== id));
    toast({ title: "Ocorrência excluída!" });
  };

  const getCategoryName = (categoryId: string) => {
    return occurrenceCategories.find((c) => c.id === categoryId)?.name || "Sem categoria";
  };

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
              <p className="text-2xl font-bold">{stats.total}</p>
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
              <p className="text-2xl font-bold">{stats.pendente}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10">
              <Clock className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Em Andamento</p>
              <p className="text-2xl font-bold">{stats.em_andamento}</p>
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
              <p className="text-2xl font-bold">{stats.resolvida}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou local..."
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
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="em_analise">Em Análise</SelectItem>
            <SelectItem value="em_andamento">Em Andamento</SelectItem>
            <SelectItem value="resolvida">Resolvida</SelectItem>
            <SelectItem value="rejeitada">Rejeitada</SelectItem>
          </SelectContent>
        </Select>
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
            const statusConfig = STATUS_CONFIG[occurrence.status];
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={occurrence.id}
                className="bg-card rounded-xl p-4 shadow-sm border border-border"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", statusConfig.class)}>
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted">
                        {getCategoryName(occurrence.categoryId)}
                      </span>
                      {occurrence.published ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                          Publicado
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                          Não publicado
                        </span>
                      )}
                    </div>
                    <h4 className="font-medium text-lg mb-1">{occurrence.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {occurrence.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {occurrence.location}
                      </span>
                      {occurrence.userName && (
                        <span>Reportado por: {occurrence.userName}</span>
                      )}
                      <span>
                        {new Date(occurrence.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Select
                      value={occurrence.status}
                      onValueChange={(value: OccurrenceStatus) =>
                        handleStatusChange(occurrence.id, value)
                      }
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="em_analise">Em Análise</SelectItem>
                        <SelectItem value="em_andamento">Em Andamento</SelectItem>
                        <SelectItem value="resolvida">Resolvida</SelectItem>
                        <SelectItem value="rejeitada">Rejeitada</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePublishToggle(occurrence.id)}
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
                        onClick={() => handleDelete(occurrence.id)}
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
              Recebimento via WhatsApp
            </h3>
            <p className="text-sm text-muted-foreground">
              As ocorrências são recebidas via WhatsApp Bot e aparecem aqui automaticamente como "Pendente". 
              Analise cada ocorrência e decida se deve ser publicada na listagem pública do site.
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
                <h4 className="font-medium mb-1">{selectedOccurrence.title}</h4>
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
                    {getCategoryName(selectedOccurrence.categoryId)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Reportado por:</span>
                  <p className="font-medium">
                    {selectedOccurrence.userName || "Anônimo"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Data:</span>
                  <p className="font-medium">
                    {new Date(selectedOccurrence.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>

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
    </div>
  );
}
