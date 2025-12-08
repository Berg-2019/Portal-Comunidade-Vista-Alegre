import { useState, useEffect } from "react";
import { 
  AlertTriangle, Search, MapPin, MessageCircle, 
  Lightbulb, Construction, Droplets, Trash2, TreePine, AlertCircle, Filter, Loader2
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/services/api";
import { useSettings } from "@/hooks/useSettings";

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

export default function Ocorrencias() {
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
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
    const matchesStatus = !selectedStatus || item.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getCategoryInfo = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId) || { name: 'Outros', icon: 'AlertCircle' };
  };

  return (
    <Layout>
      {/* Header */}
      <section className="bg-gradient-hero text-primary-foreground py-12">
        <div className="container">
          <div className="max-w-2xl">
            <h1 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              Ocorrências
            </h1>
            <p className="text-primary-foreground/85 mb-6">
              Acompanhe os problemas reportados na comunidade e ajude a manter nosso bairro organizado.
            </p>
            <a
              href={getWhatsAppLink("Olá! Gostaria de reportar uma ocorrência no bairro Vista Alegre.")}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                <MessageCircle className="h-5 w-5 mr-2" />
                Reportar via WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section className="container py-8">
        {/* Info Box */}
        <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <MessageCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-accent mb-1">Como reportar uma ocorrência?</p>
              <p className="text-sm text-muted-foreground">
                Entre em contato pelo WhatsApp da comunidade informando o local, tipo do problema e uma descrição. 
                Nossa equipe irá analisar e, se aprovado, a ocorrência aparecerá nesta lista para acompanhamento.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar ocorrências..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 mr-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Categoria:</span>
            </div>
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              Todas
            </Button>
            {CATEGORIES.map(category => {
              const Icon = iconMap[category.icon] || AlertCircle;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {category.name}
                </Button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 mr-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Status:</span>
            </div>
            <Button
              variant={selectedStatus === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus(null)}
            >
              Todos
            </Button>
            {Object.entries(statusLabels).map(([status, label]) => (
              <Button
                key={status}
                variant={selectedStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus(status)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredOccurrences.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma ocorrência encontrada.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOccurrences.map((item, index) => {
              const category = getCategoryInfo(item.category);
              const Icon = iconMap[category.icon] || AlertCircle;
              
              return (
                <div
                  key={item.id}
                  className="bg-card rounded-xl p-5 shadow-card animate-fade-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[item.status] || statusColors.pending}`}>
                          {statusLabels[item.status] || 'Pendente'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {category.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          • {new Date(item.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        {item.priority === 'urgent' && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                            Urgente
                          </span>
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-lg mb-2">
                        {item.title || `Ocorrência de ${category.name}`}
                      </h3>
                      <p className="text-muted-foreground mb-3">{item.description}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {item.location}
                        </span>
                        {item.reporter_name && (
                          <span className="text-muted-foreground">
                            Reportado por: {item.reporter_name}
                          </span>
                        )}
                      </div>
                    </div>

                    {item.image_url && (
                      <div className="flex-shrink-0">
                        <img 
                          src={item.image_url} 
                          alt="Foto da ocorrência" 
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </Layout>
  );
}
