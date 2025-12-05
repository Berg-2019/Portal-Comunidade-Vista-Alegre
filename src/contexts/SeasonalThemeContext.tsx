import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/services/api';

export type SeasonalTheme = 'default' | 'christmas' | 'new_year' | 'easter' | 'carnaval';

interface SeasonalThemeSettings {
  seasonal_theme: SeasonalTheme;
  snow_enabled: boolean;
  fireworks_enabled: boolean;
  confetti_enabled: boolean;
}

interface SeasonalThemeContextType {
  theme: SeasonalTheme;
  snowEnabled: boolean;
  fireworksEnabled: boolean;
  confettiEnabled: boolean;
  isLoading: boolean;
  setTheme: (theme: SeasonalTheme) => void;
  setSnowEnabled: (enabled: boolean) => void;
  setFireworksEnabled: (enabled: boolean) => void;
  setConfettiEnabled: (enabled: boolean) => void;
  saveSettings: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: SeasonalThemeSettings = {
  seasonal_theme: 'default',
  snow_enabled: false,
  fireworks_enabled: false,
  confetti_enabled: false,
};

const SeasonalThemeContext = createContext<SeasonalThemeContextType | undefined>(undefined);

export function SeasonalThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<SeasonalTheme>('default');
  const [snowEnabled, setSnowEnabled] = useState(false);
  const [fireworksEnabled, setFireworksEnabled] = useState(false);
  const [confettiEnabled, setConfettiEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const settings = await api.getSettings();
      setTheme((settings.seasonal_theme as SeasonalTheme) || 'default');
      setSnowEnabled(settings.snow_enabled === 'true');
      setFireworksEnabled(settings.fireworks_enabled === 'true');
      setConfettiEnabled(settings.confetti_enabled === 'true');
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
    
    // Add current theme class
    root.classList.add(`theme-${theme.replace('_', '-')}`);
  }, [theme]);

  const saveSettings = async () => {
    try {
      await api.updateSettings({
        seasonal_theme: theme,
        snow_enabled: String(snowEnabled),
        fireworks_enabled: String(fireworksEnabled),
        confetti_enabled: String(confettiEnabled),
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
        snowEnabled,
        fireworksEnabled,
        confettiEnabled,
        isLoading,
        setTheme,
        setSnowEnabled,
        setFireworksEnabled,
        setConfettiEnabled,
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
