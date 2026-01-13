import { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Store,
  Star,
  StarOff,
  Check,
  X,
  Loader2,
  AlertCircle,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import ImageUpload from "./ImageUpload";

interface Business {
  id: string;
  name: string;
  description: string;
  category_id: string;
  address?: string;
  location?: string;
  phone?: string;
  whatsapp?: string;
  instagram_url?: string;
  website_url?: string;
  opening_hours?: string;
  image_url?: string;
  owner_name?: string;
  owner_phone?: string;
  is_sponsor: boolean;
  status: "pending" | "approved" | "rejected";
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function AdminBusinessManager() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [filterSponsor, setFilterSponsor] = useState<"all" | "sponsors" | "regular">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category_id: "",
    address: "",
    phone: "",
    whatsapp: "",
    instagram_url: "",
    website_url: "",
    location: "",
    opening_hours: "",
    image_url: "",
    is_sponsor: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [businessData, categoryData] = await Promise.all([
        api.getAllBusinesses(),
        api.getBusinessCategories(),
      ]);
      setBusinesses(businessData);
      setCategories(categoryData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = businesses.filter(b => b.status === "pending").length;

  const filteredBusinesses = businesses.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus =
      filterStatus === "all" || item.status === filterStatus;
    
    const matchesSponsor =
      filterSponsor === "all" ||
      (filterSponsor === "sponsors" && item.is_sponsor) ||
      (filterSponsor === "regular" && !item.is_sponsor);
    
    return matchesSearch && matchesStatus && matchesSponsor;
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category_id: "",
      address: "",
      phone: "",
      whatsapp: "",
      instagram_url: "",
      website_url: "",
      location: "",
      opening_hours: "",
      image_url: "",
      is_sponsor: false,
    });
    setEditingBusiness(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (business: Business) => {
    setEditingBusiness(business);
    setFormData({
      name: business.name,
      description: business.description || "",
      category_id: business.category_id?.toString() || "",
      address: business.address || "",
      phone: business.phone || "",
      whatsapp: business.whatsapp || "",
      instagram_url: business.instagram_url || "",
      website_url: business.website_url || "",
      location: business.location || "",
      opening_hours: business.opening_hours || "",
      image_url: business.image_url || "",
      is_sponsor: business.is_sponsor,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.description || !formData.category_id) {
      toast({
        title: "Erro",
        description: "Preencha os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (editingBusiness) {
        await api.updateBusiness(editingBusiness.id, {
          name: formData.name,
          description: formData.description,
          category_id: formData.category_id,
          address: formData.address,
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          instagram_url: formData.instagram_url,
          website_url: formData.website_url,
          location: formData.location,
          opening_hours: formData.opening_hours,
          image_url: formData.image_url,
          is_sponsor: formData.is_sponsor,
        });
        toast({ title: "Comércio atualizado com sucesso!" });
      } else {
        await api.createBusiness({
          name: formData.name,
          description: formData.description,
          category_id: formData.category_id,
          address: formData.address,
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          instagram_url: formData.instagram_url,
          website_url: formData.website_url,
          location: formData.location,
          opening_hours: formData.opening_hours,
          image_url: formData.image_url,
          is_sponsor: formData.is_sponsor,
        });
        toast({ title: "Comércio criado com sucesso!" });
      }
      
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o comércio.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.approveBusiness(id);
      toast({ title: "Comércio aprovado!" });
      loadData();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível aprovar o comércio.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.rejectBusiness(id);
      toast({ title: "Comércio rejeitado!" });
      loadData();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar o comércio.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este comércio?")) return;

    try {
      await api.deleteBusiness(id);
      toast({ title: "Comércio excluído com sucesso!" });
      loadData();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o comércio.",
        variant: "destructive",
      });
    }
  };

  const toggleSponsor = async (business: Business) => {
    try {
      await api.updateBusiness(business.id, { is_sponsor: !business.is_sponsor });
      toast({ title: business.is_sponsor ? "Removido dos apoiadores!" : "Adicionado aos apoiadores!" });
      loadData();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status.",
        variant: "destructive",
      });
    }
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id.toString() === categoryId?.toString())?.name || "Sem categoria";
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "approved":
        return { label: "Aprovado", class: "bg-success/10 text-success" };
      case "rejected":
        return { label: "Rejeitado", class: "bg-destructive/10 text-destructive" };
      default:
        return { label: "Pendente", class: "bg-warning/10 text-warning" };
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
      {/* Pending Alert */}
      {pendingCount > 0 && (
        <div className="mb-6 p-4 bg-warning/10 border border-warning/20 rounded-xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-warning flex-shrink-0" />
          <p className="text-sm">
            <strong>{pendingCount}</strong> comércio{pendingCount > 1 ? "s" : ""} aguardando aprovação
          </p>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto"
            onClick={() => setFilterStatus("pending")}
          >
            Ver pendentes
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar comércios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="approved">Aprovados</SelectItem>
              <SelectItem value="rejected">Rejeitados</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterSponsor} onValueChange={(value: any) => setFilterSponsor(value)}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="sponsors">Apoiadores</SelectItem>
              <SelectItem value="regular">Regulares</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Comércio
        </Button>
      </div>

      {/* Business List */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                  Comércio
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground hidden md:table-cell">
                  Categoria
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">
                  Apoiador
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
              {filteredBusinesses.map((item) => {
                const statusConfig = getStatusConfig(item.status);
                const isPending = item.status === "pending";

                return (
                  <tr 
                    key={item.id} 
                    className={cn(
                      "hover:bg-muted/50 transition-colors",
                      isPending && "bg-warning/5"
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Store className="h-6 w-6 text-primary" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium line-clamp-1">{item.name}</p>
                          {isPending && item.owner_name && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {item.owner_name} - {item.owner_phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-sm">{getCategoryName(item.category_id)}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleSponsor(item)}
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors",
                          item.is_sponsor
                            ? "bg-warning/10 text-warning"
                            : "bg-muted text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {item.is_sponsor ? (
                          <>
                            <Star className="h-3.5 w-3.5 fill-current" />
                            Apoiador
                          </>
                        ) : (
                          <>
                            <StarOff className="h-3.5 w-3.5" />
                            Regular
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium", statusConfig.class)}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {isPending && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-success hover:text-success"
                              onClick={() => handleApprove(item.id)}
                              title="Aprovar"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleReject(item.id)}
                              title="Rejeitar"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredBusinesses.length === 0 && (
          <div className="text-center py-12">
            <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum comércio encontrado</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBusiness ? "Editar Comércio" : "Novo Comércio"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Imagem do Comércio</Label>
              <ImageUpload
                value={formData.image_url}
                onChange={(url) => setFormData({ ...formData, image_url: url })}
                category="businesses"
                aspectRatio="video"
                recommendedSize="800x450px"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome do comércio"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o comércio"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Rua, número..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Referência</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Próximo à..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(69) 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="5569999999999"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="instagram_url">Instagram</Label>
                <Input
                  id="instagram_url"
                  value={formData.instagram_url}
                  onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website_url">Site</Label>
                <Input
                  id="website_url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="opening_hours">Horário de Funcionamento</Label>
              <Input
                id="opening_hours"
                value={formData.opening_hours}
                onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })}
                placeholder="Seg-Sex 8h às 18h"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_sponsor"
                checked={formData.is_sponsor}
                onChange={(e) => setFormData({ ...formData, is_sponsor: e.target.checked })}
                className="rounded border-border"
              />
              <Label htmlFor="is_sponsor" className="cursor-pointer">
                Marcar como Apoiador
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingBusiness ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
