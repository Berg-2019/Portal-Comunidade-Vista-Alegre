import { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Clock,
  Check,
  X,
  Wrench,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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

interface Court {
  id: string;
  name: string;
  type: string;
  description?: string;
  image_url?: string;
  available: boolean;
  maintenance_mode: boolean;
  maintenance_reason?: string;
  maintenance_start?: string;
  maintenance_end?: string;
  maintenance_periods?: any[];
}

interface TimeSlot {
  id: string;
  court_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  available: boolean;
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

const COURT_TYPES = [
  { value: "futsal", label: "Futsal" },
  { value: "volei", label: "Vôlei" },
  { value: "basquete", label: "Basquete" },
  { value: "society", label: "Society" },
  { value: "tenis", label: "Tênis" },
];

export default function AdminCourtsManager() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourt, setSelectedCourt] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [isCourtModalOpen, setIsCourtModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [slotForm, setSlotForm] = useState({
    startTime: "",
    endTime: "",
  });

  const [courtForm, setCourtForm] = useState({
    name: "",
    type: "futsal",
    description: "",
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    maintenance_mode: false,
    maintenance_reason: "",
    maintenance_start: "",
    maintenance_end: "",
  });

  useEffect(() => {
    loadCourts();
  }, []);

  useEffect(() => {
    if (selectedCourt) {
      loadSlots(selectedCourt);
    }
  }, [selectedCourt]);

  const loadCourts = async () => {
    try {
      const data = await api.getCourts();
      setCourts(data);
      if (data.length > 0 && !selectedCourt) {
        setSelectedCourt(data[0].id.toString());
      }
    } catch (error) {
      console.error("Error loading courts:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as quadras.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async (courtId: string) => {
    try {
      const data = await api.getCourtSlots(courtId);
      setTimeSlots(data.slots || []);
    } catch (error) {
      console.error("Error loading slots:", error);
    }
  };

  const filteredSlots = timeSlots
    .filter((slot) => slot.court_id?.toString() === selectedCourt && slot.day_of_week === selectedDay)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const toggleSlotAvailability = async (slot: TimeSlot) => {
    try {
      await api.updateCourtSlot(slot.id, !slot.available);
      toast({ title: "Disponibilidade alterada!" });
      loadSlots(selectedCourt);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar a disponibilidade.",
        variant: "destructive",
      });
    }
  };

  const deleteSlot = async (slotId: string) => {
    try {
      await api.deleteCourtSlot(slotId);
      toast({ title: "Horário removido!" });
      loadSlots(selectedCourt);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover o horário.",
        variant: "destructive",
      });
    }
  };

  const addSlot = async () => {
    if (!slotForm.startTime || !slotForm.endTime) {
      toast({
        title: "Erro",
        description: "Preencha os horários de início e fim.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await api.addCourtSlot(selectedCourt, {
        day_of_week: selectedDay,
        start_time: slotForm.startTime,
        end_time: slotForm.endTime,
      });
      toast({ title: "Horário adicionado!" });
      setIsSlotModalOpen(false);
      setSlotForm({ startTime: "", endTime: "" });
      loadSlots(selectedCourt);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o horário.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const openCourtModal = (court?: Court) => {
    if (court) {
      setEditingCourt(court);
      setCourtForm({
        name: court.name,
        type: court.type,
        description: court.description || "",
      });
    } else {
      setEditingCourt(null);
      setCourtForm({ name: "", type: "futsal", description: "" });
    }
    setIsCourtModalOpen(true);
  };

  const saveCourt = async () => {
    if (!courtForm.name) {
      toast({
        title: "Erro",
        description: "Preencha o nome da quadra.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", courtForm.name);
      formData.append("type", courtForm.type);
      formData.append("description", courtForm.description);

      if (editingCourt) {
        await api.updateCourt(editingCourt.id, formData);
        toast({ title: "Quadra atualizada!" });
      } else {
        await api.createCourt(formData);
        toast({ title: "Quadra criada!" });
      }

      setIsCourtModalOpen(false);
      loadCourts();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a quadra.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteCourt = async (courtId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta quadra?")) return;

    try {
      await api.deleteCourt(courtId);
      toast({ title: "Quadra removida!" });
      if (selectedCourt === courtId) {
        setSelectedCourt("");
      }
      loadCourts();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover a quadra.",
        variant: "destructive",
      });
    }
  };

  const openMaintenanceModal = (court: Court) => {
    setEditingCourt(court);
    setMaintenanceForm({
      maintenance_mode: court.maintenance_mode,
      maintenance_reason: court.maintenance_reason || "",
      maintenance_start: court.maintenance_start?.split("T")[0] || "",
      maintenance_end: court.maintenance_end?.split("T")[0] || "",
    });
    setIsMaintenanceModalOpen(true);
  };

  const saveMaintenance = async () => {
    if (!editingCourt) return;

    setSaving(true);
    try {
      await api.updateCourtMaintenance(editingCourt.id, {
        maintenance_mode: maintenanceForm.maintenance_mode,
        maintenance_reason: maintenanceForm.maintenance_reason,
        maintenance_start: maintenanceForm.maintenance_start || undefined,
        maintenance_end: maintenanceForm.maintenance_end || undefined,
      });
      toast({
        title: maintenanceForm.maintenance_mode
          ? "Manutenção ativada!"
          : "Manutenção desativada!",
      });
      setIsMaintenanceModalOpen(false);
      loadCourts();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a manutenção.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Courts Management */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold">Quadras Cadastradas</h3>
          <Button size="sm" onClick={() => openCourtModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Quadra
          </Button>
        </div>

        <div className="grid gap-3">
          {courts.map((court) => (
            <div
              key={court.id}
              className={cn(
                "flex items-center justify-between p-4 rounded-lg border transition-colors",
                selectedCourt === court.id.toString()
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50",
                court.maintenance_mode && "bg-warning/5 border-warning/30"
              )}
            >
              <button
                className="flex-1 text-left"
                onClick={() => setSelectedCourt(court.id.toString())}
              >
                <div className="flex items-center gap-2">
                  <p className="font-medium">{court.name}</p>
                  {court.maintenance_mode && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
                      <Wrench className="h-3 w-3" />
                      Em Manutenção
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground capitalize">
                  {COURT_TYPES.find((t) => t.value === court.type)?.label || court.type}
                </p>
              </button>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openMaintenanceModal(court)}
                  title="Manutenção"
                  className={court.maintenance_mode ? "text-warning" : ""}
                >
                  <Wrench className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openCourtModal(court)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => deleteCourt(court.id.toString())}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {courts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma quadra cadastrada
            </div>
          )}
        </div>
      </div>

      {/* Time Slots Management */}
      {selectedCourt && (
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-heading font-semibold">Gerenciar Horários</h3>
              <p className="text-sm text-muted-foreground">
                {courts.find((c) => c.id.toString() === selectedCourt)?.name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select
                value={selectedDay.toString()}
                onValueChange={(value) => setSelectedDay(parseInt(value))}
              >
                <SelectTrigger className="w-[140px]">
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
              <Button size="sm" onClick={() => setIsSlotModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Horário
              </Button>
            </div>
          </div>

          <div className="grid gap-3">
            {filteredSlots.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhum horário cadastrado para {DAYS_OF_WEEK[selectedDay]}
                </p>
              </div>
            ) : (
              filteredSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-4">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <span className="font-mono font-medium">
                      {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                    </span>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        slot.available
                          ? "bg-success/10 text-success"
                          : "bg-destructive/10 text-destructive"
                      )}
                    >
                      {slot.available ? "Disponível" : "Indisponível"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSlotAvailability(slot)}
                      title={slot.available ? "Desativar" : "Ativar"}
                    >
                      {slot.available ? (
                        <X className="h-4 w-4 text-destructive" />
                      ) : (
                        <Check className="h-4 w-4 text-success" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteSlot(slot.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Add Slot Modal */}
      <Dialog open={isSlotModalOpen} onOpenChange={setIsSlotModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Horário</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Quadra: {courts.find((c) => c.id.toString() === selectedCourt)?.name}
              <br />
              Dia: {DAYS_OF_WEEK[selectedDay]}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Início *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={slotForm.startTime}
                  onChange={(e) =>
                    setSlotForm({ ...slotForm, startTime: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Fim *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={slotForm.endTime}
                  onChange={(e) =>
                    setSlotForm({ ...slotForm, endTime: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSlotModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={addSlot} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Court Modal */}
      <Dialog open={isCourtModalOpen} onOpenChange={setIsCourtModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCourt ? "Editar Quadra" : "Nova Quadra"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="courtName">Nome *</Label>
              <Input
                id="courtName"
                value={courtForm.name}
                onChange={(e) =>
                  setCourtForm({ ...courtForm, name: e.target.value })
                }
                placeholder="Nome da quadra"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="courtType">Tipo *</Label>
              <Select
                value={courtForm.type}
                onValueChange={(value) =>
                  setCourtForm({ ...courtForm, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COURT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="courtDescription">Descrição</Label>
              <Textarea
                id="courtDescription"
                value={courtForm.description}
                onChange={(e) =>
                  setCourtForm({ ...courtForm, description: e.target.value })
                }
                placeholder="Descrição da quadra"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCourtModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveCourt} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingCourt ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Maintenance Modal */}
      <Dialog open={isMaintenanceModalOpen} onOpenChange={setIsMaintenanceModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Gerenciar Manutenção
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Quadra: <strong>{editingCourt?.name}</strong>
            </p>

            <div className="flex items-center justify-between">
              <div>
                <Label>Ativar Manutenção</Label>
                <p className="text-xs text-muted-foreground">
                  Bloqueia todas as reservas
                </p>
              </div>
              <Switch
                checked={maintenanceForm.maintenance_mode}
                onCheckedChange={(checked) =>
                  setMaintenanceForm({ ...maintenanceForm, maintenance_mode: checked })
                }
              />
            </div>

            {maintenanceForm.maintenance_mode && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="maintenanceReason">Motivo</Label>
                  <Input
                    id="maintenanceReason"
                    value={maintenanceForm.maintenance_reason}
                    onChange={(e) =>
                      setMaintenanceForm({
                        ...maintenanceForm,
                        maintenance_reason: e.target.value,
                      })
                    }
                    placeholder="Ex: Pintura, reparo na rede..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maintenanceStart">Data Início</Label>
                    <Input
                      id="maintenanceStart"
                      type="date"
                      value={maintenanceForm.maintenance_start}
                      onChange={(e) =>
                        setMaintenanceForm({
                          ...maintenanceForm,
                          maintenance_start: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maintenanceEnd">Previsão Término</Label>
                    <Input
                      id="maintenanceEnd"
                      type="date"
                      value={maintenanceForm.maintenance_end}
                      onChange={(e) =>
                        setMaintenanceForm({
                          ...maintenanceForm,
                          maintenance_end: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                    <p className="text-xs text-warning">
                      Com a manutenção ativada, os usuários não poderão fazer
                      reservas nesta quadra até que seja desativada.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsMaintenanceModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={saveMaintenance} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
