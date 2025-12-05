import { Link } from "react-router-dom";
import { 
  Newspaper, AlertTriangle, Store, Phone, Calendar, Package, 
  MessageCircle, ArrowRight, TreePine, MapPin 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { news, occurrences, businesses } from "@/data/mockData";
import SponsorCarousel from "@/components/SponsorCarousel";

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

const statusColors = {
  pendente: "bg-warning/10 text-warning",
  em_analise: "bg-info/10 text-info",
  em_andamento: "bg-accent/10 text-accent",
  resolvida: "bg-success/10 text-success",
  rejeitada: "bg-destructive/10 text-destructive",
};

const statusLabels = {
  pendente: "Pendente",
  em_analise: "Em Análise",
  em_andamento: "Em Andamento",
  resolvida: "Resolvida",
  rejeitada: "Rejeitada",
};

export default function Index() {
  const recentNews = news.filter(n => n.published).slice(0, 3);
  const recentOccurrences = occurrences.filter(o => o.published).slice(0, 3);
  const featuredBusinesses = businesses.filter(b => b.approved).slice(0, 4);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-gradient-hero text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 pattern-amazon" />
        <div className="container relative py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 text-sm mb-6 animate-fade-up">
              <MapPin className="h-4 w-4" />
              Vista Alegre do Abunã, Porto Velho - RO
            </div>
            <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
              Portal Comunitário
              <br />
              <span className="text-primary-foreground/90">Vista Alegre</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/85 mb-8 animate-fade-up" style={{ animationDelay: "0.2s" }}>
              Conectando moradores, fortalecendo nossa comunidade. 
              Notícias, serviços e informações em um só lugar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up" style={{ animationDelay: "0.3s" }}>
              <Link to="/noticias">
                <Button size="lg" className="w-full sm:w-auto bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                  <Newspaper className="h-5 w-5 mr-2" />
                  Ver Notícias
                </Button>
              </Link>
              <Link to="/ocorrencias">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Reportar Problema
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
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

          <div className="grid md:grid-cols-3 gap-6">
            {recentNews.map((item, index) => (
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
                    {new Date(item.createdAt).toLocaleDateString('pt-BR')}
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

        <div className="grid md:grid-cols-3 gap-4">
          {recentOccurrences.map((item, index) => (
            <div
              key={item.id}
              className="bg-card rounded-xl p-5 shadow-card animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[item.status]}`}>
                  {statusLabels[item.status]}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <h3 className="font-semibold mb-2 line-clamp-2">{item.title}</h3>
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
      </section>

      {/* Local Businesses Section */}
      <section className="bg-muted py-16">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h2 className="font-heading text-2xl md:text-3xl font-bold mb-2">
                Comércios Locais
              </h2>
              <p className="text-muted-foreground">
                Apoie os negócios da nossa comunidade
              </p>
            </div>
            <Link to="/comercios" className="mt-4 md:mt-0">
              <Button variant="outline">
                Ver todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredBusinesses.map((business, index) => (
              <div
                key={business.id}
                className="bg-card rounded-xl p-5 shadow-card animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Store className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{business.name}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {business.description}
                </p>
                {business.whatsapp && (
                  <a
                    href={`https://wa.me/${business.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-primary hover:underline"
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    WhatsApp
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
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
          <a
            href="https://wa.me/5569999999999"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
              <MessageCircle className="h-5 w-5 mr-2" />
              Entrar no Grupo
            </Button>
          </a>
        </div>
      </section>
    </Layout>
  );
}
