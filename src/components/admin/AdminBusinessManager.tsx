import { useState } from "react";
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
  MapPin,
  MessageCircle,
  Instagram,
  ExternalLink,
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
import { Business, BusinessCategory } from "@/types";
import { businesses as initialBusinesses, businessCategories } from "@/data/mockData";
import ImageUpload from "./ImageUpload";

interface ExtendedBusiness extends Business {
  imageUrl?: string;
  instagramUrl?: string;
  websiteUrl?: string;
  location?: string;
  isSponsor?: boolean;
}

export default function AdminBusinessManager() {
  const [businessList, setBusinessList] = useState<ExtendedBusiness[]>(initialBusinesses as ExtendedBusiness[]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSponsor, setFilterSponsor] = useState<"all" | "sponsors" | "regular">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<ExtendedBusiness | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryId: "",
    address: "",
    phone: "",
    whatsapp: "",
    instagramUrl: "",
    websiteUrl: "",
    location: "",
    openingHours: "",
    imageUrl: "",
    isSponsor: false,
    approved: false,
  });

  const filteredBusinesses = businessList.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter =
      filterSponsor === "all" ||
      (filterSponsor === "sponsors" && item.isSponsor) ||
      (filterSponsor === "regular" && !item.isSponsor);
    
    return matchesSearch && matchesFilter;
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      categoryId: "",
      address: "",
      phone: "",
      whatsapp: "",
      instagramUrl: "",
      websiteUrl: "",
      location: "",
      openingHours: "",
      imageUrl: "",
      isSponsor: false,
      approved: false,
    });
    setEditingBusiness(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (business: ExtendedBusiness) => {
    setEditingBusiness(business);
    setFormData({
      name: business.name,
      description: business.description,
      categoryId: business.categoryId,
      address: business.address || "",
      phone: business.phone || "",
      whatsapp: business.whatsapp || "",
      instagramUrl: business.instagramUrl || "",
      websiteUrl: business.websiteUrl || "",
      location: business.location || "",
      openingHours: business.openingHours || "",
      imageUrl: business.imageUrl || "",
      isSponsor: business.isSponsor || false,
      approved: business.approved,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.description || !formData.categoryId) {
      toast({
        title: "Erro",
        description: "Preencha os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (editingBusiness) {
      setBusinessList((prev) =>
        prev.map((item) =>
          item.id === editingBusiness.id
            ? {
                ...item,
                ...formData,
                updatedAt: new Date().toISOString(),
              }
            : item
        )
      );
      toast({ title: "Comércio atualizado com sucesso!" });
    } else {
      const newBusiness: ExtendedBusiness = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setBusinessList((prev) => [newBusiness, ...prev]);
      toast({ title: "Comércio cadastrado com sucesso!" });
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    setBusinessList((prev) => prev.filter((item) => item.id !== id));
    toast({ title: "Comércio excluído com sucesso!" });
  };

  const toggleApproved = (id: string) => {
    setBusinessList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, approved: !item.approved } : item
      )
    );
    toast({ title: "Status de aprovação alterado!" });
  };

  const toggleSponsor = (id: string) => {
    setBusinessList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isSponsor: !item.isSponsor } : item
      )
    );
    toast({ title: "Status de patrocinador alterado!" });
  };

  const getCategoryName = (categoryId: string) => {
    return businessCategories.find((c) => c.id === categoryId)?.name || "Sem categoria";
  };

  return (
    <div>
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
          <Select value={filterSponsor} onValueChange={(value: any) => setFilterSponsor(value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar" />
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
              {filteredBusinesses.map((item) => (
                <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
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
                        <p className="text-sm text-muted-foreground line-clamp-1 md:hidden">
                          {getCategoryName(item.categoryId)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="text-sm">{getCategoryName(item.categoryId)}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleSponsor(item.id)}
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors",
                        item.isSponsor
                          ? "bg-warning/10 text-warning"
                          : "bg-muted text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {item.isSponsor ? (
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
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
                        item.approved
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {item.approved ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Aprovado
                        </>
                      ) : (
                        <>
                          <X className="h-3.5 w-3.5" />
                          Pendente
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleApproved(item.id)}
                        title={item.approved ? "Desaprovar" : "Aprovar"}
                      >
                        {item.approved ? (
                          <X className="h-4 w-4" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
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
              ))}
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
                value={formData.imageUrl}
                onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                category="general"
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
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
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
                <Label htmlFor="location">Localização (Google Maps)</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="https://maps.google.com/..."
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
                <Label htmlFor="whatsapp">WhatsApp (com DDD)</Label>
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
                <Label htmlFor="instagramUrl">Link do Instagram</Label>
                <Input
                  id="instagramUrl"
                  value={formData.instagramUrl}
                  onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="websiteUrl">Site / Link Externo</Label>
                <Input
                  id="websiteUrl"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="openingHours">Horário de Funcionamento</Label>
              <Input
                id="openingHours"
                value={formData.openingHours}
                onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
                placeholder="Seg-Sex: 8h-18h | Sáb: 8h-12h"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isSponsor"
                  checked={formData.isSponsor}
                  onChange={(e) => setFormData({ ...formData, isSponsor: e.target.checked })}
                  className="h-4 w-4 rounded border-border"
                />
                <Label htmlFor="isSponsor" className="cursor-pointer flex items-center gap-1">
                  <Star className="h-4 w-4 text-warning" />
                  Marcar como Apoiador (aparece no carrossel)
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="approved"
                  checked={formData.approved}
                  onChange={(e) => setFormData({ ...formData, approved: e.target.checked })}
                  className="h-4 w-4 rounded border-border"
                />
                <Label htmlFor="approved" className="cursor-pointer">
                  Aprovado (visível no site)
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingBusiness ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
