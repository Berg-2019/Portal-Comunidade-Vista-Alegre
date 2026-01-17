import { useState, useEffect } from "react";
import {
  AlertTriangle, Search, MapPin, MessageCircle,
  Lightbulb, Construction, Droplets, Trash2, TreePine, AlertCircle, Filter, Loader2, HardHat, Eye
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/services/api";
import { useSettings } from "@/hooks/useSettings";
import { DiarioObrasTab } from "@/components/ocorrencias/DiarioObrasTab";

interface Occurrence {
  id: number;
  title: string | null;
  description: string;
  category: string;
  location: string;
  reporter_name: string;
  status: string;
  priority: string;
  image_url: string | null;
  created_at: string;
}

const CATEGORIES = [
  { id: 'iluminacao', name: 'Iluminação', icon: 'Lightbulb' },
  { id: 'buraco', name: 'Buracos/Vias', icon: 'Construction' },
  { id: 'agua', name: 'Água/Esgoto', icon: 'Droplets' },
  { id: 'lixo', name: 'Lixo/Limpeza', icon: 'Trash2' },
  { id: 'seguranca', name: 'Segurança', icon: 'AlertCircle' },
  { id: 'outros', name: 'Outros', icon: 'TreePine' },
];

const iconMap: Record<string, React.ElementType> = {
  Lightbulb,
  Construction,
  Droplets,
  Trash2,
  TreePine,
  AlertCircle,
};

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  in_progress: "bg-info/10 text-info border-info/20",
  resolved: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  in_progress: "Em Andamento",
  resolved: "Resolvida",
  rejected: "Rejeitada",
};

function RelatosSection() {
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { getWhatsAppLink } = useSettings();

  useEffect(() => {
    loadOccurrences();
  }, []);

  const loadOccurrences = async () => {
    try {
      setLoading(true);
      const data = await api.getOccurrences();
      setOccurrences(data);
    } catch (error) {
      console.error('Erro ao carregar ocorrências:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOccurrences = occurrences.filter(item => {
    const title = item.title || '';
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryInfo = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId) || { name: 'Outros', icon: 'AlertCircle' };
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h2 className="font-semibold text-lg">Relatos da Comunidade</h2>
      </div>

      {/* Info Box */}
      <div className="bg-accent/10 border border-accent/20 rounded-lg p-3">
        <p className="text-sm text-muted-foreground">
          Problemas reportados pela comunidade via WhatsApp.
        </p>
        {getWhatsAppLink("Olá! Gostaria de reportar uma ocorrência.") && (
          <a
            href={getWhatsAppLink("Olá! Gostaria de reportar uma ocorrência.") || ""}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2"
          >
            <Button size="sm" variant="outline" className="gap-2 text-xs">
              <MessageCircle className="h-3 w-3" />
              Reportar
            </Button>
          </a>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-9 text-sm"
        />
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-1">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory(null)}
          className="h-7 text-xs"
        >
          Todas
        </Button>
        {CATEGORIES.slice(0, 4).map(category => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className="h-7 text-xs"
          >
            {category.name}
          </Button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filteredOccurrences.length === 0 ? (
        <div className="text-center py-8">
          <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhuma ocorrência encontrada.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
          {filteredOccurrences.slice(0, 10).map((item) => {
            const category = getCategoryInfo(item.category);
            const Icon = iconMap[category.icon] || AlertCircle;

            return (
              <div
                key={item.id}
                className="bg-card rounded-lg p-3 shadow-sm border"
              >
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1 mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusColors[item.status] || statusColors.pending}`}>
                        {statusLabels[item.status] || 'Pendente'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <h4 className="font-medium text-sm mb-1 line-clamp-1">
                      {item.title || `${category.name}`}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>

                    <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{item.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredOccurrences.length > 10 && (
            <p className="text-xs text-center text-muted-foreground py-2">
              Mostrando 10 de {filteredOccurrences.length} ocorrências
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function Ocorrencias() {
  return (
    <Layout>
      {/* Header */}
      <section className="bg-gradient-hero text-primary-foreground py-12">
        <div className="container">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="h-8 w-8" />
              <h1 className="font-heading text-3xl md:text-4xl font-bold">
                Portal da Transparência
              </h1>
            </div>
            <p className="text-primary-foreground/85">
              Acompanhe as obras em andamento e os problemas reportados pela comunidade.
              Aqui você pode ver o que está sendo feito pelo bairro.
            </p>
          </div>
        </div>
      </section>

      <section className="container py-8">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column - Diário de Obras */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <HardHat className="h-6 w-6 text-primary" />
              <h2 className="font-heading text-2xl font-bold">Diário de Obras</h2>
            </div>
            <DiarioObrasTab />
          </div>

          {/* Sidebar - Relatos */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <RelatosSection />
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
