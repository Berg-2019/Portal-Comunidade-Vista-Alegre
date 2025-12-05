import { useState } from "react";
import { Phone, Search, MapPin, Clock, AlertCircle } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usefulContacts, contactCategories } from "@/data/mockData";

export default function ContatosUteis() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredContacts = usefulContacts.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesCategory = !selectedCategory || item.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group contacts by category
  const groupedContacts = filteredContacts.reduce((acc, contact) => {
    const categoryId = contact.categoryId;
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(contact);
    return acc;
  }, {} as Record<string, typeof usefulContacts>);

  return (
    <Layout>
      {/* Header */}
      <section className="bg-gradient-hero text-primary-foreground py-12">
        <div className="container">
          <div className="max-w-2xl">
            <h1 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              Contatos Úteis
            </h1>
            <p className="text-primary-foreground/85">
              Telefones importantes de saúde, segurança, educação e serviços públicos sempre à mão.
            </p>
          </div>
        </div>
      </section>

      <section className="container py-8">
        {/* Emergency Banner */}
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive mb-1">Emergência?</p>
              <p className="text-sm text-muted-foreground">
                <strong>SAMU:</strong> 192 | <strong>Bombeiros:</strong> 193 | <strong>Polícia:</strong> 190
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar contatos..."
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
            {contactCategories.map(category => (
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

        {/* Contacts by Category */}
        {filteredContacts.length === 0 ? (
          <div className="text-center py-12">
            <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum contato encontrado.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedContacts).map(([categoryId, contacts]) => {
              const category = contactCategories.find(c => c.id === categoryId);
              if (!category) return null;
              
              return (
                <div key={categoryId}>
                  <h2 className="font-heading text-xl font-semibold mb-4 flex items-center gap-2">
                    <span className="h-8 w-1 bg-primary rounded-full" />
                    {category.name}
                  </h2>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {contacts.map((contact, index) => (
                      <div
                        key={contact.id}
                        className="bg-card rounded-xl p-5 shadow-card animate-fade-up"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <h3 className="font-semibold text-lg mb-2">{contact.name}</h3>
                        
                        {contact.description && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {contact.description}
                          </p>
                        )}
                        
                        <div className="space-y-2 text-sm">
                          <a
                            href={`tel:${contact.phone.replace(/\D/g, '')}`}
                            className="flex items-center gap-2 text-primary font-medium hover:underline"
                          >
                            <Phone className="h-4 w-4" />
                            {contact.phone}
                          </a>
                          
                          {contact.address && (
                            <div className="flex items-start gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                              <span>{contact.address}</span>
                            </div>
                          )}
                          
                          {contact.openingHours && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4 flex-shrink-0" />
                              <span>{contact.openingHours}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
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
