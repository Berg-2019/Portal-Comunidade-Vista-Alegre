import { useState, useEffect } from "react";
import { Package, Search, Clock, AlertCircle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Layout } from "@/components/layout/Layout";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

type PackageStatus = "aguardando" | "entregue" | "devolvido";

interface PackageItem {
  id: number;
  recipient_name: string;
  tracking_code: string;
  status: PackageStatus;
  arrival_date: string;
  pickup_deadline: string;
  notes?: string;
}

const statusConfig = {
  aguardando: { 
    label: "Aguardando Retirada", 
    icon: Clock, 
    class: "bg-warning/10 text-warning border-warning/20",
    badgeClass: "bg-warning text-warning-foreground"
  },
  entregue: { 
    label: "Entregue", 
    icon: CheckCircle, 
    class: "bg-success/10 text-success border-success/20",
    badgeClass: "bg-success text-success-foreground"
  },
  devolvido: { 
    label: "Devolvido aos Correios", 
    icon: XCircle, 
    class: "bg-destructive/10 text-destructive border-destructive/20",
    badgeClass: "bg-destructive text-destructive-foreground"
  },
};

export default function Encomendas() {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<PackageStatus | "ALL">("ALL");

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const data = await api.getPackages();
      setPackages(data);
    } catch (error) {
      console.error("Erro ao carregar encomendas:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch = 
      pkg.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.tracking_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || pkg.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getDaysRemaining = (deadline: string): number => {
    const deadlineDate = parseISO(deadline);
    const today = new Date();
    return differenceInDays(deadlineDate, today);
  };

  const stats = {
    total: packages.length,
    aguardando: packages.filter(p => p.status === "aguardando").length,
    entregue: packages.filter(p => p.status === "entregue").length,
    devolvido: packages.filter(p => p.status === "devolvido").length,
  };

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
            <Package className="h-8 w-8" />
            <h1 className="font-heading text-3xl md:text-4xl font-bold">Encomendas</h1>
          </div>
          <p className="text-primary-foreground/90 max-w-2xl">
            Consulte suas encomendas no correio comunitário. Verifique se chegou e não perca o prazo de retirada.
          </p>
        </div>
      </div>

      <div className="container py-8">
        {/* Search and Filters */}
        <div className="bg-card rounded-xl p-6 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou código de rastreio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: "ALL" as const, label: "Todas" },
                { value: "aguardando" as const, label: "Aguardando" },
                { value: "entregue" as const, label: "Entregues" },
                { value: "devolvido" as const, label: "Devolvidas" },
              ].map((filter) => (
                <Button
                  key={filter.value}
                  variant={statusFilter === filter.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(filter.value)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total", value: stats.total, color: "bg-primary/10 text-primary" },
            { label: "Aguardando", value: stats.aguardando, color: "bg-warning/10 text-warning" },
            { label: "Entregues", value: stats.entregue, color: "bg-success/10 text-success" },
            { label: "Devolvidas", value: stats.devolvido, color: "bg-destructive/10 text-destructive" },
          ].map((stat) => (
            <div key={stat.label} className={cn("rounded-xl p-4", stat.color)}>
              <p className="text-sm opacity-80">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Package List */}
        {filteredPackages.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {packages.length === 0 
                ? "Nenhuma encomenda cadastrada no momento." 
                : "Nenhuma encomenda encontrada com os filtros aplicados."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPackages.map((pkg, index) => {
              const config = statusConfig[pkg.status];
              const Icon = config.icon;
              const daysRemaining = getDaysRemaining(pkg.pickup_deadline);
              const isUrgent = pkg.status === "aguardando" && daysRemaining <= 2;

              return (
                <div
                  key={pkg.id}
                  className={cn(
                    "bg-card rounded-xl p-6 shadow-sm border transition-all animate-fade-up hover-lift",
                    config.class
                  )}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={cn("p-3 rounded-xl", config.class)}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{pkg.recipient_name}</h3>
                          {isUrgent && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive text-destructive-foreground animate-pulse-soft">
                              <AlertCircle className="h-3 w-3" />
                              Urgente
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground font-mono">{pkg.tracking_code}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm">
                      <div>
                        <p className="text-muted-foreground">Chegada</p>
                        <p className="font-medium">
                          {format(parseISO(pkg.arrival_date), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Prazo</p>
                        <p className="font-medium">
                          {format(parseISO(pkg.pickup_deadline), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      {pkg.status === "aguardando" && (
                        <div>
                          <p className="text-muted-foreground">Restam</p>
                          <p className={cn("font-bold", isUrgent ? "text-destructive" : "text-foreground")}>
                            {daysRemaining > 0 ? `${daysRemaining} dias` : "Vencido"}
                          </p>
                        </div>
                      )}
                      <span className={cn("px-3 py-1 rounded-full text-xs font-medium", config.badgeClass)}>
                        {config.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-info/10 border border-info/20 rounded-xl p-6">
          <h3 className="font-heading font-semibold text-info mb-2">Informações Importantes</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Encomendas ficam disponíveis por <strong>7 dias</strong> após a chegada</li>
            <li>• Após o prazo, a encomenda será devolvida aos Correios</li>
            <li>• Retire sua encomenda na administração com documento de identificação</li>
            <li>• Horário de funcionamento: Segunda a Sexta, das 8h às 17h</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
