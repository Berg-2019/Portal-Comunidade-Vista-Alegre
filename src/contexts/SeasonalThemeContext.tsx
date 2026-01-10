import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/services/api';

export type SeasonalTheme = 
  | 'default' 
  | 'christmas' 
  | 'new_year' 
  | 'easter' 
  | 'carnaval'
  | 'sao_joao'           // Festas Juninas
  | 'independencia'      // 7 de Setembro
  | 'tiradentes'         // 21 de Abril
  | 'republica'          // 15 de Novembro
  | 'rondonia';          // 4 de Janeiro - Aniversário de Rondônia

export interface ThemeSchedule {
  theme: SeasonalTheme;
  startDate: string; // MM-DD format
  endDate: string; // MM-DD format
  enabled: boolean;
}

interface ColorConfig {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  foreground?: string;
  muted?: string;
  success?: string;
  warning?: string;
  destructive?: string;
  card?: string;
  border?: string;
}

interface SeasonalThemeContextType {
  theme: SeasonalTheme;
  activeTheme: SeasonalTheme; // The theme actually being displayed (considering schedule)
  snowEnabled: boolean;
  fireworksEnabled: boolean;
  confettiEnabled: boolean;
  isLoading: boolean;
  autoScheduleEnabled: boolean;
  schedules: ThemeSchedule[];
  setTheme: (theme: SeasonalTheme) => void;
  setSnowEnabled: (enabled: boolean) => void;
  setFireworksEnabled: (enabled: boolean) => void;
  setConfettiEnabled: (enabled: boolean) => void;
  setAutoScheduleEnabled: (enabled: boolean) => void;
  setSchedules: (schedules: ThemeSchedule[]) => void;
  updateSchedule: (theme: SeasonalTheme, updates: Partial<ThemeSchedule>) => void;
  saveSettings: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

// Default schedules for each theme
const defaultSchedules: ThemeSchedule[] = [
  { theme: 'christmas', startDate: '12-01', endDate: '12-26', enabled: true },
  { theme: 'new_year', startDate: '12-27', endDate: '01-02', enabled: true },
  { theme: 'easter', startDate: '03-20', endDate: '04-10', enabled: false },
  { theme: 'carnaval', startDate: '02-01', endDate: '02-15', enabled: false },
  { theme: 'sao_joao', startDate: '06-01', endDate: '06-30', enabled: false },
  { theme: 'independencia', startDate: '09-01', endDate: '09-10', enabled: false },
  { theme: 'tiradentes', startDate: '04-18', endDate: '04-23', enabled: false },
  { theme: 'republica', startDate: '11-13', endDate: '11-17', enabled: false },
  { theme: 'rondonia', startDate: '01-01', endDate: '01-06', enabled: false },
];

const SeasonalThemeContext = createContext<SeasonalThemeContextType | undefined>(undefined);

// Helper function to check if a date is within a range (handles year wrap for new_year)
function isDateInRange(currentDate: Date, startStr: string, endStr: string): boolean {
  const currentMonth = currentDate.getMonth() + 1;
  const currentDay = currentDate.getDate();
  const current = currentMonth * 100 + currentDay; // e.g., December 15 = 1215

  const [startMonth, startDay] = startStr.split('-').map(Number);
  const [endMonth, endDay] = endStr.split('-').map(Number);
  const start = startMonth * 100 + startDay;
  const end = endMonth * 100 + endDay;

  // Handle year wrap (e.g., Dec 27 - Jan 2)
  if (start > end) {
    return current >= start || current <= end;
  }

  return current >= start && current <= end;
}

// Determine which theme should be active based on schedules
function getScheduledTheme(schedules: ThemeSchedule[], fallbackTheme: SeasonalTheme): SeasonalTheme {
  const now = new Date();

  for (const schedule of schedules) {
    if (schedule.enabled && isDateInRange(now, schedule.startDate, schedule.endDate)) {
      return schedule.theme;
    }
  }

  return fallbackTheme;
}

// Convert HEX to HSL string (without hsl() wrapper for CSS variables)
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

// Apply custom colors from settings to CSS variables
function applyCustomColors(colors: ColorConfig) {
  const root = document.documentElement;
  
  const cssVarMap: Record<keyof ColorConfig, string> = {
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

  Object.entries(colors).forEach(([key, value]) => {
    if (value && cssVarMap[key as keyof ColorConfig]) {
      const hslValue = hexToHsl(value);
      root.style.setProperty(cssVarMap[key as keyof ColorConfig], hslValue);
    }
  });
}

export function SeasonalThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<SeasonalTheme>('default');
  const [snowEnabled, setSnowEnabled] = useState(false);
  const [fireworksEnabled, setFireworksEnabled] = useState(false);
  const [confettiEnabled, setConfettiEnabled] = useState(false);
  const [autoScheduleEnabled, setAutoScheduleEnabled] = useState(false);
  const [schedules, setSchedules] = useState<ThemeSchedule[]>(defaultSchedules);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate active theme based on settings
  const activeTheme = autoScheduleEnabled ? getScheduledTheme(schedules, theme) : theme;

  const fetchSettings = async () => {
    try {
      const settings = await api.getSettings();
      setTheme((settings.seasonal_theme as SeasonalTheme) || 'default');
      setSnowEnabled(settings.snow_enabled === 'true');
      setFireworksEnabled(settings.fireworks_enabled === 'true');
      setConfettiEnabled(settings.confetti_enabled === 'true');
      setAutoScheduleEnabled(settings.auto_schedule_enabled === 'true');

      // Parse schedules from settings
      if (settings.theme_schedules) {
        try {
          const parsedSchedules = JSON.parse(settings.theme_schedules);
          if (Array.isArray(parsedSchedules)) {
            setSchedules(parsedSchedules);
          }
        } catch (e) {
          console.error('Error parsing theme schedules:', e);
        }
      }

      // Load and apply custom colors
      if (settings.custom_colors) {
        try {
          const customColors = JSON.parse(settings.custom_colors);
          applyCustomColors(customColors);
        } catch (e) {
          console.error('Error parsing custom colors:', e);
        }
      }
    } catch (error) {
      console.error('Error fetching seasonal theme settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;

    // Remove all theme classes
    root.classList.remove(
      'theme-default',
      'theme-christmas',
      'theme-new-year',
      'theme-easter',
      'theme-carnaval',
      'theme-sao-joao',
      'theme-independencia',
      'theme-tiradentes',
      'theme-republica',
      'theme-rondonia'
    );

    // Add current theme class (use activeTheme which considers scheduling)
    root.classList.add(`theme-${activeTheme.replace('_', '-')}`);
  }, [activeTheme]);

  // Check schedule periodically (every minute)
  useEffect(() => {
    if (!autoScheduleEnabled) return;

    const interval = setInterval(() => {
      // This will trigger a re-render and recalculate activeTheme
      setSchedules((prev) => [...prev]);
    }, 60000);

    return () => clearInterval(interval);
  }, [autoScheduleEnabled]);

  const updateSchedule = (themeKey: SeasonalTheme, updates: Partial<ThemeSchedule>) => {
    setSchedules((prev) =>
      prev.map((s) => (s.theme === themeKey ? { ...s, ...updates } : s))
    );
  };

  const saveSettings = async () => {
    try {
      await api.updateSettings({
        seasonal_theme: theme,
        snow_enabled: String(snowEnabled),
        fireworks_enabled: String(fireworksEnabled),
        confetti_enabled: String(confettiEnabled),
        auto_schedule_enabled: String(autoScheduleEnabled),
        theme_schedules: JSON.stringify(schedules),
      });
    } catch (error) {
      console.error('Error saving seasonal theme settings:', error);
      throw error;
    }
  };

  const refreshSettings = async () => {
    setIsLoading(true);
    await fetchSettings();
  };

  return (
    <SeasonalThemeContext.Provider
      value={{
        theme,
        activeTheme,
        snowEnabled,
        fireworksEnabled,
        confettiEnabled,
        isLoading,
        autoScheduleEnabled,
        schedules,
        setTheme,
        setSnowEnabled,
        setFireworksEnabled,
        setConfettiEnabled,
        setAutoScheduleEnabled,
        setSchedules,
        updateSchedule,
        saveSettings,
        refreshSettings,
      }}
    >
      {children}
    </SeasonalThemeContext.Provider>
  );
}

export function useSeasonalTheme() {
  const context = useContext(SeasonalThemeContext);
  if (context === undefined) {
    throw new Error('useSeasonalTheme must be used within a SeasonalThemeProvider');
  }
  return context;
}
