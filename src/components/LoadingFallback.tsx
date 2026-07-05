import React from 'react';
import { motion } from 'motion/react';

export default function LoadingFallback() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0A0A] text-[#C5A059] px-4 select-none">
      {/* Bali Background Subtle Tint */}
      <div
        className="absolute inset-0 opacity-10 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: 'url(/images/BALI-BACKGROUND.jpg)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/90 pointer-events-none" />

      <div className="relative flex flex-col items-center justify-center space-y-6">
        {/* Bali Monogram Icon with elegant rotating gold ring */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center"
        >
          {/* Outer rotating dashed ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-2 border-dashed border-[#C5A059]/40"
          />
          {/* Inner pulsing ring */}
          <div className="absolute inset-2 rounded-full border border-[#C5A059]/60 animate-pulse" />
          {/* Monogram image */}
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-black flex items-center justify-center overflow-hidden border border-[#C5A059]/40">
            <img
              src="/images/BALI-ICON.webp"
              alt="Wedding Loading"
              className="w-full h-full object-contain p-1"
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
          </div>
          {/* Gold glow */}
          <div className="absolute inset-0 rounded-full bg-[#C5A059]/10 blur-xl animate-pulse pointer-events-none" />
        </motion.div>

        {/* Pulsing monogram / text */}
        <div className="text-center space-y-1.5">
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="font-display text-lg tracking-[0.3em] font-semibold text-[#C5A059] block"
          >
            KRAMA BALI
          </motion.span>
          <p className="font-sans text-[10px] tracking-widest text-gray-500 uppercase">
            Memuat Undangan Suci...
          </p>
        </div>
      </div>
    </div>
  );
}
