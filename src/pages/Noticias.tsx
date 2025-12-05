import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Newspaper, Search, Calendar, ArrowRight, Loader2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/services/api";

interface News {
  id: number;
  title: string;
  slug: string;
  summary: string;
  category_id: number;
  category_name?: string;
  image_url?: string;
  created_at: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function Noticias() {
  const [news, setNews] = useState<News[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [newsData, categoriesData] = await Promise.all([
          api.getNews(true), // published only
          api.getCategories(),
        ]);
        setNews(newsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredNews = news.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.summary?.toLowerCase().includes(searchTerm.toLowerCase());
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
              Notícias e Comunicados
            </h1>
            <p className="text-primary-foreground/85">
              Fique por dentro de tudo que acontece na comunidade Vista Alegre do Abunã.
            </p>
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
              placeholder="Buscar notícias..."
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
              Todas
            </Button>
            {categories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="text-center py-12">
            <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma notícia encontrada.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNews.map((item, index) => {
              const category = categories.find(c => c.id === item.category_id);
              return (
                <Link
                  key={item.id}
                  to={`/noticias/${item.slug}`}
                  className="group bg-card rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 animate-fade-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="h-40 bg-gradient-primary flex items-center justify-center overflow-hidden">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <Newspaper className="h-12 w-12 text-primary-foreground/50" />
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      {category && (
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                          {category.name}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <h3 className="font-heading font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {item.summary}
                    </p>
                    <span className="inline-flex items-center text-sm font-medium text-primary">
                      Ler mais <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </Layout>
  );
}
