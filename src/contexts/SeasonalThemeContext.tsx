import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/services/api';

export type SeasonalTheme = 'default' | 'christmas' | 'new_year' | 'easter' | 'carnaval';

export interface ThemeSchedule {
  theme: SeasonalTheme;
  startDate: string; // MM-DD format
  endDate: string; // MM-DD format
  enabled: boolean;
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
      'theme-carnaval'
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
