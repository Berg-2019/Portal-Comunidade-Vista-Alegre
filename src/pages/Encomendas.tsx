import { useState, useEffect, useRef, useCallback } from "react";
import { Package, Search, Clock, AlertCircle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Layout } from "@/components/layout/Layout";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";
import { formatDateBR, daysDifference } from "@/lib/dateUtils";

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

const ITEMS_PER_PAGE = 20;

export default function Encomendas() {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<PackageStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [stats, setStats] = useState({ total: 0, aguardando: 0, entregue: 0, devolvido: 0 });
  
  const sentinelRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Load packages with pagination
  const loadPackages = useCallback(async (pageNum: number, append = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await api.getPackages({
        search: searchTerm || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        page: pageNum,
        limit: ITEMS_PER_PAGE,
      });

      const newPackages = response.data;
      
      if (append) {
        setPackages(prev => [...prev, ...newPackages]);
      } else {
        setPackages(newPackages);
      }

      setHasMore(response.pagination.hasMore);
      
      // Update stats from first page load (total counts)
      if (pageNum === 1 && !searchTerm && statusFilter === "ALL") {
        // For accurate stats, we need all packages - use a separate call or compute from pagination
        const statsResponse = await api.getPackages({ limit: 1 });
        // Get stats by status
        const allPackagesResponse = await api.getPackages({ limit: 1000 }); // Get all for stats
        const allPkgs = allPackagesResponse.data;
        setStats({
          total: allPackagesResponse.pagination.total,
          aguardando: allPkgs.filter(p => p.status === "aguardando").length,
          entregue: allPkgs.filter(p => p.status === "entregue").length,
          devolvido: allPkgs.filter(p => p.status === "devolvido").length,
        });
      }
    } catch (error) {
      console.error("Erro ao carregar encomendas:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchTerm, statusFilter]);

  // Initial load and filter changes
  useEffect(() => {
    setPage(1);
    setPackages([]);
    loadPackages(1, false);
  }, [statusFilter]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setPage(1);
      setPackages([]);
      loadPackages(1, false);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !loading && !loadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          loadPackages(nextPage, true);
        }
      },
      { rootMargin: "100px" }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loading, loadingMore, page, loadPackages]);

  const getDaysRemaining = (deadline: string): number => {
    const today = new Date();
    return daysDifference(today, deadline);
  };

  if (loading && packages.length === 0) {
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
        {packages.length === 0 && !loading ? (
          <div className="text-center py-12 bg-card rounded-xl">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "ALL"
                ? "Nenhuma encomenda encontrada com os filtros aplicados." 
                : "Nenhuma encomenda cadastrada no momento."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {packages.map((pkg, index) => {
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
                  style={{ animationDelay: `${Math.min(index, 10) * 0.05}s` }}
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
                          {formatDateBR(pkg.arrival_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Prazo</p>
                        <p className="font-medium">
                          {formatDateBR(pkg.pickup_deadline)}
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

            {/* Sentinel for infinite scroll */}
            <div ref={sentinelRef} className="h-4" />

            {/* Loading more indicator */}
            {loadingMore && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Carregando mais...</span>
              </div>
            )}

            {/* End of list message */}
            {!hasMore && packages.length > 0 && (
              <div className="text-center py-4 text-muted-foreground text-sm">
                Todas as encomendas carregadas
              </div>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-info/10 border border-info/20 rounded-xl p-6">
          <h3 className="font-heading font-semibold text-info mb-2">Informações Importantes</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Encomendas ficam disponíveis por <strong>7 dias</strong> após a chegada</li>
            <li>• Após o prazo, a encomenda será devolvida aos Correios</li>
            <li>• Retire sua encomenda na administração com documento de identificação</li>
            <li>• Horário de funcionamento: Segunda a Sexta, das 8h às 13h</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
