'use client';

import { useEffect, useRef } from 'react';

type Node = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  hue: number;
};

const NODE_COUNT = 42;
const CONNECT_DIST = 160;

export default function AmbientScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    let animationId = 0;
    let nodes: Node[] = [];

    const reset = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      nodes = Array.from({ length: NODE_COUNT }, (_, index) => ({
        x: (index / NODE_COUNT) * width + (Math.random() - 0.5) * 160,
        y: Math.random() * height,
        z: 0.4 + Math.random() * 0.8,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.14,
        hue: index % 3,
      }));
    };

    const colorFor = (hue: number, alpha: number) => {
      if (hue === 0) return `rgba(153, 69, 255, ${alpha})`;
      if (hue === 1) return `rgba(139, 92, 246, ${alpha})`;
      return `rgba(167, 139, 250, ${alpha})`;
    };

    const draw = () => {
      frame += 0.006;
      ctx.clearRect(0, 0, width, height);

      const theme = document.documentElement.dataset.theme;
      const isLight = theme === 'light';
      const centerX = width * 0.5;
      const centerY = height * 0.42;

      /* Radial spotlight */
      const spotlight = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.6);
      spotlight.addColorStop(0, isLight ? 'rgba(153, 69, 255, 0.03)' : 'rgba(153, 69, 255, 0.06)');
      spotlight.addColorStop(0.4, isLight ? 'rgba(139, 92, 246, 0.02)' : 'rgba(139, 92, 246, 0.03)');
      spotlight.addColorStop(1, 'transparent');
      ctx.fillStyle = spotlight;
      ctx.fillRect(0, 0, width, height);

      /* Orbital rings (reduced to 2) */
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(frame * 0.28);
      for (let ring = 0; ring < 2; ring += 1) {
        ctx.beginPath();
        ctx.ellipse(0, 0, 220 + ring * 140, 80 + ring * 50, 0, 0, Math.PI * 2);
        ctx.strokeStyle = ring === 0
          ? colorFor(0, isLight ? 0.07 : 0.1)
          : colorFor(1, isLight ? 0.06 : 0.08);
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
      ctx.restore();

      /* Move nodes */
      nodes.forEach((node) => {
        node.x += node.vx * node.z;
        node.y += node.vy * node.z;
        if (node.x < -40) node.x = width + 40;
        if (node.x > width + 40) node.x = -40;
        if (node.y < -40) node.y = height + 40;
        if (node.y > height + 40) node.y = -40;
      });

      /* Connect nodes */
      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i];
          const b = nodes[j];
          const distance = Math.hypot(a.x - b.x, a.y - b.y);
          if (distance < CONNECT_DIST) {
            const alpha = (1 - distance / CONNECT_DIST) * (isLight ? 0.1 : 0.16);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = colorFor((a.hue + b.hue) % 3, alpha);
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      /* Draw nodes */
      nodes.forEach((node) => {
        const pulse = 0.8 + Math.sin(frame * 3 + node.x * 0.008) * 0.2;
        ctx.beginPath();
        ctx.arc(node.x, node.y, (1.5 + node.z * 1.5) * pulse, 0, Math.PI * 2);
        ctx.fillStyle = colorFor(node.hue, isLight ? 0.25 : 0.4);
        ctx.fill();
      });

      animationId = window.requestAnimationFrame(draw);
    };

    reset();
    draw();
    window.addEventListener('resize', reset);

    return () => {
      window.cancelAnimationFrame(animationId);
      window.removeEventListener('resize', reset);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 opacity-70" aria-hidden="true" />
      {/* Theme-aware overlay using CSS variables instead of broken dark: variant */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, transparent 0%, rgba(var(--page-bg-rgb), 0.2) 50%, rgba(var(--page-bg-rgb), 0.5) 100%)`,
        }}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}
