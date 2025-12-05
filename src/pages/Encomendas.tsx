import { useState } from "react";
import { Package, Search, Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Layout } from "@/components/layout/Layout";
import { cn } from "@/lib/utils";

type PackageStatus = "AGUARDANDO" | "ENTREGUE" | "DEVOLVIDO";

interface PackageItem {
  id: string;
  codigo: string;
  nome: string;
  status: PackageStatus;
  dataChegada: string;
  prazoRetirada: string;
  diasRestantes: number;
}

const mockPackages: PackageItem[] = [
  { id: "1", codigo: "RP123456789BR", nome: "Maria Silva", status: "AGUARDANDO", dataChegada: "01/12/2024", prazoRetirada: "08/12/2024", diasRestantes: 5 },
  { id: "2", codigo: "RP987654321BR", nome: "João Santos", status: "AGUARDANDO", dataChegada: "02/12/2024", prazoRetirada: "09/12/2024", diasRestantes: 6 },
  { id: "3", codigo: "RP456789123BR", nome: "Ana Oliveira", status: "AGUARDANDO", dataChegada: "28/11/2024", prazoRetirada: "05/12/2024", diasRestantes: 2 },
  { id: "4", codigo: "RP111222333BR", nome: "Carlos Souza", status: "ENTREGUE", dataChegada: "25/11/2024", prazoRetirada: "02/12/2024", diasRestantes: 0 },
  { id: "5", codigo: "RP444555666BR", nome: "Paula Costa", status: "DEVOLVIDO", dataChegada: "15/11/2024", prazoRetirada: "22/11/2024", diasRestantes: 0 },
  { id: "6", codigo: "RP777888999BR", nome: "Roberto Lima", status: "AGUARDANDO", dataChegada: "03/12/2024", prazoRetirada: "10/12/2024", diasRestantes: 7 },
];

const statusConfig = {
  AGUARDANDO: { 
    label: "Aguardando Retirada", 
    icon: Clock, 
    class: "bg-warning/10 text-warning border-warning/20",
    badgeClass: "bg-warning text-warning-foreground"
  },
  ENTREGUE: { 
    label: "Entregue", 
    icon: CheckCircle, 
    class: "bg-success/10 text-success border-success/20",
    badgeClass: "bg-success text-success-foreground"
  },
  DEVOLVIDO: { 
    label: "Devolvido aos Correios", 
    icon: XCircle, 
    class: "bg-destructive/10 text-destructive border-destructive/20",
    badgeClass: "bg-destructive text-destructive-foreground"
  },
};

export default function Encomendas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<PackageStatus | "ALL">("ALL");

  const filteredPackages = mockPackages.filter((pkg) => {
    const matchesSearch = 
      pkg.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || pkg.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
                { value: "AGUARDANDO" as const, label: "Aguardando" },
                { value: "ENTREGUE" as const, label: "Entregues" },
                { value: "DEVOLVIDO" as const, label: "Devolvidas" },
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
            { label: "Total", value: mockPackages.length, color: "bg-primary/10 text-primary" },
            { label: "Aguardando", value: mockPackages.filter(p => p.status === "AGUARDANDO").length, color: "bg-warning/10 text-warning" },
            { label: "Entregues", value: mockPackages.filter(p => p.status === "ENTREGUE").length, color: "bg-success/10 text-success" },
            { label: "Devolvidas", value: mockPackages.filter(p => p.status === "DEVOLVIDO").length, color: "bg-destructive/10 text-destructive" },
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
            <p className="text-muted-foreground">Nenhuma encomenda encontrada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPackages.map((pkg, index) => {
              const config = statusConfig[pkg.status];
              const Icon = config.icon;
              const isUrgent = pkg.status === "AGUARDANDO" && pkg.diasRestantes <= 2;

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
                          <h3 className="font-semibold text-lg">{pkg.nome}</h3>
                          {isUrgent && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive text-destructive-foreground animate-pulse-soft">
                              <AlertCircle className="h-3 w-3" />
                              Urgente
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground font-mono">{pkg.codigo}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm">
                      <div>
                        <p className="text-muted-foreground">Chegada</p>
                        <p className="font-medium">{pkg.dataChegada}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Prazo</p>
                        <p className="font-medium">{pkg.prazoRetirada}</p>
                      </div>
                      {pkg.status === "AGUARDANDO" && (
                        <div>
                          <p className="text-muted-foreground">Restam</p>
                          <p className={cn("font-bold", isUrgent ? "text-destructive" : "text-foreground")}>
                            {pkg.diasRestantes} dias
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
