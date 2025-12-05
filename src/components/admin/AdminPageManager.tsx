import { useState } from "react";
import {
  Image,
  Upload,
  Trash2,
  Save,
  Palette,
  Type,
  Layout,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  heroTitle: string;
  heroSubtitle: string;
  coverImageUrl: string;
  logoUrl: string;
  primaryColor: string;
  whatsappNumber: string;
  footerText: string;
}

interface CourtImage {
  id: string;
  courtId: string;
  courtName: string;
  imageUrl: string;
}

const initialSettings: SiteSettings = {
  siteName: "Vista Alegre do Abunã",
  siteDescription: "Portal da comunidade de Vista Alegre do Abunã - Porto Velho, RO",
  heroTitle: "Bem-vindo ao Vista Alegre",
  heroSubtitle: "O portal da nossa comunidade",
  coverImageUrl: "",
  logoUrl: "",
  primaryColor: "#166534",
  whatsappNumber: "5569999999999",
  footerText: "© 2024 Vista Alegre do Abunã. Todos os direitos reservados.",
};

const initialCourtImages: CourtImage[] = [
  { id: "1", courtId: "1", courtName: "Quadra Poliesportiva Central", imageUrl: "" },
  { id: "2", courtId: "2", courtName: "Quadra de Vôlei", imageUrl: "" },
];

export default function AdminPageManager() {
  const [settings, setSettings] = useState<SiteSettings>(initialSettings);
  const [courtImages, setCourtImages] = useState<CourtImage[]>(initialCourtImages);
  const [activeTab, setActiveTab] = useState<"geral" | "visual" | "quadras">("geral");
  const { toast } = useToast();

  const handleSettingChange = (key: keyof SiteSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = () => {
    // Em produção, salvaria no banco de dados
    console.log("Salvando configurações:", settings);
    toast({ title: "Configurações salvas com sucesso!" });
  };

  const handleImageUpload = (type: "cover" | "logo" | "court", courtId?: string) => {
    // Em produção, abriria um file picker e faria upload
    toast({
      title: "Upload de Imagem",
      description: "Funcionalidade de upload será conectada ao backend PostgreSQL.",
    });
  };

  const handleCourtImageUpload = (courtId: string) => {
    handleImageUpload("court", courtId);
  };

  const tabs = [
    { id: "geral" as const, label: "Geral", icon: Layout },
    { id: "visual" as const, label: "Visual", icon: Palette },
    { id: "quadras" as const, label: "Fotos Quadras", icon: Image },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Geral Tab */}
      {activeTab === "geral" && (
        <div className="space-y-6">
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
              <Type className="h-5 w-5" />
              Informações do Site
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Nome do Site</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => handleSettingChange("siteName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber">WhatsApp (com DDD)</Label>
                  <Input
                    id="whatsappNumber"
                    value={settings.whatsappNumber}
                    onChange={(e) => handleSettingChange("whatsappNumber", e.target.value)}
                    placeholder="5569999999999"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">Descrição do Site (SEO)</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) => handleSettingChange("siteDescription", e.target.value)}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="heroTitle">Título do Hero</Label>
                  <Input
                    id="heroTitle"
                    value={settings.heroTitle}
                    onChange={(e) => handleSettingChange("heroTitle", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heroSubtitle">Subtítulo do Hero</Label>
                  <Input
                    id="heroSubtitle"
                    value={settings.heroSubtitle}
                    onChange={(e) => handleSettingChange("heroSubtitle", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="footerText">Texto do Rodapé</Label>
                <Input
                  id="footerText"
                  value={settings.footerText}
                  onChange={(e) => handleSettingChange("footerText", e.target.value)}
                />
              </div>
            </div>
          </div>

          <Button onClick={handleSaveSettings} className="w-full sm:w-auto">
            <Save className="h-4 w-4 mr-2" />
            Salvar Configurações
          </Button>
        </div>
      )}

      {/* Visual Tab */}
      {activeTab === "visual" && (
        <div className="space-y-6">
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
              <Image className="h-5 w-5" />
              Imagens do Site
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cover Image */}
              <div className="space-y-3">
                <Label>Imagem de Capa (Hero)</Label>
                <div className="aspect-video bg-muted rounded-lg border-2 border-dashed border-border flex items-center justify-center relative overflow-hidden">
                  {settings.coverImageUrl ? (
                    <>
                      <img
                        src={settings.coverImageUrl}
                        alt="Capa"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => handleSettingChange("coverImageUrl", "")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <Image className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Recomendado: 1920x600px
                      </p>
                      <Button size="sm" onClick={() => handleImageUpload("cover")}>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Logo */}
              <div className="space-y-3">
                <Label>Logo do Site</Label>
                <div className="aspect-square max-w-[200px] bg-muted rounded-lg border-2 border-dashed border-border flex items-center justify-center relative overflow-hidden">
                  {settings.logoUrl ? (
                    <>
                      <img
                        src={settings.logoUrl}
                        alt="Logo"
                        className="w-full h-full object-contain p-4"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => handleSettingChange("logoUrl", "")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground mb-2">
                        200x200px
                      </p>
                      <Button size="sm" onClick={() => handleImageUpload("logo")}>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Cores do Site
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Cor Principal</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="primaryColor"
                    value={settings.primaryColor}
                    onChange={(e) => handleSettingChange("primaryColor", e.target.value)}
                    className="w-12 h-10 rounded border border-border cursor-pointer"
                  />
                  <Input
                    value={settings.primaryColor}
                    onChange={(e) => handleSettingChange("primaryColor", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mt-4">
              As cores são aplicadas automaticamente ao tema do site. Para mudanças avançadas, 
              edite o arquivo <code className="bg-muted px-1 rounded">src/index.css</code>.
            </p>
          </div>

          <Button onClick={handleSaveSettings} className="w-full sm:w-auto">
            <Save className="h-4 w-4 mr-2" />
            Salvar Configurações Visuais
          </Button>
        </div>
      )}

      {/* Quadras Tab */}
      {activeTab === "quadras" && (
        <div className="space-y-6">
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
              <Image className="h-5 w-5" />
              Fotos das Quadras
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courtImages.map((court) => (
                <div key={court.id} className="space-y-3">
                  <Label>{court.courtName}</Label>
                  <div className="aspect-video bg-muted rounded-lg border-2 border-dashed border-border flex items-center justify-center relative overflow-hidden">
                    {court.imageUrl ? (
                      <>
                        <img
                          src={court.imageUrl}
                          alt={court.courtName}
                          className="w-full h-full object-cover"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setCourtImages((prev) =>
                              prev.map((c) =>
                                c.id === court.id ? { ...c, imageUrl: "" } : c
                              )
                            );
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <Image className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Recomendado: 800x450px
                        </p>
                        <Button
                          size="sm"
                          onClick={() => handleCourtImageUpload(court.courtId)}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleSaveSettings} className="w-full sm:w-auto">
            <Save className="h-4 w-4 mr-2" />
            Salvar Fotos
          </Button>
        </div>
      )}
    </div>
  );
}
