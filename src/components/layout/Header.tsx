import { Link, useLocation } from "react-router-dom";
import { Menu, X, Home, Newspaper, AlertTriangle, Store, Phone, Calendar, Package, LogIn, TreePine, MessageCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Início", href: "/", icon: Home },
  { label: "Notícias", href: "/noticias", icon: Newspaper },
  { label: "Ocorrências", href: "/ocorrencias", icon: AlertTriangle },
  { label: "Comércios", href: "/comercios", icon: Store },
  { label: "Quadras", href: "/quadras", icon: Calendar },
  { label: "Encomendas", href: "/encomendas", icon: Package },
  { label: "Comunidade", href: "/comunidade", icon: MessageCircle },
  { label: "Contatos", href: "/contatos-uteis", icon: Phone },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full glass">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 min-w-0 flex-shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground flex-shrink-0">
            <TreePine className="h-5 w-5" />
          </div>
          <div className="hidden sm:block min-w-0">
            <span className="font-heading font-semibold text-base text-foreground block leading-tight truncate">
              Vista Alegre
            </span>
            <span className="text-[10px] text-muted-foreground truncate block">
              Portal Comunitário
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href || 
              (item.href !== "/" && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/admin/login">
            <Button variant="outline" size="sm" className="hidden md:flex">
              <LogIn className="h-4 w-4 mr-2" />
              Admin
            </Button>
          </Link>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="lg:hidden border-t border-border bg-card animate-fade-in">
          <nav className="container py-4 flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href ||
                (item.href !== "/" && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
            <Link
              to="/admin/login"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted mt-2 border-t border-border pt-4"
            >
              <LogIn className="h-5 w-5" />
              Área Administrativa
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
