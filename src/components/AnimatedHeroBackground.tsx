import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface AnimatedHeroBackgroundProps {
  customBgUrl?: string;
}

export default function AnimatedHeroBackground({ customBgUrl }: AnimatedHeroBackgroundProps) {
  const [isTabActive, setIsTabActive] = useState(true);
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabActive(!document.hidden);
    };

    const handleScroll = () => {
      setOffsetY(window.pageYOffset * 0.35); // Moves background at 35% speed of foreground scroll
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div 
      className={`absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-none z-0 ${
        !isTabActive ? 'pause-animations' : ''
      }`}
    >
      {/* Dynamic CSS Injector for Parallax, Swaying, and Waterfall Animations */}
      <style>{`
        @keyframes balinese-sway-left {
          0%, 100% { transform: rotate(0deg) skewX(0deg); }
          50% { transform: rotate(-1.5deg) skewX(-1deg); }
        }
        @keyframes balinese-sway-right {
          0%, 100% { transform: rotate(0deg) skewX(0deg); }
          50% { transform: rotate(1.5deg) skewX(1deg); }
        }
        @keyframes balinese-waterfall {
          0% { transform: translateY(-30%); opacity: 0; }
          10% { opacity: 0.35; }
          90% { opacity: 0.35; }
          100% { transform: translateY(100%); opacity: 0; }
        }
        @keyframes balinese-rays {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.4; }
        }
        @keyframes balinese-petal-float {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
        .pause-animations *, .pause-animations::before, .pause-animations::after {
          animation-play-state: paused !important;
        }
        .animate-sway-l {
          animation: balinese-sway-left 7s ease-in-out infinite alternate;
          transform-origin: top left;
          will-change: transform;
        }
        .animate-sway-r {
          animation: balinese-sway-right 8s ease-in-out infinite alternate;
          transform-origin: top right;
          will-change: transform;
        }
        .animate-waterfall-loop-1 {
          animation: balinese-waterfall 9s linear infinite;
          will-change: transform, opacity;
        }
        .animate-waterfall-loop-2 {
          animation: balinese-waterfall 13s linear infinite;
          animation-delay: 4.5s;
          will-change: transform, opacity;
        }
        .animate-rays-pulse {
          animation: balinese-rays 6s ease-in-out infinite;
          will-change: opacity;
        }
      `}</style>

      {/* Custom Background Image layer with Parallax */}
      {customBgUrl && (
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-75 ease-out z-0 opacity-40"
          style={{
            backgroundImage: `url(${customBgUrl})`,
            transform: `translateY(${offsetY}px) scale(1.15)`,
          }}
        />
      )}

      {/* Layer 1: Ambient Rays of Light (Light beams) */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <g className="animate-rays-pulse text-[#C5A059]/20 fill-current">
            <polygon points="0,0 200,0 600,1080 300,1080" />
            <polygon points="400,0 650,0 1200,1080 900,1080" />
            <polygon points="800,0 950,0 1500,1080 1350,1080" />
          </g>
        </svg>
      </div>

      {/* Layer 2: Balinese Waterfall Loop in the far back center */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-full opacity-30 pointer-events-none flex justify-center">
        {/* Waterfall Core glow */}
        <div className="w-[12px] h-[80%] bg-gradient-to-b from-[#C5A059]/40 via-purple-500/20 to-transparent blur-md rounded-full" />
        
        {/* Waterfall Loop Layer 1 */}
        <div className="absolute top-0 w-[4px] h-[100%] overflow-hidden bg-transparent">
          <div className="w-full h-[50%] bg-gradient-to-b from-transparent via-white/50 to-transparent rounded-full animate-waterfall-loop-1" />
        </div>
        
        {/* Waterfall Loop Layer 2 */}
        <div className="absolute top-0 w-[6px] h-[100%] overflow-hidden bg-transparent">
          <div className="w-full h-[50%] bg-gradient-to-b from-transparent via-[#C5A059]/40 to-transparent rounded-full animate-waterfall-loop-2" />
        </div>
      </div>

      {/* Layer 3: Central Bali Gate Silhouette - Removed for clean, elegant layout */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-gradient-to-t from-[#C5A059]/10 to-transparent blur-3xl rounded-full opacity-40 pointer-events-none" />

      {/* Layer 4: Upper Left Golden Balinese Carved Motif (Ornament Bali) */}
      <div className="absolute top-0 left-0 w-36 md:w-56 aspect-square opacity-20 pointer-events-none animate-sway-l z-10">
        <svg className="w-full h-full text-[#C5A059] fill-current" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Stylized traditional Balinese floral carving ornament */}
          <path d="M 0 0 L 100 0 C 90 10, 80 15, 60 15 C 40 15, 30 30, 20 50 C 10 70, 5 85, 0 100 Z" />
          <path d="M 0 0 C 15 15, 20 40, 40 40 C 60 40, 50 70, 70 90" stroke="#C5A059" strokeWidth="2" fill="none" />
          <circle cx="20" cy="20" r="4" fill="#C5A059" />
          <circle cx="40" cy="15" r="3" fill="#C5A059" />
          <circle cx="15" cy="45" r="2.5" fill="#C5A059" />
        </svg>
      </div>

      {/* Layer 5: Upper Right Golden Balinese Carved Motif (Ornament Bali) */}
      <div className="absolute top-0 right-0 w-36 md:w-56 aspect-square opacity-20 pointer-events-none animate-sway-r z-10">
        <svg className="w-full h-full text-[#C5A059] fill-current" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Mirror of traditional Balinese floral carving ornament */}
          <path d="M 100 0 L 0 0 C 10 10, 20 15, 40 15 C 60 15, 70 30, 80 50 C 90 70, 95 85, 100 100 Z" />
          <path d="M 100 0 C 85 15, 80 40, 60 40 C 40 40, 50 70, 30 90" stroke="#C5A059" strokeWidth="2" fill="none" />
          <circle cx="80" cy="20" r="4" fill="#C5A059" />
          <circle cx="60" cy="15" r="3" fill="#C5A059" />
          <circle cx="85" cy="45" r="2.5" fill="#C5A059" />
        </svg>
      </div>

      {/* Layer 6: Hanging Purple Orchids & Foliage on Left Side */}
      <div className="absolute top-12 left-0 w-24 md:w-36 h-[220px] md:h-[320px] opacity-25 animate-sway-l pointer-events-none z-10">
        <svg className="w-full h-full" viewBox="0 0 100 250">
          {/* Hanging Orchid Vine stem */}
          <path d="M 10 0 Q 30 80, 20 160 T 15 240" fill="none" stroke="purple" strokeWidth="2" strokeDasharray="3 3" />
          
          {/* Stylized Purple Orchid blooms hanging down */}
          <path d="M 20 50 C 20 40, 10 30, 0 50 C 10 70, 20 60, 20 50 Z" fill="purple" />
          <path d="M 20 50 C 30 40, 40 30, 30 60 C 20 70, 20 60, 20 50 Z" fill="#9333EA" />
          <circle cx="20" cy="50" r="3" fill="#F43F5E" />

          <path d="M 25 110 C 25 100, 15 90, 5 110 C 15 130, 25 120, 25 110 Z" fill="purple" />
          <path d="M 25 110 C 35 100, 45 90, 35 120 C 25 130, 25 120, 25 110 Z" fill="#9333EA" />
          <circle cx="25" cy="110" r="3" fill="#F43F5E" />

          <path d="M 18 170 C 18 160, 8 150, -2 170 C 8 190, 18 180, 18 170 Z" fill="purple" />
          <path d="M 18 170 C 28 160, 38 150, 28 180 C 18 190, 18 180, 18 170 Z" fill="#9333EA" />
          <circle cx="18" cy="170" r="3" fill="#F43F5E" />
        </svg>
      </div>

      {/* Layer 7: Hanging Purple Orchids & Foliage on Right Side */}
      <div className="absolute top-12 right-0 w-24 md:w-36 h-[220px] md:h-[320px] opacity-25 animate-sway-r pointer-events-none z-10">
        <svg className="w-full h-full" viewBox="0 0 100 250">
          {/* Hanging Orchid Vine stem */}
          <path d="M 90 0 Q 70 80, 80 160 T 85 240" fill="none" stroke="purple" strokeWidth="2" strokeDasharray="3 3" />
          
          {/* Stylized Purple Orchid blooms hanging down */}
          <path d="M 80 50 C 80 40, 90 30, 100 50 C 90 70, 80 60, 80 50 Z" fill="purple" />
          <path d="M 80 50 C 70 40, 60 30, 70 60 C 80 70, 80 60, 80 50 Z" fill="#9333EA" />
          <circle cx="80" cy="50" r="3" fill="#F43F5E" />

          <path d="M 75 110 C 75 100, 85 90, 95 110 C 85 130, 75 120, 75 110 Z" fill="purple" />
          <path d="M 75 110 C 65 100, 55 90, 65 120 C 75 130, 75 120, 75 110 Z" fill="#9333EA" />
          <circle cx="75" cy="110" r="3" fill="#F43F5E" />

          <path d="M 82 170 C 82 160, 92 150, 102 170 C 92 190, 82 180, 82 170 Z" fill="purple" />
          <path d="M 82 170 C 72 160, 62 150, 72 180 C 82 190, 82 180, 82 170 Z" fill="#9333EA" />
          <circle cx="82" cy="170" r="3" fill="#F43F5E" />
        </svg>
      </div>
    </div>
  );
}
