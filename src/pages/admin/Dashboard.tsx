import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Upload,
  Clock,
  CheckCircle,
  XCircle,
  LogOut,
  Search,
  FileText,
  Check,
  RotateCcw,
  Menu,
  X,
  Home,
  Newspaper,
  Calendar,
  Users,
  AlertCircle,
  Settings,
  Shield,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import AdminNewsManager from "@/components/admin/AdminNewsManager";
import AdminCourtsManager from "@/components/admin/AdminCourtsManager";
import AdminScheduleManager from "@/components/admin/AdminScheduleManager";
import AdminOccurrencesManager from "@/components/admin/AdminOccurrencesManager";
import AdminPageManager from "@/components/admin/AdminPageManager";
import AdminUsersManager from "@/components/admin/AdminUsersManager";
import AdminBusinessManager from "@/components/admin/AdminBusinessManager";

type PackageStatus = "AGUARDANDO" | "ENTREGUE" | "DEVOLVIDO";
type ActiveTab = "encomendas" | "noticias" | "quadras" | "agendamentos" | "ocorrencias" | "comercios" | "pagina" | "usuarios";

interface PackageItem {
  id: string;
  codigo: string;
  nome: string;
  status: PackageStatus;
  dataChegada: string;
  prazoRetirada: string;
}

const initialPackages: PackageItem[] = [
  { id: "1", codigo: "RP123456789BR", nome: "Maria Silva", status: "AGUARDANDO", dataChegada: "01/12/2024", prazoRetirada: "08/12/2024" },
  { id: "2", codigo: "RP987654321BR", nome: "João Santos", status: "AGUARDANDO", dataChegada: "02/12/2024", prazoRetirada: "09/12/2024" },
  { id: "3", codigo: "RP456789123BR", nome: "Ana Oliveira", status: "AGUARDANDO", dataChegada: "28/11/2024", prazoRetirada: "05/12/2024" },
];

const statusConfig = {
  AGUARDANDO: { label: "Aguardando", icon: Clock, class: "bg-warning/10 text-warning" },
  ENTREGUE: { label: "Entregue", icon: CheckCircle, class: "bg-success/10 text-success" },
  DEVOLVIDO: { label: "Devolvido", icon: XCircle, class: "bg-destructive/10 text-destructive" },
};

const navItems = [
  { id: "encomendas" as ActiveTab, label: "Encomendas", icon: Package },
  { id: "noticias" as ActiveTab, label: "Notícias", icon: Newspaper },
  { id: "ocorrencias" as ActiveTab, label: "Ocorrências", icon: AlertCircle },
  { id: "comercios" as ActiveTab, label: "Comércios", icon: Store },
  { id: "quadras" as ActiveTab, label: "Quadras", icon: Calendar },
  { id: "agendamentos" as ActiveTab, label: "Agendamentos", icon: Users },
  { id: "pagina" as ActiveTab, label: "Página", icon: Settings, divider: true },
  { id: "usuarios" as ActiveTab, label: "Usuários", icon: Shield },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("encomendas");
  const [packages, setPackages] = useState<PackageItem[]>(initialPackages);
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();

  const filteredPackages = packages.filter(
    (pkg) =>
      pkg.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: packages.length,
    aguardando: packages.filter((p) => p.status === "AGUARDANDO").length,
    entregue: packages.filter((p) => p.status === "ENTREGUE").length,
    devolvido: packages.filter((p) => p.status === "DEVOLVIDO").length,
  };

  const handleStatusChange = (id: string, newStatus: PackageStatus) => {
    setPackages((prev) =>
      prev.map((pkg) => (pkg.id === id ? { ...pkg, status: newStatus } : pkg))
    );
    toast({
      title: "Status atualizado",
      description: `Encomenda marcada como ${statusConfig[newStatus].label.toLowerCase()}.`,
    });
  };

  const handleUpload = () => {
    toast({
      title: "Upload de PDF",
      description: "Funcionalidade de upload será implementada com backend.",
    });
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case "encomendas":
        return "Gerenciar Encomendas";
      case "noticias":
        return "Gerenciar Notícias";
      case "quadras":
        return "Gerenciar Quadras";
      case "agendamentos":
        return "Agendamentos Fixos";
      case "ocorrencias":
        return "Gerenciar Ocorrências";
      case "comercios":
        return "Gerenciar Comércios";
      case "pagina":
        return "Configurações da Página";
      case "usuarios":
        return "Gerenciar Usuários";
      default:
        return "Dashboard";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transform transition-transform duration-200 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-heading font-bold">
                VA
              </div>
              <span className="font-heading font-semibold">Admin</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="space-y-1">
            {navItems.map((item, index) => (
              <div key={item.id}>
                {item.divider && (
                  <div className="my-4 border-t border-border" />
                )}
                <button
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors",
                    activeTab === item.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </button>
              </div>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-border">
          <Link to="/">
            <Button variant="ghost" className="w-full justify-start mb-2">
              <Home className="h-4 w-4 mr-2" />
              Voltar ao Site
            </Button>
          </Link>
          <Link to="/admin/login">
            <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="font-heading text-xl font-semibold">{getTabTitle()}</h1>
            </div>
            {activeTab === "encomendas" && (
              <Button onClick={handleUpload}>
                <Upload className="h-4 w-4 mr-2" />
                Upload PDF
              </Button>
            )}
          </div>
        </header>

        <div className="p-6">
          {/* Encomendas Tab */}
          {activeTab === "encomendas" && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Package className="h-5 w-5 text-primary" />
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
                      <p className="text-sm text-muted-foreground">Aguardando</p>
                      <p className="text-2xl font-bold">{stats.aguardando}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-success/10">
                      <CheckCircle className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Entregues</p>
                      <p className="text-2xl font-bold">{stats.entregue}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-destructive/10">
                      <XCircle className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Devolvidas</p>
                      <p className="text-2xl font-bold">{stats.devolvido}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="bg-card rounded-xl p-4 mb-6 shadow-sm border border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Package List */}
              <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                          Destinatário
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                          Código
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                          Chegada
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                          Prazo
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                          Status
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-muted-foreground">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredPackages.map((pkg) => {
                        const config = statusConfig[pkg.status];
                        const Icon = config.icon;

                        return (
                          <tr key={pkg.id} className="hover:bg-muted/50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-medium">{pkg.nome}</p>
                            </td>
                            <td className="px-6 py-4">
                              <code className="text-sm bg-muted px-2 py-1 rounded">{pkg.codigo}</code>
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              {pkg.dataChegada}
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              {pkg.prazoRetirada}
                            </td>
                            <td className="px-6 py-4">
                              <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium", config.class)}>
                                <Icon className="h-3.5 w-3.5" />
                                {config.label}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                {pkg.status === "AGUARDANDO" && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-success hover:text-success"
                                      onClick={() => handleStatusChange(pkg.id, "ENTREGUE")}
                                    >
                                      <Check className="h-4 w-4 mr-1" />
                                      Entregar
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive hover:text-destructive"
                                      onClick={() => handleStatusChange(pkg.id, "DEVOLVIDO")}
                                    >
                                      <RotateCcw className="h-4 w-4 mr-1" />
                                      Devolver
                                    </Button>
                                  </>
                                )}
                                {pkg.status !== "AGUARDANDO" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleStatusChange(pkg.id, "AGUARDANDO")}
                                  >
                                    <RotateCcw className="h-4 w-4 mr-1" />
                                    Restaurar
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredPackages.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhuma encomenda encontrada</p>
                  </div>
                )}
              </div>

              {/* Upload Info */}
              <div className="mt-8 bg-info/10 border border-info/20 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <FileText className="h-6 w-6 text-info flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-heading font-semibold text-info mb-2">Upload de Listas PDF</h3>
                    <p className="text-sm text-muted-foreground">
                      Faça upload das listas de encomendas em PDF recebidas dos Correios. O sistema irá extrair automaticamente os dados usando OCR para facilitar o gerenciamento.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Notícias Tab */}
          {activeTab === "noticias" && <AdminNewsManager />}

          {/* Ocorrências Tab */}
          {activeTab === "ocorrencias" && <AdminOccurrencesManager />}

          {/* Quadras Tab */}
          {activeTab === "quadras" && <AdminCourtsManager />}

          {/* Agendamentos Tab */}
          {activeTab === "agendamentos" && <AdminScheduleManager />}

          {/* Página Tab */}
          {activeTab === "pagina" && <AdminPageManager />}

          {/* Comércios Tab */}
          {activeTab === "comercios" && <AdminBusinessManager />}

          {/* Usuários Tab */}
          {activeTab === "usuarios" && <AdminUsersManager />}
        </div>
      </main>
    </div>
  );
}
