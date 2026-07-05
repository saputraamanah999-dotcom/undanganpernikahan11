import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Heart, Lock } from 'lucide-react';
import Countdown from './Countdown';
import PetalCanvas from './PetalCanvas';

interface MaintenanceScreenProps {
  onAdminClick: () => void;
  weddingState: any;
  currentTheme: string;
}

export default function MaintenanceScreen({ onAdminClick, weddingState, currentTheme }: MaintenanceScreenProps) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0A0A0A] flex flex-col items-center justify-center p-4 text-center selection:bg-[#C5A059]/20 selection:text-white">
      {/* Bali Background with dark overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url(${weddingState.bgCoverUrl || '/images/BALI-BACKGROUND.jpg'})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/70 to-black/95" />

      {/* Falling Petals Background */}
      <PetalCanvas theme={currentTheme} />

      {/* Decorative Gold Borders */}
      <div className="fixed inset-3 md:inset-6 border border-[#C5A059]/20 pointer-events-none z-40" />
      <div className="fixed inset-4.5 md:inset-8 border border-[#C5A059]/10 pointer-events-none z-40" />

      <div className="relative z-20 max-w-lg mx-auto space-y-8 p-6 md:p-8 rounded-3xl bg-[#151515]/90 backdrop-blur-md border border-[#C5A059]/25 shadow-2xl">
        {/* Bali Monogram Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-[#0A0A0A] border border-[#C5A059]/40 flex items-center justify-center overflow-hidden shadow-xl">
            <img
              src={weddingState.logoUrl || '/images/BALI-ICON.webp'}
              alt="Wedding Monogram"
              className="w-full h-full object-contain p-1.5"
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
          </div>
        </div>

        {/* Decorative Top Ribbon */}
        <div className="flex items-center justify-center space-x-1.5 text-[#C5A059]/60">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span className="h-[1px] w-12 bg-[#C5A059]/30" />
          <Heart className="w-5 h-5 fill-[#C5A059]/10 text-[#C5A059]/60" />
          <span className="h-[1px] w-12 bg-[#C5A059]/30" />
          <Sparkles className="w-4 h-4 animate-pulse" />
        </div>

        {/* Header Text */}
        <div className="space-y-3">
          <span className="font-mono text-xs tracking-[0.25em] uppercase text-[#C5A059] font-bold">
            PENGUMUMAN RESMI
          </span>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-widest text-[#F5F5F5] uppercase">
            {weddingState.title || "The Joint Wedding"}
          </h1>
        </div>

        {/* Middle Status / Main Message */}
        <div className="py-4 space-y-3.5 border-y border-[#C5A059]/15">
          <p className="font-serif text-lg md:text-xl text-[#C5A059] font-medium leading-normal italic">
            &ldquo;Segera Hadir / Coming Soon&rdquo;
          </p>
          <p className="text-xs md:text-sm text-[#E5E5E5]/90 leading-relaxed font-sans">
            Undangan suci pernikahan bersama ini sedang dalam proses finalisasi penyesuaian materi dan akan segera dipublikasikan secara resmi dalam waktu dekat.
          </p>
        </div>

        {/* Countdown */}
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-mono tracking-widest text-gray-500 font-bold block">
            Hitung Mundur Menuju Hari Bahagia
          </span>
          <div className="scale-95 md:scale-100 overflow-hidden rounded-2xl bg-black/40 border border-white/5 p-2.5">
            <Countdown />
          </div>
        </div>

        {/* Footer Admin Trigger */}
        <div className="pt-2 flex flex-col items-center justify-center space-y-4">
          <p className="text-[10px] text-gray-500 font-mono">
            © 2026 {weddingState.coupleA?.groom?.nickname || "Aria"} & {weddingState.coupleA?.bride?.nickname || "Bella"} | {weddingState.coupleB?.groom?.nickname || "Devan"} & {weddingState.coupleB?.bride?.nickname || "Elina"}
          </p>

          <button
            onClick={onAdminClick}
            className="inline-flex items-center space-x-1.5 py-1.5 px-3.5 rounded-full border border-[#C5A059]/30 bg-black hover:bg-[#C5A059] text-[#C5A059] hover:text-black text-[10px] font-mono tracking-widest uppercase transition-all duration-300 cursor-pointer shadow-md hover:scale-105 active:scale-95"
          >
            <Lock className="w-3 h-3" />
            <span>Akses Administrator</span>
          </button>
        </div>
      </div>
    </div>
  );
}
