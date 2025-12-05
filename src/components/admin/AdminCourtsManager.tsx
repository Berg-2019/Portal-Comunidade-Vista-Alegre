import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Clock,
  Check,
  X,
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
import { Court, TimeSlot, CourtType } from "@/types";

const DAYS_OF_WEEK = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

const COURT_TYPES: { value: CourtType; label: string }[] = [
  { value: "futsal", label: "Futsal" },
  { value: "volei", label: "Vôlei" },
  { value: "basquete", label: "Basquete" },
  { value: "society", label: "Society" },
];

const initialCourts: Court[] = [
  { id: "1", name: "Quadra Poliesportiva Central", type: "futsal", available: true },
  { id: "2", name: "Quadra de Vôlei", type: "volei", available: true },
];

const generateInitialSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const times = ["06:00", "07:00", "08:00", "09:00", "10:00", "16:00", "17:00", "18:00", "19:00", "20:00"];
  
  initialCourts.forEach((court) => {
    for (let day = 0; day <= 6; day++) {
      times.forEach((time, index) => {
        const endHour = parseInt(time.split(":")[0]) + 1;
        slots.push({
          id: `${court.id}-${day}-${index}`,
          courtId: court.id,
          dayOfWeek: day,
          startTime: time,
          endTime: `${endHour.toString().padStart(2, "0")}:00`,
          available: true,
        });
      });
    }
  });
  
  return slots;
};

export default function AdminCourtsManager() {
  const [courts, setCourts] = useState<Court[]>(initialCourts);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(generateInitialSlots());
  const [selectedCourt, setSelectedCourt] = useState<string>(courts[0]?.id || "");
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [isCourtModalOpen, setIsCourtModalOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const { toast } = useToast();

  const [slotForm, setSlotForm] = useState({
    startTime: "",
    endTime: "",
  });

  const [courtForm, setCourtForm] = useState({
    name: "",
    type: "futsal" as CourtType,
  });

  const filteredSlots = timeSlots
    .filter((slot) => slot.courtId === selectedCourt && slot.dayOfWeek === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const toggleSlotAvailability = (slotId: string) => {
    setTimeSlots((prev) =>
      prev.map((slot) =>
        slot.id === slotId ? { ...slot, available: !slot.available } : slot
      )
    );
    toast({ title: "Disponibilidade alterada!" });
  };

  const deleteSlot = (slotId: string) => {
    setTimeSlots((prev) => prev.filter((slot) => slot.id !== slotId));
    toast({ title: "Horário removido!" });
  };

  const addSlot = () => {
    if (!slotForm.startTime || !slotForm.endTime) {
      toast({
        title: "Erro",
        description: "Preencha os horários de início e fim.",
        variant: "destructive",
      });
      return;
    }

    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      courtId: selectedCourt,
      dayOfWeek: selectedDay,
      startTime: slotForm.startTime,
      endTime: slotForm.endTime,
      available: true,
    };

    setTimeSlots((prev) => [...prev, newSlot]);
    setIsSlotModalOpen(false);
    setSlotForm({ startTime: "", endTime: "" });
    toast({ title: "Horário adicionado!" });
  };

  const openCourtModal = (court?: Court) => {
    if (court) {
      setEditingCourt(court);
      setCourtForm({ name: court.name, type: court.type });
    } else {
      setEditingCourt(null);
      setCourtForm({ name: "", type: "futsal" });
    }
    setIsCourtModalOpen(true);
  };

  const saveCourt = () => {
    if (!courtForm.name) {
      toast({
        title: "Erro",
        description: "Preencha o nome da quadra.",
        variant: "destructive",
      });
      return;
    }

    if (editingCourt) {
      setCourts((prev) =>
        prev.map((court) =>
          court.id === editingCourt.id
            ? { ...court, name: courtForm.name, type: courtForm.type }
            : court
        )
      );
      toast({ title: "Quadra atualizada!" });
    } else {
      const newCourt: Court = {
        id: Date.now().toString(),
        name: courtForm.name,
        type: courtForm.type,
        available: true,
      };
      setCourts((prev) => [...prev, newCourt]);
      setSelectedCourt(newCourt.id);
      toast({ title: "Quadra criada!" });
    }

    setIsCourtModalOpen(false);
  };

  const deleteCourt = (courtId: string) => {
    setCourts((prev) => prev.filter((court) => court.id !== courtId));
    setTimeSlots((prev) => prev.filter((slot) => slot.courtId !== courtId));
    if (selectedCourt === courtId && courts.length > 1) {
      setSelectedCourt(courts.find((c) => c.id !== courtId)?.id || "");
    }
    toast({ title: "Quadra removida!" });
  };

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
                selectedCourt === court.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <button
                className="flex-1 text-left"
                onClick={() => setSelectedCourt(court.id)}
              >
                <p className="font-medium">{court.name}</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {COURT_TYPES.find((t) => t.value === court.type)?.label}
                </p>
              </button>
              <div className="flex items-center gap-2">
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
                  onClick={() => deleteCourt(court.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Time Slots Management */}
      {selectedCourt && (
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-heading font-semibold">Gerenciar Horários</h3>
              <p className="text-sm text-muted-foreground">
                {courts.find((c) => c.id === selectedCourt)?.name}
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
                      {slot.startTime} - {slot.endTime}
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
                      onClick={() => toggleSlotAvailability(slot.id)}
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
              Quadra: {courts.find((c) => c.id === selectedCourt)?.name}
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
            <Button onClick={addSlot}>Adicionar</Button>
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
                onValueChange={(value: CourtType) =>
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCourtModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveCourt}>
              {editingCourt ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
