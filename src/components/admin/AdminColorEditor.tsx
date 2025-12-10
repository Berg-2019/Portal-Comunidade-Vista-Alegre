import { useState, useEffect } from 'react';
import { Palette, RotateCcw, Save, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';

interface ColorConfig {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  success: string;
  warning: string;
  destructive: string;
  card: string;
  border: string;
}

const defaultColors: ColorConfig = {
  primary: '#2d5a3d',
  secondary: '#f5f5f5',
  accent: '#2d8a9c',
  background: '#ffffff',
  foreground: '#1f1f23',
  muted: '#f5f5f5',
  success: '#22805d',
  warning: '#f59e0b',
  destructive: '#9a7052',
  card: '#ffffff',
  border: '#e5e5e5',
};

const colorLabels: Record<keyof ColorConfig, string> = {
  primary: 'Cor Primária',
  secondary: 'Cor Secundária',
  accent: 'Cor de Destaque',
  background: 'Fundo',
  foreground: 'Texto Principal',
  muted: 'Elementos Suaves',
  success: 'Sucesso',
  warning: 'Aviso',
  destructive: 'Erro/Perigo',
  card: 'Cards',
  border: 'Bordas',
};

function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0 0% 0%';

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function hslToHex(hsl: string): string {
  const parts = hsl.split(' ');
  if (parts.length !== 3) return '#000000';
  
  const h = parseFloat(parts[0]) / 360;
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function AdminColorEditor() {
  const [colors, setColors] = useState<ColorConfig>(defaultColors);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadColors();
  }, []);

  const loadColors = async () => {
    try {
      const settings = await api.getSettings();
      if (settings.custom_colors) {
        const savedColors = JSON.parse(settings.custom_colors);
        setColors({ ...defaultColors, ...savedColors });
      }
    } catch (error) {
      console.error('Erro ao carregar cores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleColorChange = (key: keyof ColorConfig, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    
    // Apply color in real-time
    applyColorToCSS(key, value);
  };

  const applyColorToCSS = (key: keyof ColorConfig, hexValue: string) => {
    const hslValue = hexToHsl(hexValue);
    const root = document.documentElement;
    
    const cssVarMap: Record<string, string> = {
      primary: '--primary',
      secondary: '--secondary',
      accent: '--accent',
      background: '--background',
      foreground: '--foreground',
      muted: '--muted',
      success: '--success',
      warning: '--warning',
      destructive: '--destructive',
      card: '--card',
      border: '--border',
    };

    const cssVar = cssVarMap[key];
    if (cssVar) {
      root.style.setProperty(cssVar, hslValue);
    }
  };

  const applyAllColors = () => {
    Object.entries(colors).forEach(([key, value]) => {
      applyColorToCSS(key as keyof ColorConfig, value);
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateSettings({
        custom_colors: JSON.stringify(colors),
      });
      
      toast({
        title: 'Cores salvas',
        description: 'As cores do site foram atualizadas com sucesso.',
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Erro ao salvar cores:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as cores.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setColors(defaultColors);
    setHasChanges(true);
    
    // Apply default colors
    Object.entries(defaultColors).forEach(([key, value]) => {
      applyColorToCSS(key as keyof ColorConfig, value);
    });
    
    toast({
      title: 'Cores restauradas',
      description: 'As cores foram restauradas para o padrão. Salve para confirmar.',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const ColorInput = ({ colorKey }: { colorKey: keyof ColorConfig }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{colorLabels[colorKey]}</Label>
      <div className="flex gap-2">
        <div
          className="w-10 h-10 rounded-lg border-2 border-border cursor-pointer overflow-hidden"
          style={{ backgroundColor: colors[colorKey] }}
        >
          <input
            type="color"
            value={colors[colorKey]}
            onChange={(e) => handleColorChange(colorKey, e.target.value)}
            className="w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <Input
          value={colors[colorKey]}
          onChange={(e) => handleColorChange(colorKey, e.target.value)}
          className="font-mono text-sm flex-1"
          placeholder="#000000"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Palette className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-semibold">Editor de Cores</h2>
            <p className="text-sm text-muted-foreground">Personalize as cores do site</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar Padrão
          </Button>
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Cores
          </Button>
        </div>
      </div>

      <Tabs defaultValue="main" className="space-y-6">
        <TabsList>
          <TabsTrigger value="main">Cores Principais</TabsTrigger>
          <TabsTrigger value="ui">Interface</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="main">
          <Card>
            <CardHeader>
              <CardTitle>Cores Principais</CardTitle>
              <CardDescription>
                Defina as cores principais que serão usadas em todo o site
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ColorInput colorKey="primary" />
                <ColorInput colorKey="secondary" />
                <ColorInput colorKey="accent" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ui">
          <Card>
            <CardHeader>
              <CardTitle>Cores da Interface</CardTitle>
              <CardDescription>
                Personalize as cores de fundo, texto e elementos da interface
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ColorInput colorKey="background" />
                <ColorInput colorKey="foreground" />
                <ColorInput colorKey="card" />
                <ColorInput colorKey="muted" />
                <ColorInput colorKey="border" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Cores de Status</CardTitle>
              <CardDescription>
                Cores usadas para indicar sucesso, avisos e erros
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ColorInput colorKey="success" />
                <ColorInput colorKey="warning" />
                <ColorInput colorKey="destructive" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Preview
              </CardTitle>
              <CardDescription>
                Veja como as cores aparecem em diferentes elementos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Buttons Preview */}
              <div className="space-y-2">
                <Label>Botões</Label>
                <div className="flex flex-wrap gap-3">
                  <Button>Primário</Button>
                  <Button variant="secondary">Secundário</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="destructive">Destrutivo</Button>
                </div>
              </div>

              {/* Cards Preview */}
              <div className="space-y-2">
                <Label>Cards</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-card border border-border">
                    <h4 className="font-semibold">Card Normal</h4>
                    <p className="text-sm text-muted-foreground">Texto secundário</p>
                  </div>
                  <div className="p-4 rounded-lg bg-primary text-primary-foreground">
                    <h4 className="font-semibold">Card Primário</h4>
                    <p className="text-sm opacity-80">Texto no primário</p>
                  </div>
                  <div className="p-4 rounded-lg bg-accent text-accent-foreground">
                    <h4 className="font-semibold">Card Destaque</h4>
                    <p className="text-sm opacity-80">Texto no destaque</p>
                  </div>
                </div>
              </div>

              {/* Status Preview */}
              <div className="space-y-2">
                <Label>Indicadores de Status</Label>
                <div className="flex flex-wrap gap-3">
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-success/10 text-success">
                    Sucesso
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-warning/10 text-warning">
                    Aviso
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-destructive/10 text-destructive">
                    Erro
                  </span>
                </div>
              </div>

              {/* Text Preview */}
              <div className="space-y-2">
                <Label>Tipografia</Label>
                <div className="p-4 rounded-lg bg-muted">
                  <h3 className="text-lg font-semibold">Título Principal</h3>
                  <p className="text-muted-foreground">
                    Este é um texto secundário para mostrar o contraste com o fundo.
                  </p>
                  <a href="#" className="text-primary hover:underline">
                    Link de exemplo
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Color Palette Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Paleta Atual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(colors).map(([key, value]) => (
              <div
                key={key}
                className="flex flex-col items-center gap-1"
                title={colorLabels[key as keyof ColorConfig]}
              >
                <div
                  className="w-12 h-12 rounded-lg border-2 border-border shadow-sm"
                  style={{ backgroundColor: value }}
                />
                <span className="text-xs text-muted-foreground capitalize">
                  {key.slice(0, 3)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}