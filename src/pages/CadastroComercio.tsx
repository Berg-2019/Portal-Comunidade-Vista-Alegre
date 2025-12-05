import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Store, Upload, MapPin, Phone, MessageCircle, Instagram, 
  Globe, Clock, CheckCircle, ArrowLeft
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { businessCategories } from "@/data/mockData";

interface BusinessFormData {
  name: string;
  description: string;
  categoryId: string;
  address: string;
  location: string;
  phone: string;
  whatsapp: string;
  instagramUrl: string;
  websiteUrl: string;
  openingHours: string;
  ownerName: string;
  ownerPhone: string;
}

export default function CadastroComercio() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState<BusinessFormData>({
    name: "",
    description: "",
    categoryId: "",
    address: "",
    location: "",
    phone: "",
    whatsapp: "",
    instagramUrl: "",
    websiteUrl: "",
    openingHours: "",
    ownerName: "",
    ownerPhone: "",
  });

  const handleInputChange = (field: keyof BusinessFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.categoryId || !formData.ownerName || !formData.ownerPhone) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('category_id', formData.categoryId);
      submitData.append('address', formData.address);
      submitData.append('location', formData.location);
      submitData.append('phone', formData.phone);
      submitData.append('whatsapp', formData.whatsapp);
      submitData.append('instagram_url', formData.instagramUrl);
      submitData.append('website_url', formData.websiteUrl);
      submitData.append('opening_hours', formData.openingHours);
      submitData.append('owner_name', formData.ownerName);
      submitData.append('owner_phone', formData.ownerPhone);

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/businesses/register`, {
        method: 'POST',
        body: submitData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao enviar cadastro');
      }

      setIsSubmitted(true);
      toast({
        title: "Cadastro enviado!",
        description: "Seu comércio foi enviado para aprovação. Entraremos em contato em breve.",
      });
    } catch (error) {
      toast({
        title: "Erro ao enviar",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Layout>
        <section className="container py-16">
          <div className="max-w-lg mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 mb-6">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold mb-4">
              Cadastro Enviado!
            </h1>
            <p className="text-muted-foreground mb-8">
              Obrigado por cadastrar seu comércio no portal Vista Alegre. 
              Nossa equipe irá analisar as informações e entraremos em contato 
              através do telefone informado em até 3 dias úteis.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => navigate("/comercios")}>
                <Store className="h-4 w-4 mr-2" />
                Ver Comércios
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                Voltar ao Início
              </Button>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <section className="bg-gradient-hero text-primary-foreground py-12">
        <div className="container">
          <Button 
            variant="ghost" 
            className="mb-4 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => navigate("/comercios")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Comércios
          </Button>
          <div className="max-w-2xl">
            <h1 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              Cadastre seu Comércio
            </h1>
            <p className="text-primary-foreground/85">
              Preencha o formulário abaixo para cadastrar seu negócio no portal. 
              Após a análise, seu comércio será exibido na lista de negócios locais.
            </p>
          </div>
        </div>
      </section>

      <section className="container py-8">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Business Info */}
            <div className="bg-card rounded-xl p-6 shadow-card">
              <h2 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" />
                Informações do Comércio
              </h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Comércio *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Ex: Mercadinho do João"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="categoryId">Categoria *</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => handleInputChange("categoryId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Descrição *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Descreva seu negócio, produtos ou serviços oferecidos..."
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="openingHours">Horário de Funcionamento</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="openingHours"
                      value={formData.openingHours}
                      onChange={(e) => handleInputChange("openingHours", e.target.value)}
                      placeholder="Ex: Seg-Sex 8h às 18h, Sáb 8h às 12h"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-card rounded-xl p-6 shadow-card">
              <h2 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Localização
              </h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="address">Endereço Completo</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Ex: Rua Principal, 123 - Centro"
                  />
                </div>

                <div>
                  <Label htmlFor="location">Ponto de Referência</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="Ex: Próximo à escola, em frente à praça..."
                  />
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-card rounded-xl p-6 shadow-card">
              <h2 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Contato e Redes Sociais
              </h2>
              
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="(69) 9999-9999"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <div className="relative">
                      <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="whatsapp"
                        value={formData.whatsapp}
                        onChange={(e) => handleInputChange("whatsapp", e.target.value)}
                        placeholder="5569999999999"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="instagramUrl">Instagram</Label>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="instagramUrl"
                      value={formData.instagramUrl}
                      onChange={(e) => handleInputChange("instagramUrl", e.target.value)}
                      placeholder="https://instagram.com/seucomercio"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="websiteUrl">Site ou Link</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="websiteUrl"
                      value={formData.websiteUrl}
                      onChange={(e) => handleInputChange("websiteUrl", e.target.value)}
                      placeholder="https://www.seusite.com.br"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Owner Contact */}
            <div className="bg-card rounded-xl p-6 shadow-card">
              <h2 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Dados do Responsável
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Essas informações são para contato interno e não serão exibidas publicamente.
              </p>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="ownerName">Nome do Responsável *</Label>
                  <Input
                    id="ownerName"
                    value={formData.ownerName}
                    onChange={(e) => handleInputChange("ownerName", e.target.value)}
                    placeholder="Seu nome completo"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="ownerPhone">Telefone para Contato *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="ownerPhone"
                      value={formData.ownerPhone}
                      onChange={(e) => handleInputChange("ownerPhone", e.target.value)}
                      placeholder="(69) 9999-9999"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                type="submit" 
                size="lg" 
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>Enviando...</>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Enviar para Aprovação
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="lg"
                onClick={() => navigate("/comercios")}
              >
                Cancelar
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              * Campos obrigatórios. Após o envio, sua solicitação será analisada 
              pela equipe do portal e você receberá um retorno em até 3 dias úteis.
            </p>
          </form>
        </div>
      </section>
    </Layout>
  );
}
