import { useSeasonalTheme } from '@/contexts/SeasonalThemeContext';
import SnowEffect from './SnowEffect';
import FireworksEffect from './FireworksEffect';
import ConfettiEffect from './ConfettiEffect';

export default function SeasonalEffects() {
  const { activeTheme, snowEnabled, fireworksEnabled, confettiEnabled } = useSeasonalTheme();

  return (
    <>
      {activeTheme === 'christmas' && snowEnabled && <SnowEffect />}
      {activeTheme === 'new_year' && fireworksEnabled && <FireworksEffect />}
      {activeTheme === 'carnaval' && confettiEnabled && <ConfettiEffect />}
    </>
  );
}
