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

const NODE_COUNT = 58;

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
        x: (index / NODE_COUNT) * width + (Math.random() - 0.5) * 120,
        y: Math.random() * height,
        z: 0.45 + Math.random() * 0.85,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.18,
        hue: index % 3,
      }));
    };

    const colorFor = (hue: number, alpha: number) => {
      if (hue === 0) return `rgba(153, 69, 255, ${alpha})`;
      if (hue === 1) return `rgba(20, 241, 149, ${alpha})`;
      return `rgba(56, 189, 248, ${alpha})`;
    };

    const draw = () => {
      frame += 0.008;
      ctx.clearRect(0, 0, width, height);

      const theme = document.documentElement.dataset.theme;
      const isLight = theme === 'light';
      const centerX = width * 0.5;
      const centerY = height * 0.46;

      const wash = ctx.createLinearGradient(0, 0, width, height);
      wash.addColorStop(0, isLight ? 'rgba(248, 250, 252, 0.88)' : 'rgba(4, 8, 20, 0.28)');
      wash.addColorStop(0.5, isLight ? 'rgba(226, 232, 240, 0.62)' : 'rgba(10, 18, 36, 0.12)');
      wash.addColorStop(1, isLight ? 'rgba(203, 213, 225, 0.70)' : 'rgba(2, 6, 23, 0.34)');
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(frame * 0.36);
      for (let ring = 0; ring < 4; ring += 1) {
        ctx.beginPath();
        ctx.ellipse(0, 0, 190 + ring * 92, 76 + ring * 34, 0, 0, Math.PI * 2);
        ctx.strokeStyle = ring % 2 === 0 ? colorFor(0, isLight ? 0.12 : 0.18) : colorFor(1, isLight ? 0.11 : 0.16);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();

      nodes.forEach((node) => {
        node.x += node.vx * node.z;
        node.y += node.vy * node.z;
        if (node.x < -40) node.x = width + 40;
        if (node.x > width + 40) node.x = -40;
        if (node.y < -40) node.y = height + 40;
        if (node.y > height + 40) node.y = -40;
      });

      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i];
          const b = nodes[j];
          const distance = Math.hypot(a.x - b.x, a.y - b.y);
          if (distance < 138) {
            const alpha = (1 - distance / 138) * (isLight ? 0.16 : 0.22);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = colorFor((a.hue + b.hue) % 3, alpha);
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      nodes.forEach((node) => {
        const pulse = 0.75 + Math.sin(frame * 4 + node.x * 0.01) * 0.25;
        ctx.beginPath();
        ctx.arc(node.x, node.y, (1.5 + node.z * 1.7) * pulse, 0, Math.PI * 2);
        ctx.fillStyle = colorFor(node.hue, isLight ? 0.34 : 0.46);
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
      <canvas ref={canvasRef} className="absolute inset-0 opacity-80" aria-hidden="true" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(2,6,23,0.18)_62%,rgba(2,6,23,0.38))] dark:bg-[linear-gradient(to_bottom,transparent,rgba(2,6,23,0.34)_62%,rgba(2,6,23,0.72))]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
    </div>
  );
}
