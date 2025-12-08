import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  Newspaper, AlertTriangle, Store, Phone, Calendar, Package, 
  ArrowRight, TreePine, MapPin, MessageCircle, Users 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { api } from "@/services/api";
import SponsorCarousel from "@/components/SponsorCarousel";

// Imagens da comunidade
import vistaAereaCidade from "@/assets/vista-aerea-cidade.png";
import quadrasEsportivas from "@/assets/quadras-esportivas.png";
import pracaComunidade from "@/assets/praca-comunidade.png";

const features = [
  {
    icon: Newspaper,
    title: "Notícias",
    description: "Fique por dentro dos comunicados e eventos da comunidade.",
    href: "/noticias",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: AlertTriangle,
    title: "Ocorrências",
    description: "Acompanhe problemas do bairro e ajude a resolver.",
    href: "/ocorrencias",
    color: "bg-warning/10 text-warning",
  },
  {
    icon: Store,
    title: "Comércios",
    description: "Conheça e apoie os negócios locais do Vista Alegre.",
    href: "/comercios",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: Phone,
    title: "Contatos Úteis",
    description: "Telefones importantes sempre à mão.",
    href: "/contatos-uteis",
    color: "bg-info/10 text-info",
  },
  {
    icon: Calendar,
    title: "Quadras",
    description: "Reserve quadras esportivas da comunidade.",
    href: "/quadras",
    color: "bg-success/10 text-success",
  },
  {
    icon: Package,
    title: "Encomendas",
    description: "Consulte suas encomendas no correio comunitário.",
    href: "/encomendas",
    color: "bg-earth/10 text-earth",
  },
];

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  in_progress: "bg-info/10 text-info",
  resolved: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  in_progress: "Em Andamento",
  resolved: "Resolvida",
  rejected: "Rejeitada",
};

interface NewsItem {
  id: number;
  title: string;
  slug: string;
  summary: string;
  created_at: string;
}

interface OccurrenceItem {
  id: number;
  title: string;
  description: string;
  location: string;
  status: string;
  created_at: string;
}

export default function Index() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [occurrences, setOccurrences] = useState<OccurrenceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [newsData, occurrencesData] = await Promise.all([
          api.getNews(true).catch(() => []),
          api.getOccurrences().catch(() => []),
        ]);
        setNews(newsData.slice(0, 3));
        setOccurrences(occurrencesData.slice(0, 3));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <Layout>
      {/* Hero Section with Background Image */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src={vistaAereaCidade} 
            alt="Vista aérea de Vista Alegre do Abunã" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/70 to-primary/90" />
        </div>
        
        <div className="container relative py-16 md:py-24 z-10">
          <div className="max-w-3xl mx-auto text-center text-primary-foreground">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/15 backdrop-blur-sm text-sm mb-6 animate-fade-up border border-primary-foreground/20">
              <MapPin className="h-4 w-4" />
              Vista Alegre do Abunã, Porto Velho - RO
            </div>
            <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold mb-6 animate-fade-up drop-shadow-lg" style={{ animationDelay: "0.1s" }}>
              Portal Comunitário
              <br />
              <span className="text-primary-foreground/95">Vista Alegre</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 animate-fade-up drop-shadow" style={{ animationDelay: "0.2s" }}>
              Conectando moradores, fortalecendo nossa comunidade. 
              Notícias, serviços e informações em um só lugar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up" style={{ animationDelay: "0.3s" }}>
              <Link to="/noticias">
                <Button size="lg" className="w-full sm:w-auto bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg">
                  <Newspaper className="h-5 w-5 mr-2" />
                  Ver Notícias
                </Button>
              </Link>
              <Link to="/ocorrencias">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-success/60 text-success hover:bg-success/15 backdrop-blur-sm">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Reportar Problema
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Community Highlights Section */}
      <section className="container py-16">
        <div className="text-center mb-12">
          <h2 className="font-heading text-2xl md:text-3xl font-bold mb-4">
            Nossa Comunidade
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Vista Alegre do Abunã: uma comunidade vibrante no coração da Amazônia.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Quadras Esportivas Card */}
          <Link 
            to="/quadras" 
            className="group relative rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover-lift"
          >
            <div className="aspect-[16/10] overflow-hidden">
              <img 
                src={quadrasEsportivas} 
                alt="Quadras esportivas de Vista Alegre" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-primary-foreground">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5" />
                <span className="text-sm font-medium text-primary-foreground/80">Esporte & Lazer</span>
              </div>
              <h3 className="font-heading text-xl md:text-2xl font-bold mb-2">Quadras Esportivas</h3>
              <p className="text-primary-foreground/85 text-sm md:text-base">
                Complexo esportivo com quadras de futebol, vôlei e basquete. Reserve seu horário!
              </p>
            </div>
          </Link>

          {/* Praça da Comunidade Card */}
          <Link 
            to="/sobre" 
            className="group relative rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover-lift"
          >
            <div className="aspect-[16/10] overflow-hidden">
              <img 
                src={pracaComunidade} 
                alt="Praça da comunidade Vista Alegre" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-primary-foreground">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5" />
                <span className="text-sm font-medium text-primary-foreground/80">Convivência</span>
              </div>
              <h3 className="font-heading text-xl md:text-2xl font-bold mb-2">Praça da Comunidade</h3>
              <p className="text-primary-foreground/85 text-sm md:text-base">
                Espaço de lazer e encontro para famílias e moradores. Conheça nossa história!
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-16">
        <div className="text-center mb-12">
          <h2 className="font-heading text-2xl md:text-3xl font-bold mb-4">
            O que você encontra aqui
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Tudo que você precisa para se manter informado e conectado com a comunidade.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.title}
                to={feature.href}
                className="group bg-card rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all duration-300 hover-lift animate-fade-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className={`inline-flex p-3 rounded-xl ${feature.color} mb-4`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {feature.description}
                </p>
                <span className="inline-flex items-center text-sm font-medium text-primary">
                  Acessar <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent News Section */}
      <section className="bg-muted py-16">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h2 className="font-heading text-2xl md:text-3xl font-bold mb-2">
                Últimas Notícias
              </h2>
              <p className="text-muted-foreground">
                Fique por dentro do que acontece na comunidade
              </p>
            </div>
            <Link to="/noticias" className="mt-4 md:mt-0">
              <Button variant="outline">
                Ver todas as notícias
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-xl overflow-hidden shadow-card animate-pulse">
                  <div className="h-40 bg-muted" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-muted rounded w-1/4" />
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : news.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {news.map((item, index) => (
                <Link
                  key={item.id}
                  to={`/noticias/${item.slug}`}
                  className="group bg-card rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 animate-fade-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="h-40 bg-gradient-primary flex items-center justify-center">
                    <Newspaper className="h-12 w-12 text-primary-foreground/50" />
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-muted-foreground mb-2">
                      {new Date(item.created_at).toLocaleDateString('pt-BR')}
                    </p>
                    <h3 className="font-heading font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.summary}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl">
              <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma notícia publicada ainda.</p>
            </div>
          )}
        </div>
      </section>

      {/* Recent Occurrences Section */}
      <section className="container py-16">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h2 className="font-heading text-2xl md:text-3xl font-bold mb-2">
              Ocorrências Recentes
            </h2>
            <p className="text-muted-foreground">
              Acompanhe os problemas reportados na comunidade
            </p>
          </div>
          <Link to="/ocorrencias" className="mt-4 md:mt-0">
            <Button variant="outline">
              Ver todas
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-xl p-5 shadow-card animate-pulse">
                <div className="flex justify-between mb-3">
                  <div className="h-6 bg-muted rounded w-20" />
                  <div className="h-4 bg-muted rounded w-16" />
                </div>
                <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-full mb-3" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : occurrences.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-4">
            {occurrences.map((item, index) => (
              <div
                key={item.id}
                className="bg-card rounded-xl p-5 shadow-card animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[item.status] || 'bg-muted text-muted-foreground'}`}>
                    {statusLabels[item.status] || item.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <h3 className="font-semibold mb-2 line-clamp-2">{item.title || 'Ocorrência'}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {item.description}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {item.location}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-xl">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma ocorrência registrada.</p>
          </div>
        )}
      </section>

      {/* Sponsor Carousel */}
      <SponsorCarousel />

      {/* WhatsApp CTA */}
      <section className="container py-16">
        <div className="bg-gradient-primary rounded-2xl p-8 md:p-12 text-center text-primary-foreground">
          <TreePine className="h-12 w-12 mx-auto mb-4 opacity-90" />
          <h2 className="font-heading text-2xl md:text-3xl font-bold mb-4">
            Participe da Comunidade
          </h2>
          <p className="text-primary-foreground/85 mb-6 max-w-xl mx-auto">
            Entre no grupo do WhatsApp da comunidade para receber atualizações, 
            participar de discussões e ajudar a melhorar nosso bairro.
          </p>
          <Link to="/comunidade">
            <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
              <MessageCircle className="h-5 w-5 mr-2" />
              Ver Grupos da Comunidade
            </Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
}
