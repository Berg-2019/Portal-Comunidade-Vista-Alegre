import { useEffect, useState } from 'react';

interface Firework {
  id: number;
  x: number;
  y: number;
  color: string;
  delay: number;
}

const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#A855F7', '#F97316', '#22C55E'];

export default function FireworksEffect() {
  const [fireworks, setFireworks] = useState<Firework[]>([]);

  useEffect(() => {
    const createFirework = () => {
      const newFirework: Firework = {
        id: Date.now() + Math.random(),
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 40,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: 0,
      };
      
      setFireworks((prev) => [...prev.slice(-10), newFirework]);
    };

    // Create initial fireworks
    for (let i = 0; i < 5; i++) {
      setTimeout(() => createFirework(), i * 600);
    }

    const interval = setInterval(createFirework, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {fireworks.map((fw) => (
        <div
          key={fw.id}
          className="absolute animate-firework"
          style={{
            left: `${fw.x}%`,
            top: `${fw.y}%`,
          }}
        >
          {/* Explosion particles */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-particle"
              style={{
                backgroundColor: fw.color,
                boxShadow: `0 0 6px ${fw.color}, 0 0 12px ${fw.color}`,
                transform: `rotate(${i * 30}deg) translateY(-20px)`,
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
          {/* Center burst */}
          <div
            className="absolute w-4 h-4 rounded-full animate-burst -translate-x-1/2 -translate-y-1/2"
            style={{
              backgroundColor: fw.color,
              boxShadow: `0 0 20px ${fw.color}, 0 0 40px ${fw.color}`,
            }}
          />
        </div>
      ))}
    </div>
  );
}
