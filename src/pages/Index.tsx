import { Link } from "react-router-dom";
import { Calendar, Package, MessageCircle, ArrowRight, Clock, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";

const features = [
  {
    icon: Calendar,
    title: "Agenda de Quadras",
    description: "Visualize os horários disponíveis e reserve via WhatsApp de forma rápida e prática.",
    href: "/quadras",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Package,
    title: "Encomendas",
    description: "Consulte se sua encomenda chegou e veja os prazos para retirada no correio comunitário.",
    href: "/encomendas",
    color: "bg-accent/10 text-accent",
  },
];

const recentPackages = [
  { name: "Maria Silva", code: "RP123456789BR", status: "Aguardando" },
  { name: "João Santos", code: "RP987654321BR", status: "Aguardando" },
  { name: "Ana Oliveira", code: "RP456789123BR", status: "Aguardando" },
];

export default function Index() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-gradient-hero text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="container relative py-20 md:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-up">
              Gestão Comunitária
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 animate-fade-up" style={{ animationDelay: "0.1s" }}>
              Plataforma integrada para agendamento de quadras esportivas e gestão de encomendas da comunidade.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up" style={{ animationDelay: "0.2s" }}>
              <Link to="/quadras">
                <Button variant="hero" size="lg" className="w-full sm:w-auto">
                  <Calendar className="h-5 w-5 mr-2" />
                  Ver Quadras
                </Button>
              </Link>
              <Link to="/encomendas">
                <Button variant="hero" size="lg" className="w-full sm:w-auto">
                  <Package className="h-5 w-5 mr-2" />
                  Consultar Encomendas
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Features Section */}
      <section className="container py-16 md:py-20">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Nossos Serviços
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Tudo que você precisa para aproveitar os recursos da comunidade em um só lugar.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.title}
                to={feature.href}
                className="group relative bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover-lift animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`inline-flex p-3 rounded-xl ${feature.color} mb-4`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground mb-4">
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

      {/* Recent Packages Section */}
      <section className="bg-muted py-16">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h2 className="font-heading text-2xl md:text-3xl font-bold mb-2">
                Encomendas Recentes
              </h2>
              <p className="text-muted-foreground">
                Últimas encomendas aguardando retirada
              </p>
            </div>
            <Link to="/encomendas" className="mt-4 md:mt-0">
              <Button variant="outline">
                <Search className="h-4 w-4 mr-2" />
                Buscar minha encomenda
              </Button>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentPackages.map((pkg, index) => (
              <div
                key={pkg.code}
                className="bg-card rounded-xl p-4 shadow-sm animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium">{pkg.name}</p>
                    <p className="text-sm text-muted-foreground font-mono">{pkg.code}</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
                    {pkg.status}
                  </span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  Prazo: 7 dias
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp CTA */}
      <section className="container py-16">
        <div className="bg-gradient-primary rounded-2xl p-8 md:p-12 text-center text-primary-foreground">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-90" />
          <h2 className="font-heading text-2xl md:text-3xl font-bold mb-4">
            Reserve pelo WhatsApp
          </h2>
          <p className="text-primary-foreground/90 mb-6 max-w-xl mx-auto">
            Faça suas reservas de quadras de forma rápida e prática diretamente pelo WhatsApp da comunidade.
          </p>
          <a
            href="https://wa.me/5500000000000"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="hero" size="lg">
              <MessageCircle className="h-5 w-5 mr-2" />
              Abrir WhatsApp
            </Button>
          </a>
        </div>
      </section>
    </Layout>
  );
}
