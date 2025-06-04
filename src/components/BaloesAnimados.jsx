import React from 'react';

const cores = ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6', '#facc15'];
const baloesProps = Array.from({ length: 18 }).map((_, i) => {
  const left = Math.random() * 100;
  const size = 40 + Math.random() * 60;
  const dur = 7 + Math.random() * 6;
  const cor = cores[Math.floor(Math.random() * cores.length)];
  const delay = Math.random() * 6;
  return { left, size, dur, cor, delay };
});

export default function BaloesAnimados() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {baloesProps.map((b, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            left: `${b.left}%`,
            bottom: '-100px',
            width: b.size,
            height: b.size * 1.3,
            background: b.cor,
            borderRadius: '50% 50% 48% 52% / 60% 60% 40% 40%',
            opacity: 0.7,
            filter: 'blur(0.5px)',
            animation: `baloonUp ${b.dur}s linear ${b.delay}s infinite`,
            zIndex: 0,
            boxShadow: `0 8px 24px ${b.cor}55`,
          }}
        />
      ))}
      <style>{`
        @keyframes baloonUp {
          0% { transform: translateY(0) scale(1); opacity: 0.7; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-110vh) scale(1.08); opacity: 0; }
        }
      `}</style>
    </div>
  );
} 
