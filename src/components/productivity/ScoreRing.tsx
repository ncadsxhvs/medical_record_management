'use client';

interface ScoreRingProps {
  pct: number;
  value: string;
  sublabel: string;
  color: string;
  size?: number;
}

export default function ScoreRing({ pct, value, sublabel, color, size = 180 }: ScoreRingProps) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * Math.min(pct, 100) / 100;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="stroke-zinc-200" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-4xl font-mono font-bold text-[#1f1f1f] leading-none tracking-tight">{value}</div>
          <div className="text-[11px] text-zinc-500 mt-1 uppercase tracking-widest font-semibold">{sublabel}</div>
        </div>
      </div>
    </div>
  );
}
