import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Store, Search, MapPin, Phone, Clock, MessageCircle, Plus, Loader2,
  ShoppingCart, UtensilsCrossed, Wrench, Pill, Scissors, Briefcase
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/services/api";

interface Business {
  id: number;
  name: string;
  description: string;
  category_id: number;
  category_name?: string;
  category_icon?: string;
  address: string;
  phone: string;
  whatsapp: string;
  opening_hours?: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
}

const iconMap: Record<string, React.ElementType> = {
  'shopping-bag': ShoppingCart,
  'utensils': UtensilsCrossed,
  'wrench': Wrench,
  'heart': Pill,
  'scissors': Scissors,
  'book': Store,
  'car': Store,
  'more-horizontal': Briefcase,
};

export default function Comercios() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [businessesData, categoriesData] = await Promise.all([
          api.getBusinesses(),
          api.getBusinessCategories(),
        ]);
        setBusinesses(businessesData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredBusinesses = businesses.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || item.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Layout>
      {/* Header */}
      <section className="bg-gradient-hero text-primary-foreground py-12">
        <div className="container">
          <div className="max-w-2xl">
            <h1 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              Comércios Locais
            </h1>
            <p className="text-primary-foreground/85 mb-6">
              Conheça e apoie os negócios da nossa comunidade. 
              Aqui você encontra mercados, oficinas, restaurantes e muito mais.
            </p>
            <Link to="/cadastro-comercio">
              <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                <Plus className="h-5 w-5 mr-2" />
                Cadastrar meu Negócio
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="container py-8">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar comércios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              Todos
            </Button>
            {categories.map(category => {
              const Icon = iconMap[category.icon] || Store;
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
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredBusinesses.length === 0 ? (
          <div className="text-center py-12">
            <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum comércio encontrado.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredBusinesses.map((business, index) => {
              const category = categories.find(c => c.id === business.category_id);
              const Icon = category ? (iconMap[category.icon] || Store) : Store;
              
              return (
                <div
                  key={business.id}
                  className="bg-card rounded-xl p-6 shadow-card animate-fade-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon className="h-7 w-7 text-primary" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-heading font-semibold text-lg">{business.name}</h3>
                        {category && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {category.name}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-muted-foreground mb-4">{business.description}</p>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span>{business.address}</span>
                        </div>
                        
                        {business.opening_hours && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4 flex-shrink-0" />
                            <span>{business.opening_hours}</span>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-3 pt-2">
                          {business.phone && (
                            <a
                              href={`tel:${business.phone}`}
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                              <Phone className="h-4 w-4" />
                              {business.phone}
                            </a>
                          )}
                          
                          {business.whatsapp && (
                            <a
                              href={`https://wa.me/${business.whatsapp}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-green-600 hover:underline"
                            >
                              <MessageCircle className="h-4 w-4" />
                              WhatsApp
                            </a>
                          )}
                        </div>
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
