"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface DriverDot {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  status: "online" | "in_ride";
}

interface SurgeZone {
  cx: number;
  cy: number;
  r: number;
  intensity: number;
}

interface MapViewProps {
  className?: string;
  showSurge?: boolean;
  driverCount?: number;
  height?: string;
  activePath?: { x1: number; y1: number; x2: number; y2: number };
}

function makeDrivers(n: number, w: number, h: number): DriverDot[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `d${i}`,
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    status: i % 5 === 0 ? "in_ride" : "online",
  }));
}

export function MapView({ className, showSurge = true, driverCount = 22, height = "h-full" }: MapViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const driversRef = useRef<DriverDot[]>([]);
  const animRef = useRef<number>(0);
  const [dims, setDims] = useState({ w: 800, h: 480 });

  useEffect(() => {
    const el = canvasRef.current?.parentElement;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDims({ w: Math.floor(width), h: Math.floor(height) });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const { w, h } = dims;
    if (!driversRef.current.length) driversRef.current = makeDrivers(driverCount, w, h);

    const surgeZones: SurgeZone[] = showSurge
      ? [
          { cx: w * 0.25, cy: h * 0.3, r: w * 0.12, intensity: 0.6 },
          { cx: w * 0.7, cy: h * 0.6, r: w * 0.1, intensity: 0.4 },
          { cx: w * 0.5, cy: h * 0.15, r: w * 0.08, intensity: 0.3 },
        ]
      : [];

    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    let frame = 0;

    function draw() {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Roads
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 2;
      const roads = [[0, h * 0.35, w, h * 0.35], [0, h * 0.65, w, h * 0.65], [w * 0.3, 0, w * 0.3, h], [w * 0.65, 0, w * 0.65, h], [0, h * 0.5, w * 0.45, h * 0.5], [w * 0.55, h * 0.5, w, h * 0.5]];
      roads.forEach(([x1, y1, x2, y2]) => {
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      });

      // Surge zones
      surgeZones.forEach(({ cx, cy, r, intensity }) => {
        const pulse = 1 + Math.sin(frame * 0.02) * 0.06;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * pulse);
        grad.addColorStop(0, `rgba(239,68,68,${intensity * 0.35})`);
        grad.addColorStop(0.5, `rgba(245,158,11,${intensity * 0.2})`);
        grad.addColorStop(1, "rgba(239,68,68,0)");
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(cx, cy, r * pulse, 0, Math.PI * 2); ctx.fill();
      });

      // Update and draw drivers
      driversRef.current.forEach((d) => {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0 || d.x > w) d.vx *= -1;
        if (d.y < 0 || d.y > h) d.vy *= -1;

        const isInRide = d.status === "in_ride";
        const color = isInRide ? "#3B82F6" : "#10B981";
        const ping = Math.sin(frame * 0.05 + parseFloat(d.id.slice(1))) * 0.5 + 0.5;

        if (!isInRide) {
          ctx.beginPath();
          ctx.arc(d.x, d.y, 10 + ping * 6, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(16,185,129,${0.08 + ping * 0.08})`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(d.x, d.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(d.x, d.y, 4, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      frame++;
      animRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [dims, driverCount, showSurge]);

  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-gray-950", height, className)}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex items-center gap-3 glass rounded-xl px-3 py-2 text-xs">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Online</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400" /> In Ride</span>
        {showSurge && <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" /> Surge</span>}
      </div>
    </div>
  );
}
