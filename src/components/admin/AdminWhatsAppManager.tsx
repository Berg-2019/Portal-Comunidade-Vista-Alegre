import { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  MessageCircle,
  ExternalLink,
  Users,
  Eye,
  EyeOff,
  Loader2,
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

interface WhatsAppGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  invite_link: string;
  icon: string;
  member_count: number | null;
  is_active: boolean;
  order_index: number;
}

const categories = [
  { value: "geral", label: "Geral" },
  { value: "comercio", label: "Comércio" },
  { value: "esportes", label: "Esportes" },
  { value: "seguranca", label: "Segurança" },
  { value: "avisos", label: "Avisos" },
  { value: "saude", label: "Saúde" },
  { value: "mulheres", label: "Mulheres" },
  { value: "outros", label: "Outros" },
];

const icons = [
  { value: "users", label: "Pessoas" },
  { value: "shopping-bag", label: "Comércio" },
  { value: "trophy", label: "Esportes" },
  { value: "shield", label: "Segurança" },
  { value: "megaphone", label: "Avisos" },
  { value: "heart", label: "Saúde" },
  { value: "message-circle", label: "Chat" },
];

export default function AdminWhatsAppManager() {
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<WhatsAppGroup | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "geral",
    invite_link: "",
    icon: "users",
    member_count: "",
    is_active: true,
  });

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const data = await api.getAllWhatsAppGroups();
      setGroups(data);
    } catch (error) {
      console.error("Error loading groups:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os grupos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "geral",
      invite_link: "",
      icon: "users",
      member_count: "",
      is_active: true,
    });
    setEditingGroup(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (group: WhatsAppGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || "",
      category: group.category,
      invite_link: group.invite_link,
      icon: group.icon || "users",
      member_count: group.member_count?.toString() || "",
      is_active: group.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.invite_link || !formData.category) {
      toast({
        title: "Erro",
        description: "Preencha os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        invite_link: formData.invite_link,
        icon: formData.icon,
        member_count: formData.member_count ? parseInt(formData.member_count) : null,
        is_active: formData.is_active,
      };

      if (editingGroup) {
        await api.updateWhatsAppGroup(editingGroup.id, payload);
        toast({ title: "Grupo atualizado com sucesso!" });
      } else {
        await api.createWhatsAppGroup(payload);
        toast({ title: "Grupo criado com sucesso!" });
      }

      setIsModalOpen(false);
      resetForm();
      loadGroups();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o grupo.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este grupo?")) return;

    try {
      await api.deleteWhatsAppGroup(id);
      toast({ title: "Grupo excluído com sucesso!" });
      loadGroups();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o grupo.",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (group: WhatsAppGroup) => {
    try {
      await api.updateWhatsAppGroup(group.id, { is_active: !group.is_active });
      toast({ title: group.is_active ? "Grupo desativado!" : "Grupo ativado!" });
      loadGroups();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status.",
        variant: "destructive",
      });
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
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted-foreground">
          {groups.length} grupo{groups.length !== 1 ? "s" : ""} cadastrado{groups.length !== 1 ? "s" : ""}
        </p>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Grupo
        </Button>
      </div>

      {/* Groups List */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                  Grupo
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground hidden md:table-cell">
                  Categoria
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-muted-foreground">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {groups.map((group) => (
                <tr key={group.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#25D366]/10 flex items-center justify-center">
                        <MessageCircle className="h-5 w-5 text-[#25D366]" />
                      </div>
                      <div>
                        <p className="font-medium">{group.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1 max-w-xs">
                          {group.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="text-sm capitalize">
                      {categories.find(c => c.value === group.category)?.label || group.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleActive(group)}
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors",
                        group.is_active
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {group.is_active ? (
                        <>
                          <Eye className="h-3.5 w-3.5" />
                          Ativo
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3.5 w-3.5" />
                          Inativo
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(group.invite_link, "_blank")}
                        title="Abrir link"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(group)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(group.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {groups.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum grupo cadastrado</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? "Editar Grupo" : "Novo Grupo"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Grupo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Comunidade Vista Alegre"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Breve descrição do grupo"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">Ícone</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) => setFormData({ ...formData, icon: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {icons.map((icon) => (
                      <SelectItem key={icon.value} value={icon.value}>
                        {icon.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite_link">Link de Convite *</Label>
              <Input
                id="invite_link"
                value={formData.invite_link}
                onChange={(e) => setFormData({ ...formData, invite_link: e.target.value })}
                placeholder="https://chat.whatsapp.com/..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="member_count">Número de Membros (opcional)</Label>
              <Input
                id="member_count"
                type="number"
                value={formData.member_count}
                onChange={(e) => setFormData({ ...formData, member_count: e.target.value })}
                placeholder="Ex: 150"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Grupo ativo</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {editingGroup ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
