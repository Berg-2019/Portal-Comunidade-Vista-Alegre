import { useState } from 'react';
import { Save, Sparkles, Snowflake, PartyPopper, Palette, Calendar, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useSeasonalTheme, SeasonalTheme, ThemeSchedule } from '@/contexts/SeasonalThemeContext';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Color palettes for each theme (for preview)
const themeColors: Record<SeasonalTheme, { primary: string; secondary: string; accent: string; bg: string }> = {
  default: {
    primary: 'hsl(152, 45%, 35%)',
    secondary: 'hsl(200, 60%, 40%)',
    accent: 'hsl(45, 80%, 50%)',
    bg: 'hsl(145, 25%, 96%)',
  },
  christmas: {
    primary: 'hsl(0, 70%, 45%)',
    secondary: 'hsl(140, 50%, 35%)',
    accent: 'hsl(45, 90%, 55%)',
    bg: 'hsl(0, 30%, 97%)',
  },
  new_year: {
    primary: 'hsl(45, 90%, 55%)',
    secondary: 'hsl(280, 50%, 50%)',
    accent: 'hsl(200, 80%, 60%)',
    bg: 'hsl(240, 15%, 15%)',
  },
  easter: {
    primary: 'hsl(280, 50%, 65%)',
    secondary: 'hsl(330, 50%, 70%)',
    accent: 'hsl(50, 80%, 70%)',
    bg: 'hsl(280, 30%, 97%)',
  },
  carnaval: {
    primary: 'hsl(280, 80%, 55%)',
    secondary: 'hsl(45, 100%, 55%)',
    accent: 'hsl(160, 80%, 45%)',
    bg: 'hsl(280, 30%, 97%)',
  },
  sao_joao: {
    primary: 'hsl(35, 85%, 45%)',      // Laranja quente
    secondary: 'hsl(15, 75%, 50%)',    // Vermelho alaranjado
    accent: 'hsl(50, 90%, 55%)',       // Amarelo milho
    bg: 'hsl(30, 40%, 96%)',
  },
  independencia: {
    primary: 'hsl(140, 60%, 40%)',     // Verde Brasil
    secondary: 'hsl(50, 90%, 50%)',    // Amarelo Brasil
    accent: 'hsl(220, 70%, 45%)',      // Azul Brasil
    bg: 'hsl(140, 20%, 97%)',
  },
  tiradentes: {
    primary: 'hsl(35, 50%, 45%)',      // Marrom histórico
    secondary: 'hsl(45, 70%, 50%)',    // Dourado
    accent: 'hsl(0, 60%, 45%)',        // Vermelho
    bg: 'hsl(35, 25%, 95%)',
  },
  republica: {
    primary: 'hsl(140, 50%, 35%)',     // Verde escuro
    secondary: 'hsl(220, 60%, 40%)',   // Azul
    accent: 'hsl(50, 85%, 50%)',       // Amarelo
    bg: 'hsl(210, 20%, 97%)',
  },
  rondonia: {
    primary: 'hsl(140, 55%, 35%)',     // Verde amazônico
    secondary: 'hsl(45, 80%, 50%)',    // Amarelo
    accent: 'hsl(200, 65%, 45%)',      // Azul rio
    bg: 'hsl(145, 30%, 96%)',
  },
};

const themeOptions: { value: SeasonalTheme; label: string; description: string; icon: string }[] = [
  { value: 'default', label: 'Padrão (Amazônico)', description: 'Tons de verde, azul e terra inspirados na região', icon: '🌿' },
  { value: 'christmas', label: 'Natal', description: 'Vermelho, verde e dourado festivo', icon: '🎄' },
  { value: 'new_year', label: 'Ano Novo', description: 'Fundo escuro com detalhes dourados', icon: '🎆' },
  { value: 'easter', label: 'Páscoa', description: 'Cores pastéis suaves e delicadas', icon: '🐰' },
  { value: 'carnaval', label: 'Carnaval', description: 'Cores vibrantes e alegres', icon: '🎭' },
  { value: 'sao_joao', label: 'São João', description: 'Cores quentes de festa junina', icon: '🔥' },
  { value: 'independencia', label: 'Independência', description: '7 de Setembro - Verde e amarelo', icon: '🇧🇷' },
  { value: 'tiradentes', label: 'Tiradentes', description: '21 de Abril - Tons históricos', icon: '⚔️' },
  { value: 'republica', label: 'República', description: '15 de Novembro - Cores nacionais', icon: '🏛️' },
  { value: 'rondonia', label: 'Rondônia', description: '4 de Janeiro - Aniversário do estado', icon: '🌴' },
];

const scheduleThemes = themeOptions.filter((t) => t.value !== 'default');

// Color preview component
function ColorPreview({ colors, isDark = false }: { colors: typeof themeColors.default; isDark?: boolean }) {
  return (
    <div className="flex gap-1.5 mt-2">
      <div
        className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
        style={{ backgroundColor: colors.primary }}
        title="Cor primária"
      />
      <div
        className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
        style={{ backgroundColor: colors.secondary }}
        title="Cor secundária"
      />
      <div
        className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
        style={{ backgroundColor: colors.accent }}
        title="Cor de destaque"
      />
      <div
        className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
        style={{ backgroundColor: colors.bg }}
        title="Cor de fundo"
      />
    </div>
  );
}

// Mini theme preview card
function ThemePreviewCard({ themeKey, isActive }: { themeKey: SeasonalTheme; isActive: boolean }) {
  const colors = themeColors[themeKey];
  const isDark = themeKey === 'new_year';

  return (
    <div
      className={cn(
        'relative w-full h-16 rounded-lg overflow-hidden border-2 transition-all',
        isActive ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'
      )}
      style={{ backgroundColor: colors.bg }}
    >
      {/* Header bar */}
      <div
        className="h-4 w-full"
        style={{ backgroundColor: colors.primary }}
      />
      {/* Content preview */}
      <div className="p-2 flex gap-2">
        <div
          className="w-8 h-6 rounded"
          style={{ backgroundColor: colors.secondary, opacity: 0.8 }}
        />
        <div className="flex-1 space-y-1">
          <div
            className="h-2 rounded w-3/4"
            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)' }}
          />
          <div
            className="h-2 rounded w-1/2"
            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)' }}
          />
        </div>
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: colors.accent }}
        />
      </div>
    </div>
  );
}

// Convert MM-DD to readable date format
function formatScheduleDate(dateStr: string): string {
  const [month, day] = dateStr.split('-').map(Number);
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${day} ${months[month - 1]}`;
}

// Check if a theme is currently active based on schedule
function isScheduleActive(schedule: ThemeSchedule): boolean {
  if (!schedule.enabled) return false;

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();
  const current = currentMonth * 100 + currentDay;

  const [startMonth, startDay] = schedule.startDate.split('-').map(Number);
  const [endMonth, endDay] = schedule.endDate.split('-').map(Number);
  const start = startMonth * 100 + startDay;
  const end = endMonth * 100 + endDay;

  if (start > end) {
    return current >= start || current <= end;
  }

  return current >= start && current <= end;
}

export default function AdminSeasonalTheme() {
  const { toast } = useToast();
  const {
    theme,
    activeTheme,
    snowEnabled,
    fireworksEnabled,
    confettiEnabled,
    autoScheduleEnabled,
    schedules,
    setTheme,
    setSnowEnabled,
    setFireworksEnabled,
    setConfettiEnabled,
    setAutoScheduleEnabled,
    updateSchedule,
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
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getScheduleForTheme = (themeKey: SeasonalTheme): ThemeSchedule | undefined => {
    return schedules.find((s) => s.theme === themeKey);
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
      {/* Active Theme Indicator */}
      {autoScheduleEnabled && activeTheme !== 'default' && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium text-sm">
              Tema ativo por agendamento:{' '}
              <span className="text-primary">
                {themeOptions.find((t) => t.value === activeTheme)?.icon}{' '}
                {themeOptions.find((t) => t.value === activeTheme)?.label}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              O agendamento automático está ativado e aplicando o tema baseado na data atual.
            </p>
          </div>
        </div>
      )}

      {/* Card 1: Preview visual dos temas */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
        <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          Paleta de Cores dos Temas
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Visualize as cores de cada tema disponível. O tema ativo está destacado.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {themeOptions.map((option) => (
            <div
              key={option.value}
              className={cn(
                'p-3 rounded-lg border-2 transition-all',
                activeTheme === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/30'
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{option.icon}</span>
                <span className="text-sm font-medium">{option.label}</span>
                {activeTheme === option.value && (
                  <Badge variant="default" className="text-[10px] px-1.5 py-0">
                    Ativo
                  </Badge>
                )}
              </div>
              <ThemePreviewCard themeKey={option.value} isActive={activeTheme === option.value} />
              <ColorPreview colors={themeColors[option.value]} />
            </div>
          ))}
        </div>
      </div>

      {/* Card 2: Tema manual do site */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
        <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          Tema Manual do Site
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {autoScheduleEnabled
            ? 'O tema manual será usado quando nenhum agendamento estiver ativo.'
            : 'Escolha um tema sazonal para aplicar em todo o site.'}
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
                <ColorPreview colors={themeColors[option.value]} />
              </div>
            </Label>
          ))}
        </RadioGroup>
      </div>

      {/* Card 3: Agendamento Automático */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Agendamento Automático
          </h3>
          <div className="flex items-center gap-2">
            <Label htmlFor="auto-schedule" className="text-sm text-muted-foreground">
              Ativar
            </Label>
            <Switch
              id="auto-schedule"
              checked={autoScheduleEnabled}
              onCheckedChange={setAutoScheduleEnabled}
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Configure datas para ativação automática de cada tema sazonal. O sistema aplicará o tema
          automaticamente quando a data atual estiver dentro do período configurado.
        </p>

        <div className="space-y-4">
          {scheduleThemes.map((themeOpt) => {
            const schedule = getScheduleForTheme(themeOpt.value);
            if (!schedule) return null;

            const isActive = isScheduleActive(schedule);
            const colors = themeColors[themeOpt.value];

            return (
              <div
                key={themeOpt.value}
                className={cn(
                  'p-4 rounded-lg border transition-all',
                  schedule.enabled
                    ? isActive
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                    : 'border-border bg-muted/30 opacity-60'
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Theme info and toggle */}
                  <div className="flex items-center gap-3 min-w-[180px]">
                    <Switch
                      id={`schedule-${themeOpt.value}`}
                      checked={schedule.enabled}
                      onCheckedChange={(enabled) => updateSchedule(themeOpt.value, { enabled })}
                      disabled={!autoScheduleEnabled}
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{themeOpt.icon}</span>
                      <span className="font-medium">{themeOpt.label}</span>
                    </div>
                    {isActive && schedule.enabled && autoScheduleEnabled && (
                      <Badge variant="default" className="text-xs">
                        Ativo
                      </Badge>
                    )}
                  </div>

                  {/* Color preview mini */}
                  <div className="flex gap-1">
                    <div
                      className="w-4 h-4 rounded-full border border-white shadow-sm"
                      style={{ backgroundColor: colors.primary }}
                    />
                    <div
                      className="w-4 h-4 rounded-full border border-white shadow-sm"
                      style={{ backgroundColor: colors.secondary }}
                    />
                    <div
                      className="w-4 h-4 rounded-full border border-white shadow-sm"
                      style={{ backgroundColor: colors.accent }}
                    />
                  </div>

                  {/* Date inputs */}
                  <div className="flex flex-1 items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground whitespace-nowrap">De:</Label>
                      <Input
                        type="text"
                        placeholder="MM-DD"
                        value={schedule.startDate}
                        onChange={(e) => updateSchedule(themeOpt.value, { startDate: e.target.value })}
                        className="w-24 h-8 text-sm"
                        disabled={!autoScheduleEnabled || !schedule.enabled}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground whitespace-nowrap">Até:</Label>
                      <Input
                        type="text"
                        placeholder="MM-DD"
                        value={schedule.endDate}
                        onChange={(e) => updateSchedule(themeOpt.value, { endDate: e.target.value })}
                        className="w-24 h-8 text-sm"
                        disabled={!autoScheduleEnabled || !schedule.enabled}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      ({formatScheduleDate(schedule.startDate)} - {formatScheduleDate(schedule.endDate)})
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            <strong>Formato de data:</strong> Use MM-DD (mês-dia). Ex: 12-25 para 25 de Dezembro.
            O sistema suporta períodos que cruzam o ano (ex: 12-27 até 01-02 para Ano Novo).
          </p>
        </div>
      </div>

      {/* Card 4: Elementos decorativos extras */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
        <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Elementos Decorativos Extras
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Ative efeitos animados especiais para cada tema. Os efeitos só aparecem quando o tema
          correspondente está ativo.
        </p>

        <div className="space-y-4">
          {/* Snow Effect */}
          <div
            className={cn(
              'flex items-center justify-between p-4 rounded-lg border transition-all',
              activeTheme === 'christmas'
                ? 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20'
                : 'border-border bg-muted/30 opacity-60'
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'p-2 rounded-lg',
                  activeTheme === 'christmas' ? 'bg-red-100 dark:bg-red-900/50' : 'bg-muted'
                )}
              >
                <Snowflake
                  className={cn(
                    'h-5 w-5',
                    activeTheme === 'christmas'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-muted-foreground'
                  )}
                />
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
              disabled={activeTheme !== 'christmas'}
            />
          </div>

          {/* Fireworks Effect */}
          <div
            className={cn(
              'flex items-center justify-between p-4 rounded-lg border transition-all',
              activeTheme === 'new_year'
                ? 'border-yellow-200 bg-yellow-50/50 dark:border-yellow-900 dark:bg-yellow-950/20'
                : 'border-border bg-muted/30 opacity-60'
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'p-2 rounded-lg',
                  activeTheme === 'new_year' ? 'bg-yellow-100 dark:bg-yellow-900/50' : 'bg-muted'
                )}
              >
                <Sparkles
                  className={cn(
                    'h-5 w-5',
                    activeTheme === 'new_year'
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-muted-foreground'
                  )}
                />
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
              disabled={activeTheme !== 'new_year'}
            />
          </div>

          {/* Confetti Effect */}
          <div
            className={cn(
              'flex items-center justify-between p-4 rounded-lg border transition-all',
              activeTheme === 'carnaval'
                ? 'border-pink-200 bg-pink-50/50 dark:border-pink-900 dark:bg-pink-950/20'
                : 'border-border bg-muted/30 opacity-60'
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'p-2 rounded-lg',
                  activeTheme === 'carnaval' ? 'bg-pink-100 dark:bg-pink-900/50' : 'bg-muted'
                )}
              >
                <PartyPopper
                  className={cn(
                    'h-5 w-5',
                    activeTheme === 'carnaval'
                      ? 'text-pink-600 dark:text-pink-400'
                      : 'text-muted-foreground'
                  )}
                />
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
              disabled={activeTheme !== 'carnaval'}
            />
          </div>
        </div>
      </div>

      {/* Preview info */}
      <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
        <strong>Prévia:</strong> As mudanças são aplicadas em tempo real no site. Salve para
        persistir as configurações.
      </div>

      {/* Save Button */}
      <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
        <Save className="h-4 w-4 mr-2" />
        {isSaving ? 'Salvando...' : 'Salvar Configurações de Tema'}
      </Button>
    </div>
  );
}
