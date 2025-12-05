import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Search,
  FileText,
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
import { News, NewsCategory } from "@/types";
import { news as initialNews, newsCategories } from "@/data/mockData";

export default function AdminNewsManager() {
  const [newsList, setNewsList] = useState<News[]>(initialNews);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    content: "",
    categoryId: "",
    published: false,
  });

  const filteredNews = newsList.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      title: "",
      summary: "",
      content: "",
      categoryId: "",
      published: false,
    });
    setEditingNews(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (news: News) => {
    setEditingNews(news);
    setFormData({
      title: news.title,
      summary: news.summary,
      content: news.content,
      categoryId: news.categoryId,
      published: news.published,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.summary || !formData.content || !formData.categoryId) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (editingNews) {
      setNewsList((prev) =>
        prev.map((item) =>
          item.id === editingNews.id
            ? {
                ...item,
                ...formData,
                slug: formData.title.toLowerCase().replace(/\s+/g, "-"),
                updatedAt: new Date().toISOString(),
              }
            : item
        )
      );
      toast({ title: "Notícia atualizada com sucesso!" });
    } else {
      const newNews: News = {
        id: Date.now().toString(),
        ...formData,
        slug: formData.title.toLowerCase().replace(/\s+/g, "-"),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setNewsList((prev) => [newNews, ...prev]);
      toast({ title: "Notícia criada com sucesso!" });
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    setNewsList((prev) => prev.filter((item) => item.id !== id));
    toast({ title: "Notícia excluída com sucesso!" });
  };

  const togglePublished = (id: string) => {
    setNewsList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, published: !item.published } : item
      )
    );
    toast({ title: "Status de publicação alterado!" });
  };

  const getCategoryName = (categoryId: string) => {
    return newsCategories.find((c) => c.id === categoryId)?.name || "Sem categoria";
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar notícias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Notícia
        </Button>
      </div>

      {/* News List */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                  Título
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground hidden md:table-cell">
                  Categoria
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground hidden lg:table-cell">
                  Data
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
              {filteredNews.map((item) => (
                <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium line-clamp-1">{item.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1 md:hidden">
                      {getCategoryName(item.categoryId)}
                    </p>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="text-sm">{getCategoryName(item.categoryId)}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground hidden lg:table-cell">
                    {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
                        item.published
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {item.published ? (
                        <>
                          <Eye className="h-3.5 w-3.5" />
                          Publicado
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3.5 w-3.5" />
                          Rascunho
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePublished(item.id)}
                        title={item.published ? "Despublicar" : "Publicar"}
                      >
                        {item.published ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
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

        {filteredNews.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma notícia encontrada</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingNews ? "Editar Notícia" : "Nova Notícia"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Título da notícia"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) =>
                  setFormData({ ...formData, categoryId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {newsCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Resumo *</Label>
              <Textarea
                id="summary"
                value={formData.summary}
                onChange={(e) =>
                  setFormData({ ...formData, summary: e.target.value })
                }
                placeholder="Breve resumo da notícia"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Conteúdo *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="Conteúdo completo da notícia (suporta markdown)"
                rows={8}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="published"
                checked={formData.published}
                onChange={(e) =>
                  setFormData({ ...formData, published: e.target.checked })
                }
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="published" className="cursor-pointer">
                Publicar imediatamente
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingNews ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
