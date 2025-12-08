import { Link } from "react-router-dom";
import { Calendar, Package, MessageCircle, Loader2 } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";

export function Footer() {
  const { settings, loading, getWhatsAppLink } = useSettings();

  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-heading font-bold text-lg">
                VA
              </div>
              <span className="font-heading font-semibold text-lg">
                Vista Alegre
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Portal comunitário do Vista Alegre do Abunã - Conectando e fortalecendo nossa comunidade.
            </p>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4">Serviços</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/quadras" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Agenda de Quadras
                </Link>
              </li>
              <li>
                <Link to="/encomendas" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Consulta de Encomendas
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4">Contato</h4>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando...
              </div>
            ) : (
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp da Comunidade
              </a>
            )}
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Portal Vista Alegre. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
