import { useState, useEffect } from "react";
import { 
  Users, MessageCircle, ShoppingBag, Trophy, Shield, 
  Megaphone, Heart, ExternalLink, Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";

interface WhatsAppGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  invite_link: string;
  icon: string;
  member_count: number | null;
  is_active: boolean;
}

const categoryConfig: Record<string, { label: string; icon: any; color: string }> = {
  geral: { label: "Geral", icon: Users, color: "bg-primary/10 text-primary" },
  comercio: { label: "Comércio", icon: ShoppingBag, color: "bg-warning/10 text-warning" },
  esportes: { label: "Esportes", icon: Trophy, color: "bg-success/10 text-success" },
  seguranca: { label: "Segurança", icon: Shield, color: "bg-destructive/10 text-destructive" },
  avisos: { label: "Avisos", icon: Megaphone, color: "bg-info/10 text-info" },
  saude: { label: "Saúde", icon: Heart, color: "bg-pink-500/10 text-pink-500" },
};

const iconMap: Record<string, any> = {
  users: Users,
  "shopping-bag": ShoppingBag,
  trophy: Trophy,
  shield: Shield,
  megaphone: Megaphone,
  heart: Heart,
  "message-circle": MessageCircle,
};

export default function Comunidade() {
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const data = await api.getWhatsAppGroups();
      setGroups(data);
    } catch (error) {
      console.error("Error loading groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ["all", ...new Set(groups.map(g => g.category))];
  
  const filteredGroups = selectedCategory === "all" 
    ? groups 
    : groups.filter(g => g.category === selectedCategory);

  const groupedByCategory = filteredGroups.reduce((acc, group) => {
    if (!acc[group.category]) {
      acc[group.category] = [];
    }
    acc[group.category].push(group);
    return acc;
  }, {} as Record<string, WhatsAppGroup[]>);

  return (
    <Layout>
      {/* Hero */}
      <div className="bg-gradient-hero text-primary-foreground py-12">
        <div className="container">
          <div className="flex items-center gap-3 mb-4">
            <MessageCircle className="h-8 w-8" />
            <h1 className="font-heading text-3xl md:text-4xl font-bold">
              Comunidade WhatsApp
            </h1>
          </div>
          <p className="text-primary-foreground/90 max-w-2xl">
            Conecte-se com a comunidade de Vista Alegre do Abunã! 
            Participe dos grupos do WhatsApp e fique por dentro de tudo que acontece no distrito.
          </p>
        </div>
      </div>

      <div className="container py-8">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => {
            const config = categoryConfig[cat] || { label: cat, color: "bg-muted text-muted-foreground" };
            return (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === "all" ? "Todos" : config.label}
              </Button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum grupo disponível no momento</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedByCategory).map(([category, categoryGroups]) => {
              const config = categoryConfig[category] || { 
                label: category, 
                icon: MessageCircle, 
                color: "bg-muted text-muted-foreground" 
              };
              const CategoryIcon = config.icon;

              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={cn("p-2 rounded-lg", config.color)}>
                      <CategoryIcon className="h-5 w-5" />
                    </div>
                    <h2 className="font-heading text-xl font-semibold">
                      {config.label}
                    </h2>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryGroups.map((group, index) => {
                      const GroupIcon = iconMap[group.icon] || MessageCircle;

                      return (
                        <div
                          key={group.id}
                          className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-all animate-fade-up"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <div className="flex items-start gap-4">
                            <div className={cn("p-3 rounded-xl flex-shrink-0", config.color)}>
                              <GroupIcon className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold mb-1 line-clamp-1">
                                {group.name}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                {group.description}
                              </p>
                              {group.member_count && (
                                <p className="text-xs text-muted-foreground mb-3">
                                  <Users className="h-3 w-3 inline mr-1" />
                                  {group.member_count} membros
                                </p>
                              )}
                              <Button
                                size="sm"
                                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white"
                                onClick={() => window.open(group.invite_link, "_blank")}
                              >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Entrar no Grupo
                                <ExternalLink className="h-3 w-3 ml-2" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Rules Section */}
        <div className="mt-12 bg-card rounded-xl p-6 shadow-sm border border-border">
          <h3 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Regras da Comunidade
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">1.</span>
              Respeite todos os membros. Não são permitidas ofensas, discriminação ou bullying.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">2.</span>
              Evite spam e mensagens repetitivas. Compartilhe conteúdo relevante para a comunidade.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">3.</span>
              Não compartilhe fake news. Verifique as informações antes de divulgar.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">4.</span>
              Mantenha conversas nos grupos apropriados. Use o grupo correto para cada assunto.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">5.</span>
              Denuncie conteúdo impróprio aos administradores.
            </li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
