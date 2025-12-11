import { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Users,
  Phone,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { api } from "@/services/api";

interface Schedule {
  id: number;
  court_id: number;
  court_name?: string;
  project_name: string;
  project_type: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  responsible: string;
  phone?: string;
  active: boolean;
  created_at: string;
}

interface Court {
  id: number;
  name: string;
  type: string;
}

const DAYS_OF_WEEK = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

const PROJECT_TYPES = [
  { value: "escola", label: "Escolinha Esportiva" },
  { value: "projeto_social", label: "Projeto Social" },
  { value: "treino", label: "Treino de Equipe" },
  { value: "outro", label: "Outro" },
] as const;

export default function AdminScheduleManager() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    court_id: "",
    project_name: "",
    project_type: "escola",
    day_of_week: 1,
    start_time: "",
    end_time: "",
    responsible: "",
    phone: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [courtsData, schedulesData] = await Promise.all([
        api.getCourts(),
        api.getSchedules(),
      ]);
      setCourts(courtsData);
      setSchedules(schedulesData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      court_id: courts[0]?.id?.toString() || "",
      project_name: "",
      project_type: "escola",
      day_of_week: 1,
      start_time: "",
      end_time: "",
      responsible: "",
      phone: "",
    });
    setEditingSchedule(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      court_id: schedule.court_id.toString(),
      project_name: schedule.project_name,
      project_type: schedule.project_type,
      day_of_week: schedule.day_of_week,
      start_time: schedule.start_time.slice(0, 5),
      end_time: schedule.end_time.slice(0, 5),
      responsible: schedule.responsible,
      phone: schedule.phone || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.court_id || !formData.project_name || !formData.start_time || !formData.end_time || !formData.responsible) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        court_id: parseInt(formData.court_id),
        project_name: formData.project_name,
        project_type: formData.project_type,
        day_of_week: formData.day_of_week,
        start_time: formData.start_time,
        end_time: formData.end_time,
        responsible: formData.responsible,
        phone: formData.phone || undefined,
      };

      if (editingSchedule) {
        await api.updateSchedule(editingSchedule.id.toString(), data);
        toast({ title: "Agendamento atualizado!" });
      } else {
        await api.createSchedule(data);
        toast({ title: "Agendamento criado!" });
      }

      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar agendamento",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteSchedule(id.toString());
      setSchedules((prev) => prev.filter((item) => item.id !== id));
      toast({ title: "Agendamento excluído!" });
    } catch (error) {
      console.error("Error deleting schedule:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir agendamento",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (id: number) => {
    try {
      const result = await api.toggleSchedule(id.toString());
      setSchedules((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, active: result.schedule.active } : item
        )
      );
      toast({ title: "Status alterado!" });
    } catch (error) {
      console.error("Error toggling schedule:", error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status",
        variant: "destructive",
      });
    }
  };

  const getCourtName = (courtId: number) => {
    return courts.find((c) => c.id === courtId)?.name || "Quadra não encontrada";
  };

  const getProjectTypeLabel = (type: string) => {
    return PROJECT_TYPES.find((t) => t.value === type)?.label || type;
  };

  const groupedByDay = DAYS_OF_WEEK.map((day, index) => ({
    day,
    dayIndex: index,
    schedules: schedules.filter((s) => s.day_of_week === index),
  })).filter((group) => group.schedules.length > 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Gerencie os horários fixos reservados para escolinhas e projetos sociais
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{schedules.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ativos</p>
              <p className="text-2xl font-bold">
                {schedules.filter((s) => s.active).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10">
              <Users className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Escolinhas</p>
              <p className="text-2xl font-bold">
                {schedules.filter((s) => s.project_type === "escola").length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Users className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Projetos</p>
              <p className="text-2xl font-bold">
                {schedules.filter((s) => s.project_type === "projeto_social").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule List by Day */}
      {groupedByDay.length === 0 ? (
        <div className="bg-card rounded-xl p-12 shadow-sm border border-border text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhum agendamento fixo cadastrado</p>
          <Button className="mt-4" onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            Criar primeiro agendamento
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByDay.map((group) => (
            <div key={group.dayIndex} className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="bg-muted px-6 py-3">
                <h3 className="font-heading font-semibold">{group.day}</h3>
              </div>
              <div className="divide-y divide-border">
                {group.schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className={cn(
                      "p-4 transition-colors",
                      !schedule.active && "opacity-50"
                    )}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-xs font-medium",
                              schedule.active
                                ? "bg-success/10 text-success"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {schedule.active ? "Ativo" : "Inativo"}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {getProjectTypeLabel(schedule.project_type)}
                          </span>
                        </div>
                        <h4 className="font-medium text-lg">{schedule.project_name}</h4>
                        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                          <p className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {schedule.court_name || getCourtName(schedule.court_id)}
                          </p>
                          <p className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                          </p>
                          <p className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {schedule.responsible}
                          </p>
                          {schedule.phone && (
                            <p className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              {schedule.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActive(schedule.id)}
                          title={schedule.active ? "Desativar" : "Ativar"}
                        >
                          {schedule.active ? (
                            <XCircle className="h-4 w-4 text-destructive" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-success" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(schedule)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(schedule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSchedule ? "Editar Agendamento" : "Novo Agendamento Fixo"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project_name">Nome do Projeto/Escolinha *</Label>
              <Input
                id="project_name"
                value={formData.project_name}
                onChange={(e) =>
                  setFormData({ ...formData, project_name: e.target.value })
                }
                placeholder="Ex: Escolinha de Futsal Sub-12"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select
                  value={formData.project_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, project_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quadra *</Label>
                <Select
                  value={formData.court_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, court_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {courts.map((court) => (
                      <SelectItem key={court.id} value={court.id.toString()}>
                        {court.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Dia da Semana *</Label>
              <Select
                value={formData.day_of_week.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, day_of_week: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Horário Início *</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) =>
                    setFormData({ ...formData, start_time: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">Horário Fim *</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) =>
                    setFormData({ ...formData, end_time: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsible">Responsável *</Label>
              <Input
                id="responsible"
                value={formData.responsible}
                onChange={(e) =>
                  setFormData({ ...formData, responsible: e.target.value })
                }
                placeholder="Nome do responsável"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="(99) 99999-9999"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingSchedule ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
