import { Calendar, Package, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-heading font-bold text-lg">
                GC
              </div>
              <span className="font-heading font-semibold text-lg">
                Gestão Comunitária
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Plataforma integrada para gerenciamento de quadras esportivas e encomendas da comunidade.
            </p>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4">Serviços</h4>
            <ul className="space-y-2">
              <li>
                <a href="/quadras" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Agenda de Quadras
                </a>
              </li>
              <li>
                <a href="/encomendas" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Consulta de Encomendas
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4">Contato</h4>
            <a
              href="https://wa.me/5500000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp da Comunidade
            </a>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Gestão Comunitária. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
