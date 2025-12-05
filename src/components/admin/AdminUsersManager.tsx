import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Shield,
  ShieldCheck,
  User,
  Key,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type UserRole = "admin" | "moderator" | "developer";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  permissions: {
    encomendas: boolean;
    noticias: boolean;
    quadras: boolean;
    agendamentos: boolean;
    ocorrencias: boolean;
    pagina: boolean;
    usuarios: boolean;
  };
  createdAt: string;
}

const ROLE_CONFIG: Record<UserRole, { label: string; icon: typeof User; class: string }> = {
  admin: { label: "Administrador", icon: ShieldCheck, class: "bg-primary/10 text-primary" },
  moderator: { label: "Moderador", icon: Shield, class: "bg-info/10 text-info" },
  developer: { label: "Desenvolvedor", icon: Key, class: "bg-warning/10 text-warning" },
};

const PERMISSIONS = [
  { key: "encomendas" as const, label: "Encomendas" },
  { key: "noticias" as const, label: "Notícias" },
  { key: "quadras" as const, label: "Quadras" },
  { key: "agendamentos" as const, label: "Agendamentos" },
  { key: "ocorrencias" as const, label: "Ocorrências" },
  { key: "pagina" as const, label: "Página (Visual)" },
  { key: "usuarios" as const, label: "Usuários" },
];

const initialUsers: AdminUser[] = [
  {
    id: "1",
    name: "Administrador Principal",
    email: "admin@comunidade.com",
    role: "developer",
    active: true,
    permissions: {
      encomendas: true,
      noticias: true,
      quadras: true,
      agendamentos: true,
      ocorrencias: true,
      pagina: true,
      usuarios: true,
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Moderador de Conteúdo",
    email: "moderador@comunidade.com",
    role: "moderator",
    active: true,
    permissions: {
      encomendas: true,
      noticias: true,
      quadras: false,
      agendamentos: false,
      ocorrencias: true,
      pagina: false,
      usuarios: false,
    },
    createdAt: new Date().toISOString(),
  },
];

export default function AdminUsersManager() {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "moderator" as UserRole,
    permissions: {
      encomendas: false,
      noticias: false,
      quadras: false,
      agendamentos: false,
      ocorrencias: false,
      pagina: false,
      usuarios: false,
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "moderator",
      permissions: {
        encomendas: false,
        noticias: false,
        quadras: false,
        agendamentos: false,
        ocorrencias: false,
        pagina: false,
        usuarios: false,
      },
    });
    setEditingUser(null);
    setShowPassword(false);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (user: AdminUser) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      permissions: { ...user.permissions },
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.email) {
      toast({
        title: "Erro",
        description: "Preencha nome e email.",
        variant: "destructive",
      });
      return;
    }

    if (!editingUser && !formData.password) {
      toast({
        title: "Erro",
        description: "Defina uma senha para o novo usuário.",
        variant: "destructive",
      });
      return;
    }

    if (editingUser) {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === editingUser.id
            ? {
                ...user,
                name: formData.name,
                email: formData.email,
                role: formData.role,
                permissions: formData.permissions,
              }
            : user
        )
      );
      toast({ title: "Usuário atualizado!" });
    } else {
      const newUser: AdminUser = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        role: formData.role,
        active: true,
        permissions: formData.permissions,
        createdAt: new Date().toISOString(),
      };
      setUsers((prev) => [...prev, newUser]);
      toast({ title: "Usuário criado!" });
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleToggleActive = (id: string) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === id ? { ...user, active: !user.active } : user
      )
    );
    toast({ title: "Status alterado!" });
  };

  const handleDelete = (id: string) => {
    if (users.length <= 1) {
      toast({
        title: "Erro",
        description: "Deve existir pelo menos um usuário.",
        variant: "destructive",
      });
      return;
    }
    setUsers((prev) => prev.filter((user) => user.id !== id));
    toast({ title: "Usuário removido!" });
  };

  const handlePermissionChange = (key: keyof typeof formData.permissions) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key],
      },
    }));
  };

  const handleRoleChange = (role: UserRole) => {
    // Desenvolvedor tem todas as permissões
    if (role === "developer") {
      setFormData((prev) => ({
        ...prev,
        role,
        permissions: {
          encomendas: true,
          noticias: true,
          quadras: true,
          agendamentos: true,
          ocorrencias: true,
          pagina: true,
          usuarios: true,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, role }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Gerencie os usuários que podem acessar o painel administrativo e suas permissões.
        </p>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {users.map((user) => {
          const roleConfig = ROLE_CONFIG[user.role];
          const RoleIcon = roleConfig.icon;

          return (
            <div
              key={user.id}
              className={cn(
                "bg-card rounded-xl p-4 shadow-sm border border-border",
                !user.active && "opacity-50"
              )}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-muted">
                    <User className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{user.name}</h4>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                          roleConfig.class
                        )}
                      >
                        <RoleIcon className="h-3 w-3" />
                        {roleConfig.label}
                      </span>
                      {!user.active && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                          Inativo
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {PERMISSIONS.filter((p) => user.permissions[p.key]).map((p) => (
                        <span
                          key={p.key}
                          className="px-2 py-0.5 rounded text-xs bg-muted"
                        >
                          {p.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(user.id)}
                    title={user.active ? "Desativar" : "Ativar"}
                  >
                    {user.active ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(user)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(user.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info */}
      <div className="bg-warning/10 border border-warning/20 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <Shield className="h-6 w-6 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-heading font-semibold text-warning mb-2">
              Níveis de Acesso
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li><strong>Desenvolvedor:</strong> Acesso total, incluindo gerenciamento de usuários e configurações do site.</li>
              <li><strong>Administrador:</strong> Pode gerenciar conteúdo conforme permissões definidas.</li>
              <li><strong>Moderador:</strong> Acesso limitado para moderação de conteúdo.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Editar Usuário" : "Novo Usuário"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                {editingUser ? "Nova Senha (deixe vazio para manter)" : "Senha *"}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Usuário</Label>
              <div className="flex gap-2">
                {(Object.keys(ROLE_CONFIG) as UserRole[]).map((role) => {
                  const config = ROLE_CONFIG[role];
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleRoleChange(role)}
                      className={cn(
                        "flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
                        formData.role === role
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-muted"
                      )}
                    >
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Permissões</Label>
              <div className="grid grid-cols-2 gap-2">
                {PERMISSIONS.map((permission) => (
                  <label
                    key={permission.key}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors",
                      formData.permissions[permission.key]
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted",
                      formData.role === "developer" && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Checkbox
                      checked={formData.permissions[permission.key]}
                      onCheckedChange={() => handlePermissionChange(permission.key)}
                      disabled={formData.role === "developer"}
                    />
                    <span className="text-sm">{permission.label}</span>
                  </label>
                ))}
              </div>
              {formData.role === "developer" && (
                <p className="text-xs text-muted-foreground">
                  Desenvolvedores têm acesso total automaticamente.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingUser ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
