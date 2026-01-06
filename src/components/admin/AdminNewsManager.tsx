import { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Search,
  FileText,
  Loader2,
  Video,
  Link,
  Upload,
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
import VideoUpload from "./VideoUpload";

interface News {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category_id: number;
  category_name?: string;
  image_url?: string;
  video_url?: string;
  published: boolean;
  created_at: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function AdminNewsManager() {
  const [newsList, setNewsList] = useState<News[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    content: "",
    category_id: "",
    image_url: "",
    video_url: "",
    published: false,
  });
  const [videoInputType, setVideoInputType] = useState<'url' | 'upload'>('url');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [newsData, categoriesData] = await Promise.all([
        api.getNews(),
        api.getCategories(),
      ]);
      setNewsList(newsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({ title: "Erro ao carregar dados", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredNews = newsList.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.summary?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      title: "",
      summary: "",
      content: "",
      category_id: "",
      image_url: "",
      video_url: "",
      published: false,
    });
    setEditingNews(null);
  };

  const openCreateModal = () => {
    resetForm();
    setVideoInputType('url');
    setIsModalOpen(true);
  };

  const openEditModal = (news: News) => {
    setEditingNews(news);
    setFormData({
      title: news.title,
      summary: news.summary || "",
      content: news.content,
      category_id: news.category_id?.toString() || "",
      image_url: news.image_url || "",
      video_url: news.video_url || "",
      published: news.published,
    });
    
    // Detect video input type based on URL
    if (news.video_url) {
      const isYouTube = news.video_url.includes('youtube') || news.video_url.includes('youtu.be');
      setVideoInputType(isYouTube ? 'url' : 'upload');
    } else {
      setVideoInputType('url');
    }
    
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.summary || !formData.content || !formData.category_id) {
      toast({ title: "Preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        title: formData.title,
        summary: formData.summary,
        content: formData.content,
        category_id: parseInt(formData.category_id),
        image_url: formData.image_url || null,
        video_url: formData.video_url || null,
        published: formData.published,
      };

      if (editingNews) {
        await api.updateNews(editingNews.id.toString(), data);
        toast({ title: "Notícia atualizada!" });
      } else {
        await api.createNews(data);
        toast({ title: "Notícia criada!" });
      }

      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error("Error saving news:", error);
      toast({ title: "Erro ao salvar notícia", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteNews(id.toString());
      setNewsList((prev) => prev.filter((item) => item.id !== id));
      toast({ title: "Notícia excluída!" });
    } catch (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  };

  const togglePublished = async (news: News) => {
    try {
      await api.updateNews(news.id.toString(), { published: !news.published });
      setNewsList((prev) =>
        prev.map((item) =>
          item.id === news.id ? { ...item, published: !item.published } : item
        )
      );
      toast({ title: "Status alterado!" });
    } catch (error) {
      toast({ title: "Erro ao alterar status", variant: "destructive" });
    }
  };

  const getCategoryName = (categoryId: number) => {
    return categories.find((c) => c.id === categoryId)?.name || "Sem categoria";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Título</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground hidden md:table-cell">Categoria</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground hidden lg:table-cell">Data</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Status</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredNews.map((item) => (
                <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {item.image_url && (
                        <img src={item.image_url} alt="" className="w-12 h-12 object-cover rounded-lg hidden sm:block" />
                      )}
                      <div>
                        <p className="font-medium line-clamp-1">{item.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1 md:hidden">{getCategoryName(item.category_id)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="text-sm">{getCategoryName(item.category_id)}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground hidden lg:table-cell">
                    {new Date(item.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
                      item.published ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                    )}>
                      {item.published ? <><Eye className="h-3.5 w-3.5" />Publicado</> : <><EyeOff className="h-3.5 w-3.5" />Rascunho</>}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => togglePublished(item)}>
                        {item.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
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
            <DialogTitle>{editingNews ? "Editar Notícia" : "Nova Notícia"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Título da notícia" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                <SelectTrigger><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Resumo *</Label>
              <Textarea id="summary" value={formData.summary} onChange={(e) => setFormData({ ...formData, summary: e.target.value })} placeholder="Breve resumo" rows={2} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Conteúdo *</Label>
              <Textarea id="content" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} placeholder="Conteúdo completo" rows={8} />
            </div>

            <div className="space-y-2">
              <Label>Imagem da Notícia</Label>
              <ImageUpload value={formData.image_url} onChange={(url) => setFormData({ ...formData, image_url: url })} category="news" aspectRatio="video" recommendedSize="1200x630px" />
            </div>

            <div className="space-y-2">
              <Label>Vídeo da Notícia</Label>
              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  variant={videoInputType === 'url' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setVideoInputType('url')}
                >
                  <Link className="h-4 w-4 mr-2" />
                  URL do YouTube
                </Button>
                <Button
                  type="button"
                  variant={videoInputType === 'upload' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setVideoInputType('upload')}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload de Vídeo
                </Button>
              </div>
              
              {videoInputType === 'url' ? (
                <Input 
                  id="videoUrl" 
                  value={formData.video_url} 
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })} 
                  placeholder="https://youtube.com/watch?v=..." 
                />
              ) : (
                <VideoUpload 
                  value={formData.video_url} 
                  onChange={(url) => setFormData({ ...formData, video_url: url })} 
                  category="news"
                  maxSizeMB={100}
                />
              )}
              
              {formData.video_url && (
                <p className="text-xs text-muted-foreground">
                  {formData.video_url.includes('youtube') || formData.video_url.includes('youtu.be') 
                    ? '🎬 Vídeo do YouTube' 
                    : '📹 Vídeo enviado'}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="published" checked={formData.published} onChange={(e) => setFormData({ ...formData, published: e.target.checked })} className="h-4 w-4 rounded border-border" />
              <Label htmlFor="published" className="cursor-pointer">Publicar imediatamente</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingNews ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
