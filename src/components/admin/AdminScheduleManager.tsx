import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Users,
  Phone,
  CheckCircle,
  XCircle,
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
import { FixedSchedule, Court, CourtType } from "@/types";

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

const initialCourts: Court[] = [
  { id: "1", name: "Quadra Poliesportiva Central", type: "futsal" as CourtType, available: true },
  { id: "2", name: "Quadra de Vôlei", type: "volei" as CourtType, available: true },
];

const initialSchedules: FixedSchedule[] = [
  {
    id: "1",
    courtId: "1",
    projectName: "Escolinha de Futsal Sub-12",
    projectType: "escola",
    dayOfWeek: 2,
    startTime: "14:00",
    endTime: "16:00",
    responsible: "Prof. Carlos Silva",
    phone: "(69) 99999-0001",
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    courtId: "1",
    projectName: "Projeto Esporte para Todos",
    projectType: "projeto_social",
    dayOfWeek: 4,
    startTime: "08:00",
    endTime: "10:00",
    responsible: "Maria Santos",
    phone: "(69) 99999-0002",
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    courtId: "2",
    projectName: "Treino Vôlei Feminino",
    projectType: "treino",
    dayOfWeek: 3,
    startTime: "19:00",
    endTime: "21:00",
    responsible: "Técnica Ana Paula",
    phone: "(69) 99999-0003",
    active: true,
    createdAt: new Date().toISOString(),
  },
];

export default function AdminScheduleManager() {
  const [courts] = useState<Court[]>(initialCourts);
  const [schedules, setSchedules] = useState<FixedSchedule[]>(initialSchedules);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<FixedSchedule | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    courtId: "",
    projectName: "",
    projectType: "escola" as FixedSchedule["projectType"],
    dayOfWeek: 1,
    startTime: "",
    endTime: "",
    responsible: "",
    phone: "",
  });

  const resetForm = () => {
    setFormData({
      courtId: courts[0]?.id || "",
      projectName: "",
      projectType: "escola",
      dayOfWeek: 1,
      startTime: "",
      endTime: "",
      responsible: "",
      phone: "",
    });
    setEditingSchedule(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (schedule: FixedSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      courtId: schedule.courtId,
      projectName: schedule.projectName,
      projectType: schedule.projectType,
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      responsible: schedule.responsible,
      phone: schedule.phone || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.courtId || !formData.projectName || !formData.startTime || !formData.endTime || !formData.responsible) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (editingSchedule) {
      setSchedules((prev) =>
        prev.map((item) =>
          item.id === editingSchedule.id
            ? { ...item, ...formData }
            : item
        )
      );
      toast({ title: "Agendamento atualizado!" });
    } else {
      const newSchedule: FixedSchedule = {
        id: Date.now().toString(),
        ...formData,
        active: true,
        createdAt: new Date().toISOString(),
      };
      setSchedules((prev) => [...prev, newSchedule]);
      toast({ title: "Agendamento criado!" });
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    setSchedules((prev) => prev.filter((item) => item.id !== id));
    toast({ title: "Agendamento excluído!" });
  };

  const toggleActive = (id: string) => {
    setSchedules((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, active: !item.active } : item
      )
    );
    toast({ title: "Status alterado!" });
  };

  const getCourtName = (courtId: string) => {
    return courts.find((c) => c.id === courtId)?.name || "Quadra não encontrada";
  };

  const getProjectTypeLabel = (type: FixedSchedule["projectType"]) => {
    return PROJECT_TYPES.find((t) => t.value === type)?.label || type;
  };

  const groupedByDay = DAYS_OF_WEEK.map((day, index) => ({
    day,
    dayIndex: index,
    schedules: schedules.filter((s) => s.dayOfWeek === index),
  })).filter((group) => group.schedules.length > 0);

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
                {schedules.filter((s) => s.projectType === "escola").length}
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
                {schedules.filter((s) => s.projectType === "projeto_social").length}
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
                            {getProjectTypeLabel(schedule.projectType)}
                          </span>
                        </div>
                        <h4 className="font-medium text-lg">{schedule.projectName}</h4>
                        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                          <p className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {getCourtName(schedule.courtId)}
                          </p>
                          <p className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {schedule.startTime} - {schedule.endTime}
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
              <Label htmlFor="projectName">Nome do Projeto/Escolinha *</Label>
              <Input
                id="projectName"
                value={formData.projectName}
                onChange={(e) =>
                  setFormData({ ...formData, projectName: e.target.value })
                }
                placeholder="Ex: Escolinha de Futsal Sub-12"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select
                  value={formData.projectType}
                  onValueChange={(value: FixedSchedule["projectType"]) =>
                    setFormData({ ...formData, projectType: value })
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
                  value={formData.courtId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, courtId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {courts.map((court) => (
                      <SelectItem key={court.id} value={court.id}>
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
                value={formData.dayOfWeek.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, dayOfWeek: parseInt(value) })
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
                <Label htmlFor="startTime">Horário Início *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Horário Fim *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
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
                placeholder="(69) 99999-0000"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingSchedule ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
