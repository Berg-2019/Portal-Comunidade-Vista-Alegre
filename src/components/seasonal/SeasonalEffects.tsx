import { useSeasonalTheme } from '@/contexts/SeasonalThemeContext';
import SnowEffect from './SnowEffect';
import FireworksEffect from './FireworksEffect';
import ConfettiEffect from './ConfettiEffect';

export default function SeasonalEffects() {
  const { theme, snowEnabled, fireworksEnabled, confettiEnabled } = useSeasonalTheme();

  return (
    <>
      {theme === 'christmas' && snowEnabled && <SnowEffect />}
      {theme === 'new_year' && fireworksEnabled && <FireworksEffect />}
      {theme === 'carnaval' && confettiEnabled && <ConfettiEffect />}
    </>
  );
}
