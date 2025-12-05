import { useState } from "react";
import { Calendar, Clock, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { cn } from "@/lib/utils";
import { format, addDays, startOfToday, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

type CourtType = "FUTSAL" | "SINTETICO" | "VOLEI_AREIA";
type SlotStatus = "LIVRE" | "RESERVADO" | "FIXO";

interface Court {
  id: string;
  tipo: CourtType;
  nome: string;
  descricao: string;
}

interface TimeSlot {
  id: string;
  courtId: string;
  horaInicio: string;
  horaFim: string;
  status: SlotStatus;
}

const courts: Court[] = [
  { id: "1", tipo: "FUTSAL", nome: "Quadra de Futsal", descricao: "Quadra coberta para futsal" },
  { id: "2", tipo: "SINTETICO", nome: "Campo Sintético", descricao: "Campo de grama sintética" },
  { id: "3", tipo: "VOLEI_AREIA", nome: "Vôlei de Areia", descricao: "Quadra de vôlei de areia" },
];

const generateSlots = (courtId: string): TimeSlot[] => {
  const hours = ["08:00", "09:00", "10:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];
  return hours.map((hora, index) => ({
    id: `${courtId}-${index}`,
    courtId,
    horaInicio: hora,
    horaFim: `${parseInt(hora) + 1}:00`,
    status: Math.random() > 0.6 ? "LIVRE" : Math.random() > 0.5 ? "RESERVADO" : "FIXO",
  }));
};

const statusConfig = {
  LIVRE: { label: "Livre", class: "bg-success/10 text-success border-success/20" },
  RESERVADO: { label: "Reservado", class: "bg-warning/10 text-warning border-warning/20" },
  FIXO: { label: "Fixo", class: "bg-muted text-muted-foreground border-border" },
};

export default function Quadras() {
  const today = startOfToday();
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedCourt, setSelectedCourt] = useState<Court>(courts[0]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const slots = generateSlots(selectedCourt.id);

  const handleReserve = (slot: TimeSlot) => {
    const message = encodeURIComponent(
      `Quero reservar a ${selectedCourt.nome} no dia ${format(selectedDate, "dd/MM", { locale: ptBR })} às ${slot.horaInicio} em nome de [SEU NOME].`
    );
    window.open(`https://wa.me/5500000000000?text=${message}`, "_blank");
  };

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
        {/* Court Selection */}
        <div className="flex flex-wrap gap-3 mb-8">
          {courts.map((court) => (
            <button
              key={court.id}
              onClick={() => setSelectedCourt(court)}
              className={cn(
                "px-4 py-2 rounded-lg font-medium text-sm transition-all",
                selectedCourt.id === court.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-card text-foreground border border-border hover:border-primary/50"
              )}
            >
              {court.nome}
            </button>
          ))}
        </div>

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
        <div className="bg-card rounded-xl p-6 mb-8 shadow-sm">
          <h2 className="font-heading text-xl font-semibold mb-2">{selectedCourt.nome}</h2>
          <p className="text-muted-foreground mb-4">{selectedCourt.descricao}</p>
          <div className="flex flex-wrap gap-4 text-sm">
            {Object.entries(statusConfig).map(([key, config]) => (
              <div key={key} className="flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded-full", config.class.split(" ")[0])} />
                <span className="text-muted-foreground">{config.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Time Slots */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {slots.map((slot) => {
            const config = statusConfig[slot.status];
            const isAvailable = slot.status === "LIVRE";

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
                  <span className="font-semibold">{slot.horaInicio}</span>
                </div>
                <span className="text-xs">{config.label}</span>
                {isAvailable && (
                  <div className="mt-3">
                    <Button variant="success" size="sm" className="w-full">
                      <MessageCircle className="h-3 w-3 mr-1" />
                      Reservar
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

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
      </div>
    </Layout>
  );
}
