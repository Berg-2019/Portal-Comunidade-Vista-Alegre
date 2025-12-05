import { useState, useEffect } from 'react';
import { Save, Sparkles, Snowflake, PartyPopper, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useSeasonalTheme, SeasonalTheme } from '@/contexts/SeasonalThemeContext';
import { cn } from '@/lib/utils';

const themeOptions: { value: SeasonalTheme; label: string; description: string; icon: string }[] = [
  { value: 'default', label: 'Padrão', description: 'Tema padrão do site com cores da comunidade', icon: '🌿' },
  { value: 'christmas', label: 'Natal', description: 'Vermelho, verde e dourado com clima natalino', icon: '🎄' },
  { value: 'new_year', label: 'Ano Novo', description: 'Fundo escuro com detalhes dourados e festivos', icon: '🎆' },
  { value: 'easter', label: 'Páscoa', description: 'Cores pastéis com detalhes delicados', icon: '🐰' },
  { value: 'carnaval', label: 'Carnaval', description: 'Cores vibrantes e clima de festa', icon: '🎭' },
];

export default function AdminSeasonalTheme() {
  const { toast } = useToast();
  const {
    theme,
    snowEnabled,
    fireworksEnabled,
    confettiEnabled,
    setTheme,
    setSnowEnabled,
    setFireworksEnabled,
    setConfettiEnabled,
    saveSettings,
    isLoading,
  } = useSeasonalTheme();

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveSettings();
      toast({ title: 'Tema sazonal salvo com sucesso!' });
    } catch (error) {
      toast({ 
        title: 'Erro ao salvar tema', 
        description: 'Tente novamente mais tarde.',
        variant: 'destructive' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Card 1: Tema atual do site */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
        <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          Tema Atual do Site
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Escolha um tema sazonal para aplicar em todo o site. As cores e elementos visuais serão ajustados automaticamente.
        </p>

        <RadioGroup
          value={theme}
          onValueChange={(value) => setTheme(value as SeasonalTheme)}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {themeOptions.map((option) => (
            <Label
              key={option.value}
              htmlFor={option.value}
              className={cn(
                'flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all',
                theme === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              )}
            >
              <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{option.icon}</span>
                  <span className="font-medium">{option.label}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
              </div>
            </Label>
          ))}
        </RadioGroup>
      </div>

      {/* Card 2: Elementos decorativos extras */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
        <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Elementos Decorativos Extras
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Ative efeitos animados especiais para cada tema. Os efeitos só aparecem quando o tema correspondente está ativo.
        </p>

        <div className="space-y-4">
          {/* Snow Effect */}
          <div className={cn(
            'flex items-center justify-between p-4 rounded-lg border transition-all',
            theme === 'christmas' ? 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20' : 'border-border bg-muted/30 opacity-60'
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2 rounded-lg',
                theme === 'christmas' ? 'bg-red-100 dark:bg-red-900/50' : 'bg-muted'
              )}>
                <Snowflake className={cn(
                  'h-5 w-5',
                  theme === 'christmas' ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
                )} />
              </div>
              <div>
                <Label htmlFor="snow-toggle" className="font-medium cursor-pointer">
                  Neve Animada
                </Label>
                <p className="text-xs text-muted-foreground">
                  Flocos de neve caindo suavemente (tema Natal)
                </p>
              </div>
            </div>
            <Switch
              id="snow-toggle"
              checked={snowEnabled}
              onCheckedChange={setSnowEnabled}
              disabled={theme !== 'christmas'}
            />
          </div>

          {/* Fireworks Effect */}
          <div className={cn(
            'flex items-center justify-between p-4 rounded-lg border transition-all',
            theme === 'new_year' ? 'border-yellow-200 bg-yellow-50/50 dark:border-yellow-900 dark:bg-yellow-950/20' : 'border-border bg-muted/30 opacity-60'
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2 rounded-lg',
                theme === 'new_year' ? 'bg-yellow-100 dark:bg-yellow-900/50' : 'bg-muted'
              )}>
                <Sparkles className={cn(
                  'h-5 w-5',
                  theme === 'new_year' ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground'
                )} />
              </div>
              <div>
                <Label htmlFor="fireworks-toggle" className="font-medium cursor-pointer">
                  Fogos de Artifício
                </Label>
                <p className="text-xs text-muted-foreground">
                  Explosões coloridas no céu (tema Ano Novo)
                </p>
              </div>
            </div>
            <Switch
              id="fireworks-toggle"
              checked={fireworksEnabled}
              onCheckedChange={setFireworksEnabled}
              disabled={theme !== 'new_year'}
            />
          </div>

          {/* Confetti Effect */}
          <div className={cn(
            'flex items-center justify-between p-4 rounded-lg border transition-all',
            theme === 'carnaval' ? 'border-pink-200 bg-pink-50/50 dark:border-pink-900 dark:bg-pink-950/20' : 'border-border bg-muted/30 opacity-60'
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2 rounded-lg',
                theme === 'carnaval' ? 'bg-pink-100 dark:bg-pink-900/50' : 'bg-muted'
              )}>
                <PartyPopper className={cn(
                  'h-5 w-5',
                  theme === 'carnaval' ? 'text-pink-600 dark:text-pink-400' : 'text-muted-foreground'
                )} />
              </div>
              <div>
                <Label htmlFor="confetti-toggle" className="font-medium cursor-pointer">
                  Confetes Coloridos
                </Label>
                <p className="text-xs text-muted-foreground">
                  Confetes caindo pela tela (tema Carnaval)
                </p>
              </div>
            </div>
            <Switch
              id="confetti-toggle"
              checked={confettiEnabled}
              onCheckedChange={setConfettiEnabled}
              disabled={theme !== 'carnaval'}
            />
          </div>
        </div>
      </div>

      {/* Preview info */}
      <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
        <strong>Prévia:</strong> As mudanças são aplicadas em tempo real no site. Salve para persistir as configurações.
      </div>

      {/* Save Button */}
      <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
        <Save className="h-4 w-4 mr-2" />
        {isSaving ? 'Salvando...' : 'Salvar Configurações de Tema'}
      </Button>
    </div>
  );
}
