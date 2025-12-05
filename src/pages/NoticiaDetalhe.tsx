import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Tag } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { news, newsCategories } from "@/data/mockData";

export default function NoticiaDetalhe() {
  const { slug } = useParams();
  const noticia = news.find(n => n.slug === slug && n.published);
  const category = noticia ? newsCategories.find(c => c.id === noticia.categoryId) : null;

  if (!noticia) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="font-heading text-2xl font-bold mb-4">Notícia não encontrada</h1>
          <p className="text-muted-foreground mb-6">
            A notícia que você procura não existe ou foi removida.
          </p>
          <Link to="/noticias">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Notícias
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <article className="container py-8 max-w-3xl">
        <Link to="/noticias" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar para Notícias
        </Link>

        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            {category && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">
                <Tag className="h-3 w-3" />
                {category.name}
              </span>
            )}
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(noticia.createdAt).toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            {noticia.title}
          </h1>
          <p className="text-lg text-muted-foreground">
            {noticia.summary}
          </p>
        </header>

        <div className="prose prose-lg max-w-none">
          {noticia.content.split('\n\n').map((paragraph, index) => {
            if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
              return (
                <h3 key={index} className="font-heading font-semibold text-xl mt-6 mb-3">
                  {paragraph.replace(/\*\*/g, '')}
                </h3>
              );
            }
            if (paragraph.startsWith('- ')) {
              const items = paragraph.split('\n').filter(line => line.startsWith('- '));
              return (
                <ul key={index} className="list-disc list-inside space-y-1 my-4">
                  {items.map((item, i) => (
                    <li key={i} className="text-muted-foreground">
                      {item.replace('- ', '')}
                    </li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={index} className="text-muted-foreground mb-4">
                {paragraph}
              </p>
            );
          })}
        </div>

        <footer className="mt-12 pt-8 border-t border-border">
          <Link to="/noticias">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Ver todas as notícias
            </Button>
          </Link>
        </footer>
      </article>
    </Layout>
  );
}
