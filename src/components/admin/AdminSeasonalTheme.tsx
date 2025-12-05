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

const themeOptions: { value: SeasonalTheme; label: string; description: string; icon: string }[] = [
  { value: 'default', label: 'Padrão', description: 'Tema padrão do site com cores da comunidade', icon: '🌿' },
  { value: 'christmas', label: 'Natal', description: 'Vermelho, verde e dourado com clima natalino', icon: '🎄' },
  { value: 'new_year', label: 'Ano Novo', description: 'Fundo escuro com detalhes dourados e festivos', icon: '🎆' },
  { value: 'easter', label: 'Páscoa', description: 'Cores pastéis com detalhes delicados', icon: '🐰' },
  { value: 'carnaval', label: 'Carnaval', description: 'Cores vibrantes e clima de festa', icon: '🎭' },
];

const scheduleThemes = themeOptions.filter((t) => t.value !== 'default');

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

      {/* Card 1: Tema atual do site */}
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
              </div>
            </Label>
          ))}
        </RadioGroup>
      </div>

      {/* Card 2: Agendamento Automático */}
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
                  <div className="flex items-center gap-3 min-w-[140px]">
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

      {/* Card 3: Elementos decorativos extras */}
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
