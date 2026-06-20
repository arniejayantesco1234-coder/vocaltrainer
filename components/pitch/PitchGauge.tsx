'use client';

import React, { useEffect, useRef, useState } from 'react';

interface PitchGaugeProps {
  frequency: number;
  note: string;
  cents: number;
}

export default function PitchGauge({ frequency, note, cents }: PitchGaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [flashGreen, setFlashGreen] = useState(false);
  
  // Flash effect when in tune
  useEffect(() => {
    const absCents = Math.abs(cents);
    if (absCents <= 10 && note) {
      setFlashGreen(true);
      const timer = setTimeout(() => setFlashGreen(false), 150);
      return () => clearTimeout(timer);
    }
  }, [cents, note]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const cx = width / 2;
    const cy = height * 0.82;
    const radius = Math.min(width, height) * 0.65;
    const startAngle = Math.PI * 0.85;
    const endAngle = Math.PI * 2.15;

    // Background arc with tick marks
    ctx.clearRect(0, 0, width, height);

    // Draw outer glow ring
    const absCents = Math.abs(cents);
    const isInTune = absCents <= 10 && note !== '';
    const isSharp = cents > 10;
    
    // Glow effect
    if (isInTune) {
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 20;
    } else if (isSharp) {
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
    } else {
      ctx.shadowColor = '#7f1d1d';
      ctx.shadowBlur = 10;
    }

    // Main arc background
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#27272a';
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Tick marks
    const tickCount = 21;
    for (let i = 0; i < tickCount; i++) {
      const t = i / (tickCount - 1);
      const angle = startAngle + t * (endAngle - startAngle);
      const isCenter = i === Math.floor(tickCount / 2);
      const tickLen = isCenter ? 12 : 6;
      const tickWidth = isCenter ? 2 : 1;
      const tickColor = isCenter ? '#22c55e' : '#3f3f46';
      
      ctx.beginPath();
      ctx.moveTo(
        cx + Math.cos(angle) * (radius - tickLen),
        cy + Math.sin(angle) * (radius - tickLen)
      );
      ctx.lineTo(
        cx + Math.cos(angle) * radius,
        cy + Math.sin(angle) * radius
      );
      ctx.lineWidth = tickWidth;
      ctx.strokeStyle = tickColor;
      ctx.stroke();
    }

    // Color zones
    const zoneAngle = (endAngle - startAngle) / 3;
    
    // Flat zone (dark red)
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 7, startAngle, startAngle + zoneAngle);
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(127, 29, 29, 0.3)';
    ctx.stroke();
    
    // In tune zone (green)
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 7, startAngle + zoneAngle, startAngle + zoneAngle * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
    ctx.stroke();
    
    // Sharp zone (bright red)
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 7, startAngle + zoneAngle * 2, endAngle);
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
    ctx.stroke();

    // Needle angle calculation
    const range = 50;
    const clampedCents = Math.max(-range, Math.min(range, cents));
    const normalizedCents = clampedCents / range;
    const needleAngle = Math.PI * 1.5 + normalizedCents * (Math.PI * 0.65);

    // Needle color
    const needleColor = isInTune ? '#22c55e' : isSharp ? '#ef4444' : '#7f1d1d';

    // Needle glow
    ctx.shadowColor = needleColor;
    ctx.shadowBlur = isInTune ? 25 : 12;

    // Draw needle
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(
      cx + Math.cos(needleAngle) * (radius - 16),
      cy + Math.sin(needleAngle) * (radius - 16)
    );
    ctx.lineWidth = 3;
    ctx.strokeStyle = needleColor;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Center pivot
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fillStyle = needleColor;
    ctx.fill();
    
    // Inner pivot
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#18181b';
    ctx.fill();

    // Note text
    ctx.font = `bold ${Math.min(width / 8, 36)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isInTune ? '#22c55e' : '#e4e4e7';
    ctx.fillText(note || '--', cx, cy - radius * 0.55);

    // Frequency text
    if (frequency > 0) {
      ctx.font = `500 ${Math.min(width / 18, 16)}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = '#a1a1aa';
      ctx.fillText(`${Math.round(frequency)} Hz`, cx, cy - radius * 0.35);
    }

    // Cents text
    if (note) {
      ctx.font = `500 ${Math.min(width / 20, 14)}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = isInTune ? '#22c55e' : isSharp ? '#ef4444' : '#7f1d1d';
      const centsText = `${cents > 0 ? '+' : ''}${Math.round(cents)} cents`;
      ctx.fillText(centsText, cx, cy - radius * 0.18);
    }

    // Labels
    ctx.font = `500 ${Math.min(width / 25, 12)}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = '#7f1d1d';
    ctx.textAlign = 'left';
    ctx.fillText('FLAT', cx - radius + 10, cy + 15);
    
    ctx.fillStyle = '#22c55e';
    ctx.textAlign = 'center';
    ctx.fillText('IN TUNE', cx, cy - radius - 10);
    
    ctx.fillStyle = '#ef4444';
    ctx.textAlign = 'right';
    ctx.fillText('SHARP', cx + radius - 10, cy + 15);

  }, [frequency, note, cents]);

  return (
    <div className={`mt-4 relative transition-all duration-150 ${flashGreen ? 'scale-105' : 'scale-100'}`}>
      <canvas
        ref={canvasRef}
        className="w-full max-w-sm mx-auto h-48"
      />
      <div className="flex justify-center gap-6 text-xs text-zinc-500 mt-2">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          In Tune (&plusmn;10 cents)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
          Sharp
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-900 shadow-[0_0_8px_rgba(127,29,29,0.6)]" />
          Flat
        </span>
      </div>
    </div>
  );
}
