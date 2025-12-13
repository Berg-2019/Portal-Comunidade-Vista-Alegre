import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  MessageCircle,
  Bot,
  Loader2,
  Palette,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import AdminNewsManager from "@/components/admin/AdminNewsManager";
import AdminCourtsManager from "@/components/admin/AdminCourtsManager";
import AdminScheduleManager from "@/components/admin/AdminScheduleManager";
import AdminOccurrencesManager from "@/components/admin/AdminOccurrencesManager";
import AdminPageManager from "@/components/admin/AdminPageManager";
import AdminUsersManager from "@/components/admin/AdminUsersManager";
import AdminBusinessManager from "@/components/admin/AdminBusinessManager";
import AdminWhatsAppManager from "@/components/admin/AdminWhatsAppManager";
import { AdminBotManager } from "@/components/admin/AdminBotManager";
import { AdminPackagePDFUpload } from "@/components/admin/AdminPackagePDFUpload";
import { AdminColorEditor } from "@/components/admin/AdminColorEditor";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";

type PackageStatus = "aguardando" | "entregue" | "devolvido";
type ActiveTab = "encomendas" | "noticias" | "quadras" | "agendamentos" | "ocorrencias" | "comercios" | "whatsapp" | "bot" | "pagina" | "usuarios" | "cores";

interface PackageItem {
  id: string | number;
  tracking_code: string;
  recipient_name: string;
  status: PackageStatus;
  arrival_date: string;
  pickup_deadline: string;
  notes?: string;
}

const statusConfig = {
  aguardando: { label: "Aguardando", icon: Clock, class: "bg-warning/10 text-warning" },
  entregue: { label: "Entregue", icon: CheckCircle, class: "bg-success/10 text-success" },
  devolvido: { label: "Devolvido", icon: XCircle, class: "bg-destructive/10 text-destructive" },
};

// Mapeamento de tabs para permissões necessárias
const tabPermissions: Record<ActiveTab, string | null> = {
  encomendas: "packages",
  noticias: "news",
  ocorrencias: "occurrences",
  comercios: "businesses",
  quadras: "courts",
  agendamentos: "courts",
  whatsapp: "settings",
  bot: "settings",
  pagina: "settings",
  cores: "settings",
  usuarios: "users",
};

const navItems = [
  { id: "encomendas" as ActiveTab, label: "Encomendas", icon: Package },
  { id: "noticias" as ActiveTab, label: "Notícias", icon: Newspaper },
  { id: "ocorrencias" as ActiveTab, label: "Ocorrências", icon: AlertCircle },
  { id: "comercios" as ActiveTab, label: "Comércios", icon: Store },
  { id: "quadras" as ActiveTab, label: "Quadras", icon: Calendar },
  { id: "agendamentos" as ActiveTab, label: "Agendamentos", icon: Users },
  { id: "whatsapp" as ActiveTab, label: "Grupos WhatsApp", icon: MessageCircle },
  { id: "bot" as ActiveTab, label: "Bot WhatsApp", icon: Bot },
  { id: "pagina" as ActiveTab, label: "Página", icon: Settings, divider: true },
  { id: "cores" as ActiveTab, label: "Cores do Site", icon: Palette },
  { id: "usuarios" as ActiveTab, label: "Usuários", icon: Shield },
];

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();

  // Verifica se o usuário tem permissão para uma tab
  const canAccessTab = (tabId: ActiveTab): boolean => {
    if (user?.role === 'developer') return true;
    const permission = tabPermissions[tabId];
    if (!permission) return true;
    return hasPermission(permission);
  };

  // Filtra as tabs visíveis baseado nas permissões
  const visibleNavItems = navItems.filter(item => canAccessTab(item.id));

  // Define a tab inicial baseada na primeira tab disponível
  const getInitialTab = (): ActiveTab => {
    if (visibleNavItems.length > 0) {
      return visibleNavItems[0].id;
    }
    return "encomendas";
  };

  const [activeTab, setActiveTab] = useState<ActiveTab>(getInitialTab);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pdfUploadOpen, setPdfUploadOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPackageId, setDeletingPackageId] = useState<string | number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeTab === "encomendas") {
      loadPackages();
    }
  }, [activeTab]);

  const loadPackages = async () => {
    try {
      setLoadingPackages(true);
      const data = await api.getPackages();
      setPackages(data);
    } catch (error) {
      console.error("Erro ao carregar encomendas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as encomendas.",
        variant: "destructive",
      });
    } finally {
      setLoadingPackages(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const filteredPackages = packages.filter(
    (pkg) =>
      pkg.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.tracking_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: packages.length,
    aguardando: packages.filter((p) => p.status === "aguardando").length,
    entregue: packages.filter((p) => p.status === "entregue").length,
    devolvido: packages.filter((p) => p.status === "devolvido").length,
  };

  const handleStatusChange = async (id: string | number, newStatus: PackageStatus) => {
    try {
      await api.updatePackage(String(id), { status: newStatus });
      setPackages((prev) =>
        prev.map((pkg) => (pkg.id === id ? { ...pkg, status: newStatus } : pkg))
      );
      toast({
        title: "Status atualizado",
        description: `Encomenda marcada como ${statusConfig[newStatus].label.toLowerCase()}.`,
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    }
  };

  const handleUpload = () => {
    setPdfUploadOpen(true);
  };

  const handlePdfImportSuccess = () => {
    loadPackages();
  };

  const openEditModal = (pkg: PackageItem) => {
    setEditingPackage({ ...pkg });
    setEditModalOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingPackage) return;
    
    setSaving(true);
    try {
      await api.updatePackage(String(editingPackage.id), {
        recipient_name: editingPackage.recipient_name,
        tracking_code: editingPackage.tracking_code,
        arrival_date: editingPackage.arrival_date,
        pickup_deadline: editingPackage.pickup_deadline,
        status: editingPackage.status,
        notes: editingPackage.notes,
      });
      
      setPackages((prev) =>
        prev.map((pkg) => (pkg.id === editingPackage.id ? editingPackage : pkg))
      );
      
      setEditModalOpen(false);
      setEditingPackage(null);
      toast({
        title: "Encomenda atualizada",
        description: "Os dados foram salvos com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao atualizar encomenda:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const openDeleteDialog = (id: string | number) => {
    setDeletingPackageId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPackageId) return;
    
    try {
      await api.deletePackage(String(deletingPackageId));
      setPackages((prev) => prev.filter((pkg) => pkg.id !== deletingPackageId));
      toast({
        title: "Encomenda excluída",
        description: "A encomenda foi removida do sistema.",
      });
    } catch (error) {
      console.error("Erro ao excluir encomenda:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a encomenda.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingPackageId(null);
    }
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
      case "whatsapp":
        return "Grupos WhatsApp";
      case "bot":
        return "Bot WhatsApp";
      case "pagina":
        return "Configurações da Página";
      case "cores":
        return "Cores do Site";
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
            {visibleNavItems.map((item, index) => (
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
          {user && (
            <p className="text-xs text-muted-foreground mb-3 truncate">
              Logado como: {user.name}
            </p>
          )}
          <Link to="/">
            <Button variant="ghost" className="w-full justify-start mb-2">
              <Home className="h-4 w-4 mr-2" />
              Voltar ao Site
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
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
                      {loadingPackages ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                          </td>
                        </tr>
                      ) : (
                        filteredPackages.map((pkg) => {
                          const config = statusConfig[pkg.status] || statusConfig.aguardando;
                          const Icon = config.icon;

                          return (
                            <tr key={pkg.id} className="hover:bg-muted/50 transition-colors">
                              <td className="px-6 py-4">
                                <p className="font-medium">{pkg.recipient_name}</p>
                              </td>
                              <td className="px-6 py-4">
                                <code className="text-sm bg-muted px-2 py-1 rounded">{pkg.tracking_code}</code>
                              </td>
                              <td className="px-6 py-4 text-sm text-muted-foreground">
                                {new Date(pkg.arrival_date).toLocaleDateString('pt-BR')}
                              </td>
                              <td className="px-6 py-4 text-sm text-muted-foreground">
                                {new Date(pkg.pickup_deadline).toLocaleDateString('pt-BR')}
                              </td>
                              <td className="px-6 py-4">
                                <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium", config.class)}>
                                  <Icon className="h-3.5 w-3.5" />
                                  {config.label}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-end gap-2">
                                  {pkg.status === "aguardando" && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-success hover:text-success"
                                        onClick={() => handleStatusChange(pkg.id, "entregue")}
                                      >
                                        <Check className="h-4 w-4 mr-1" />
                                        Entregar
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => handleStatusChange(pkg.id, "devolvido")}
                                      >
                                        <RotateCcw className="h-4 w-4 mr-1" />
                                        Devolver
                                      </Button>
                                    </>
                                  )}
                                  {pkg.status !== "aguardando" && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleStatusChange(pkg.id, "aguardando")}
                                    >
                                      <RotateCcw className="h-4 w-4 mr-1" />
                                      Restaurar
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => openEditModal(pkg)}
                                    title="Editar"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => openDeleteDialog(pkg.id)}
                                    title="Excluir"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
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

          {/* WhatsApp Groups Tab */}
          {activeTab === "whatsapp" && <AdminWhatsAppManager />}

          {/* Bot WhatsApp Tab */}
          {activeTab === "bot" && <AdminBotManager />}

          {/* Cores Tab */}
          {activeTab === "cores" && <AdminColorEditor />}

          {/* Usuários Tab */}
          {activeTab === "usuarios" && <AdminUsersManager />}
        </div>

        {/* PDF Upload Modal */}
        <AdminPackagePDFUpload
          open={pdfUploadOpen}
          onOpenChange={setPdfUploadOpen}
          onImportSuccess={handlePdfImportSuccess}
        />

        {/* Edit Package Modal */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Encomenda</DialogTitle>
              <DialogDescription>
                Altere os dados da encomenda abaixo.
              </DialogDescription>
            </DialogHeader>
            {editingPackage && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient_name">Nome do Destinatário</Label>
                  <Input
                    id="recipient_name"
                    value={editingPackage.recipient_name}
                    onChange={(e) => setEditingPackage({ ...editingPackage, recipient_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tracking_code">Código de Rastreamento</Label>
                  <Input
                    id="tracking_code"
                    value={editingPackage.tracking_code}
                    onChange={(e) => setEditingPackage({ ...editingPackage, tracking_code: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="arrival_date">Data de Chegada</Label>
                    <Input
                      id="arrival_date"
                      type="date"
                      value={editingPackage.arrival_date?.split('T')[0] || ''}
                      onChange={(e) => setEditingPackage({ ...editingPackage, arrival_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pickup_deadline">Prazo de Retirada</Label>
                    <Input
                      id="pickup_deadline"
                      type="date"
                      value={editingPackage.pickup_deadline?.split('T')[0] || ''}
                      onChange={(e) => setEditingPackage({ ...editingPackage, pickup_deadline: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={editingPackage.status}
                    onValueChange={(value: PackageStatus) => setEditingPackage({ ...editingPackage, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aguardando">Aguardando</SelectItem>
                      <SelectItem value="entregue">Entregue</SelectItem>
                      <SelectItem value="devolvido">Devolvido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={editingPackage.notes || ''}
                    onChange={(e) => setEditingPackage({ ...editingPackage, notes: e.target.value })}
                    placeholder="Observações adicionais..."
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEditSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta encomenda? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDeleteConfirm}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
