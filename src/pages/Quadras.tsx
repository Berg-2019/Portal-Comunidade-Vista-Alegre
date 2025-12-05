import { useState, useEffect } from "react";
import { Calendar, Clock, MessageCircle, ChevronLeft, ChevronRight, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { cn } from "@/lib/utils";
import { format, addDays, startOfToday, isSameDay, parseISO, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { api } from "@/services/api";

type SlotStatus = "LIVRE" | "RESERVADO" | "FIXO" | "MANUTENCAO";

interface Court {
  id: number;
  name: string;
  type: string;
  description: string;
  image_url?: string;
  available: boolean;
  maintenance_mode: boolean;
  maintenance_reason?: string;
  maintenance_start?: string;
  maintenance_end?: string;
}

interface TimeSlot {
  id: number;
  court_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  available: boolean;
}

interface MaintenancePeriod {
  id: number;
  court_id: number;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  reason?: string;
}

const statusConfig = {
  LIVRE: { label: "Livre", class: "bg-success/10 text-success border-success/20" },
  RESERVADO: { label: "Reservado", class: "bg-warning/10 text-warning border-warning/20" },
  FIXO: { label: "Fixo", class: "bg-muted text-muted-foreground border-border" },
  MANUTENCAO: { label: "Manutenção", class: "bg-destructive/10 text-destructive border-destructive/20" },
};

export default function Quadras() {
  const today = startOfToday();
  const [selectedDate, setSelectedDate] = useState(today);
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [maintenancePeriods, setMaintenancePeriods] = useState<MaintenancePeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  useEffect(() => {
    loadCourts();
  }, []);

  useEffect(() => {
    if (selectedCourt) {
      loadCourtSlots(selectedCourt.id);
    }
  }, [selectedCourt]);

  const loadCourts = async () => {
    try {
      setLoading(true);
      const data = await api.getCourts();
      setCourts(data);
      if (data.length > 0) {
        setSelectedCourt(data[0]);
      }
    } catch (error) {
      console.error("Erro ao carregar quadras:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCourtSlots = async (courtId: number) => {
    try {
      setLoadingSlots(true);
      const data = await api.getCourtSlots(courtId);
      setTimeSlots(data.slots || []);
      setMaintenancePeriods(data.maintenancePeriods || []);
    } catch (error) {
      console.error("Erro ao carregar horários:", error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const isSlotInMaintenance = (slot: TimeSlot, date: Date): boolean => {
    if (!selectedCourt) return false;
    
    // Check total maintenance mode
    if (selectedCourt.maintenance_mode) {
      if (selectedCourt.maintenance_start && selectedCourt.maintenance_end) {
        const start = parseISO(selectedCourt.maintenance_start);
        const end = parseISO(selectedCourt.maintenance_end);
        if (isWithinInterval(date, { start, end })) return true;
      } else {
        return true; // Indefinite maintenance
      }
    }

    // Check specific maintenance periods
    for (const period of maintenancePeriods) {
      const start = parseISO(period.start_date);
      const end = parseISO(period.end_date);
      if (isWithinInterval(date, { start, end })) {
        // If period has specific times, check them
        if (period.start_time && period.end_time) {
          const slotStart = slot.start_time;
          const periodStart = period.start_time;
          const periodEnd = period.end_time;
          if (slotStart >= periodStart && slotStart < periodEnd) {
            return true;
          }
        } else {
          return true; // All day maintenance
        }
      }
    }

    return false;
  };

  const getSlotStatus = (slot: TimeSlot, date: Date): SlotStatus => {
    if (isSlotInMaintenance(slot, date)) return "MANUTENCAO";
    if (!slot.available) return "FIXO";
    // For now, assume all available slots are free (reservations would come from a separate system)
    return "LIVRE";
  };

  const handleReserve = (slot: TimeSlot) => {
    if (!selectedCourt) return;
    const message = encodeURIComponent(
      `Quero reservar a ${selectedCourt.name} no dia ${format(selectedDate, "dd/MM", { locale: ptBR })} às ${slot.start_time.slice(0, 5)} em nome de [SEU NOME].`
    );
    window.open(`https://wa.me/5500000000000?text=${message}`, "_blank");
  };

  const selectedDayOfWeek = selectedDate.getDay();
  const filteredSlots = timeSlots.filter(slot => slot.day_of_week === selectedDayOfWeek);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gradient-hero text-primary-foreground py-12">
        <div className="container">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="h-8 w-8" />
            <h1 className="font-heading text-3xl md:text-4xl font-bold">Agenda de Quadras</h1>
          </div>
          <p className="text-primary-foreground/90 max-w-2xl">
            Confira a disponibilidade das quadras nos próximos 7 dias e reserve pelo WhatsApp.
          </p>
        </div>
      </div>

      <div className="container py-8">
        {courts.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma quadra cadastrada no momento.</p>
          </div>
        ) : (
          <>
            {/* Court Selection */}
            <div className="flex flex-wrap gap-3 mb-8">
              {courts.map((court) => (
                <button
                  key={court.id}
                  onClick={() => setSelectedCourt(court)}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium text-sm transition-all",
                    selectedCourt?.id === court.id
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-card text-foreground border border-border hover:border-primary/50",
                    court.maintenance_mode && "opacity-60"
                  )}
                >
                  {court.name}
                  {court.maintenance_mode && " 🔧"}
                </button>
              ))}
            </div>

            {/* Maintenance Banner */}
            {selectedCourt?.maintenance_mode && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-8 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-destructive">Quadra em Manutenção</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedCourt.maintenance_reason || "Esta quadra está temporariamente indisponível para manutenção."}
                  </p>
                  {selectedCourt.maintenance_end && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Previsão de retorno: {format(parseISO(selectedCourt.maintenance_end), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Date Selection */}
            <div className="bg-card rounded-xl p-4 mb-8 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-semibold">Selecione o dia</h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" disabled>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" disabled>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {days.map((day) => (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "flex flex-col items-center px-4 py-3 rounded-xl min-w-[80px] transition-all",
                      isSameDay(selectedDate, day)
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    <span className="text-xs uppercase opacity-80">
                      {format(day, "EEE", { locale: ptBR })}
                    </span>
                    <span className="text-xl font-bold">{format(day, "dd")}</span>
                    <span className="text-xs opacity-80">{format(day, "MMM", { locale: ptBR })}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Court Info */}
            {selectedCourt && (
              <div className="bg-card rounded-xl p-6 mb-8 shadow-sm">
                <h2 className="font-heading text-xl font-semibold mb-2">{selectedCourt.name}</h2>
                <p className="text-muted-foreground mb-4">{selectedCourt.description}</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", config.class.split(" ")[0])} />
                      <span className="text-muted-foreground">{config.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Time Slots */}
            {loadingSlots ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredSlots.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum horário disponível para este dia.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredSlots.map((slot) => {
                  const status = getSlotStatus(slot, selectedDate);
                  const config = statusConfig[status];
                  const isAvailable = status === "LIVRE";

                  return (
                    <div
                      key={slot.id}
                      className={cn(
                        "rounded-xl border p-4 transition-all",
                        config.class,
                        isAvailable && "hover:shadow-md cursor-pointer"
                      )}
                      onClick={() => isAvailable && handleReserve(slot)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-semibold">{slot.start_time.slice(0, 5)}</span>
                      </div>
                      <span className="text-xs">{config.label}</span>
                      {isAvailable && (
                        <div className="mt-3">
                          <Button variant="default" size="sm" className="w-full bg-success hover:bg-success/90">
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Reservar
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Info Box */}
            <div className="mt-8 bg-info/10 border border-info/20 rounded-xl p-6">
              <h3 className="font-heading font-semibold text-info mb-2">Como funciona?</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>1. Escolha a quadra e o horário desejado</li>
                <li>2. Clique em "Reservar" nos horários livres</li>
                <li>3. Complete sua reserva pelo WhatsApp</li>
                <li>4. Aguarde a confirmação da administração</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
