import { useState } from "react";
import { 
  AlertTriangle, Search, MapPin, MessageCircle, 
  Lightbulb, Construction, Droplets, Trash2, TreePine, AlertCircle, Filter
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { occurrences, occurrenceCategories } from "@/data/mockData";
import { OccurrenceStatus } from "@/types";

const iconMap: Record<string, React.ElementType> = {
  Lightbulb,
  Construction,
  Droplets,
  Trash2,
  TreePine,
  AlertCircle,
};

const statusColors: Record<OccurrenceStatus, string> = {
  pendente: "bg-warning/10 text-warning border-warning/20",
  em_analise: "bg-info/10 text-info border-info/20",
  em_andamento: "bg-accent/10 text-accent border-accent/20",
  resolvida: "bg-success/10 text-success border-success/20",
  rejeitada: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusLabels: Record<OccurrenceStatus, string> = {
  pendente: "Pendente",
  em_analise: "Em Análise",
  em_andamento: "Em Andamento",
  resolvida: "Resolvida",
  rejeitada: "Rejeitada",
};

export default function Ocorrencias() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<OccurrenceStatus | null>(null);

  const publishedOccurrences = occurrences.filter(o => o.published);
  
  const filteredOccurrences = publishedOccurrences.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || item.categoryId === selectedCategory;
    const matchesStatus = !selectedStatus || item.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

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
              href="https://wa.me/5569999999999?text=Olá! Gostaria de reportar uma ocorrência no bairro Vista Alegre."
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
            {occurrenceCategories.map(category => {
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
            {(Object.keys(statusLabels) as OccurrenceStatus[]).map(status => (
              <Button
                key={status}
                variant={selectedStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus(status)}
              >
                {statusLabels[status]}
              </Button>
            ))}
          </div>
        </div>

        {/* Occurrences List */}
        {filteredOccurrences.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma ocorrência encontrada.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOccurrences.map((item, index) => {
              const category = occurrenceCategories.find(c => c.id === item.categoryId);
              const Icon = category ? (iconMap[category.icon] || AlertCircle) : AlertCircle;
              
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
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[item.status]}`}>
                          {statusLabels[item.status]}
                        </span>
                        {category && (
                          <span className="text-xs text-muted-foreground">
                            {category.name}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          • {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      
                      <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                      <p className="text-muted-foreground mb-3">{item.description}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {item.location}
                        </span>
                        {item.userName && (
                          <span className="text-muted-foreground">
                            Reportado por: {item.userName}
                          </span>
                        )}
                      </div>
                    </div>
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
