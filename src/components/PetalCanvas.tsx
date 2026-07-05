import { useEffect, useRef } from 'react';

interface PetalCanvasProps {
  theme?: string;
}

interface Petal {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  swingRange: number;
  swingSpeed: number;
  swingOffset: number;
}

export default function PetalCanvas({ theme }: PetalCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let petals: Petal[] = [];
    const isMobile = window.innerWidth < 768;
    const maxPetals = isMobile ? 18 : 35;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Helper to get color of petals based on the current active theme
    const getPetalColor = () => {
      if (!theme) return 'rgba(197, 160, 89, 0.4)'; // Gold/amber default
      if (theme === 'sage-cream') {
        return 'rgba(212, 175, 55, 0.35)'; // Warm Gold
      }
      if (theme === 'navy-rose') {
        return 'rgba(224, 169, 109, 0.35)'; // Rose Gold
      }
      if (theme === 'ivory-blush') {
        return 'rgba(213, 166, 189, 0.4)'; // Soft Pink Blush
      }
      return 'rgba(197, 160, 89, 0.4)'; // Plum Gold default
    };

    const createPetal = (isInitial = false): Petal => {
      const size = Math.random() * 8 + 6; // 6px - 14px
      return {
        x: Math.random() * canvas.width,
        y: isInitial ? Math.random() * canvas.height : -20,
        size,
        speedY: Math.random() * 0.8 + 0.4, // Fall speed 0.4 - 1.2
        speedX: Math.random() * 0.3 - 0.15,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 1.5 - 0.75,
        opacity: Math.random() * 0.4 + 0.3, // Opacity 0.3 - 0.7
        swingRange: Math.random() * 20 + 10, // Horizontal swing
        swingSpeed: Math.random() * 0.015 + 0.005,
        swingOffset: Math.random() * 100,
      };
    };

    // Initialize petals
    for (let i = 0; i < maxPetals; i++) {
      petals.push(createPetal(true));
    }

    let lastTime = 0;

    const drawPetalPath = (context: CanvasRenderingContext2D, size: number) => {
      // Draw an elegant curved flower petal shape
      context.beginPath();
      context.moveTo(0, -size / 2);
      context.quadraticCurveTo(size / 2, -size / 2, size / 2, 0);
      context.quadraticCurveTo(size / 3, size / 2, 0, size / 2);
      context.quadraticCurveTo(-size / 3, size / 2, -size / 2, 0);
      context.quadraticCurveTo(-size / 2, -size / 2, 0, -size / 2);
      context.closePath();
    };

    const draw = (time: number) => {
      // Stop/pause draw if page is hidden
      if (document.hidden) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const petalColor = getPetalColor();

      petals.forEach((p) => {
        ctx.save();
        
        // Calculate organic sinusoidal horizontal drift (wind effect)
        const swing = Math.sin(time * p.swingSpeed + p.swingOffset) * p.swingRange * 0.1;
        p.x += p.speedX + swing * 0.2;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        // Reset petal if it falls off screen boundaries
        if (p.y > canvas.height + 20 || p.x < -20 || p.x > canvas.width + 20) {
          Object.assign(p, createPetal(false));
        }

        // Apply translations
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        
        // Setup fill style with color and opacity
        ctx.fillStyle = petalColor;
        ctx.shadowColor = theme === 'navy-rose' ? 'rgba(224, 169, 109, 0.1)' : 'rgba(197, 160, 89, 0.1)';
        ctx.shadowBlur = 4;

        drawPetalPath(ctx, p.size);
        ctx.fill();

        ctx.restore();
      });

      animationId = requestAnimationFrame(draw);
    };

    // Start requestAnimationFrame loop
    animationId = requestAnimationFrame(draw);

    // Listen for tab focus/visibility changes to pause
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationId);
      } else {
        animationId = requestAnimationFrame(draw);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animationId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      id="falling-petals-canvas"
      className="fixed inset-0 pointer-events-none w-full h-full"
      style={{ zIndex: 35 }}
    />
  );
}
