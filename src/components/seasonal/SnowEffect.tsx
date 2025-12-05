import { useEffect, useState } from 'react';

interface Snowflake {
  id: number;
  left: number;
  animationDuration: number;
  opacity: number;
  size: number;
  delay: number;
}

export default function SnowEffect() {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);

  useEffect(() => {
    const flakes: Snowflake[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDuration: 5 + Math.random() * 10,
      opacity: 0.4 + Math.random() * 0.6,
      size: 4 + Math.random() * 8,
      delay: Math.random() * 5,
    }));
    setSnowflakes(flakes);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute animate-snowfall"
          style={{
            left: `${flake.left}%`,
            animationDuration: `${flake.animationDuration}s`,
            animationDelay: `${flake.delay}s`,
            opacity: flake.opacity,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
          }}
        >
          <svg viewBox="0 0 24 24" fill="white" className="w-full h-full drop-shadow-md">
            <path d="M12 2L12 22M2 12L22 12M4.93 4.93L19.07 19.07M4.93 19.07L19.07 4.93" 
              stroke="white" 
              strokeWidth="1.5" 
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="12" cy="12" r="2" fill="white" />
          </svg>
        </div>
      ))}
    </div>
  );
}
