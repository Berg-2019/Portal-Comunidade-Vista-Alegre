import { useEffect, useState } from 'react';

interface Confetti {
  id: number;
  left: number;
  color: string;
  animationDuration: number;
  delay: number;
  rotation: number;
  size: number;
  type: 'square' | 'circle' | 'ribbon';
}

const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#A8D8EA'];

export default function ConfettiEffect() {
  const [confetti, setConfetti] = useState<Confetti[]>([]);

  useEffect(() => {
    const pieces: Confetti[] = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      animationDuration: 4 + Math.random() * 6,
      delay: Math.random() * 4,
      rotation: Math.random() * 360,
      size: 6 + Math.random() * 8,
      type: ['square', 'circle', 'ribbon'][Math.floor(Math.random() * 3)] as Confetti['type'],
    }));
    setConfetti(pieces);
  }, []);

  const renderShape = (piece: Confetti) => {
    const baseStyle = {
      backgroundColor: piece.color,
      width: piece.size,
      height: piece.type === 'ribbon' ? piece.size * 2.5 : piece.size,
    };

    switch (piece.type) {
      case 'circle':
        return <div className="rounded-full" style={baseStyle} />;
      case 'ribbon':
        return <div className="rounded-sm" style={{ ...baseStyle, transform: `rotate(${piece.rotation}deg)` }} />;
      default:
        return <div className="rounded-sm" style={{ ...baseStyle, transform: `rotate(${piece.rotation}deg)` }} />;
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="absolute animate-confetti"
          style={{
            left: `${piece.left}%`,
            animationDuration: `${piece.animationDuration}s`,
            animationDelay: `${piece.delay}s`,
          }}
        >
          {renderShape(piece)}
        </div>
      ))}
    </div>
  );
}
