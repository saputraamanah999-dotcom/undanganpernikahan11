import { motion } from 'motion/react';
import { Instagram, Heart } from 'lucide-react';
import { CoupleInfo } from '../data/weddingData';

/** Elegant gold hairline divider — replaces the old Bali PNG motifs. */
function GoldHairline({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`} aria-hidden="true">
      <span className="h-px w-24 bg-gradient-to-r from-transparent via-[#C5A059] to-transparent" />
      <span className="mx-2 w-1.5 h-1.5 rounded-full bg-[#C5A059]/70 shadow-[0_0_8px_rgba(197,160,89,0.55)]" />
      <span className="h-px w-24 bg-gradient-to-r from-transparent via-[#C5A059] to-transparent" />
    </div>
  );
}

interface CoupleSectionProps {
  selectedCouple: 'coupleA' | 'coupleB' | 'both';
  weddingData: any;
}

export default function CoupleSection({ selectedCouple, weddingData }: CoupleSectionProps) {

  const renderCoupleProfiles = (couple: CoupleInfo) => {
    return (
      <div key={couple.id} id={`couple-profile-${couple.id}`} className="space-y-12">
        {/* Top Divider — elegant gold hairline (replaces Bali motif) */}
        <GoldHairline className="-mt-2" />

        {/* Quote Block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-lg mx-auto bg-[#151515] p-6 rounded-2xl border border-[#C5A059]/20 text-center shadow-2xl relative"
        >
          {/* Quote mark ornament */}
          <span className="absolute -top-4 left-6 text-4xl text-[#C5A059]/20 font-serif font-bold">&ldquo;</span>
          <p className="font-quote text-sm md:text-base text-[#E5E5E5]/90 italic leading-relaxed px-4">
            {couple.quote}
          </p>
          <span className="font-mono text-xs text-[#C5A059] block mt-3 font-semibold tracking-wider">
            — {couple.quoteAuthor}
          </span>
          <span className="absolute -bottom-10 right-6 text-4xl text-[#C5A059]/20 font-serif font-bold">&rdquo;</span>
        </motion.div>

        {/* Groom & Bride Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center justify-center max-w-4xl mx-auto pt-6">
          {/* Groom Profile */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center text-center p-6 bg-[#151515] rounded-3xl border border-[#C5A059]/20 shadow-2xl"
          >
            {/* Groom Image Frame — Elegant Gold Oval with Float Animation */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative mb-5 group"
            >
              {/* Outer glow ring */}
              <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-[#C5A059]/30 via-[#E2C284]/10 to-[#C5A059]/30 blur-md opacity-60 animate-pulse" />
              {/* Gold bordered oval frame */}
              <div className="relative w-36 h-44 md:w-40 md:h-48 rounded-[50%] p-1.5 border-2 border-[#C5A059] shadow-xl overflow-hidden bg-[#0A0A0A]">
                <div className="absolute inset-0 rounded-[50%] border border-[#E2C284]/40 m-1 pointer-events-none z-20" />
                <img
                  src={couple.groom.avatar}
                  alt={couple.groom.fullName}
                  className="w-full h-full object-cover rounded-[50%] group-hover:scale-105 transition-all duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 rounded-[50%] bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all" />
              </div>
            </motion.div>

            {/* Groom Bio */}
            <h4 className="font-script text-2xl md:text-3xl text-[#C5A059] leading-none">
              {couple.groom.nickname}
            </h4>
            <span className="text-[11px] font-mono tracking-widest text-[#E5E5E5] uppercase font-bold mt-1.5 mb-3">
              {couple.groom.fullName}
            </span>

            <p className="text-xs md:text-sm text-[#E5E5E5]/80 leading-relaxed font-sans max-w-xs">
              {couple.groom.childOrdinal} dari pasangan:
              <span className="block font-semibold text-[#F5F5F5] mt-1">
                Bp. {couple.groom.fatherName}
              </span>
              <span className="block text-[10px] text-gray-500 font-serif">&</span>
              <span className="block font-semibold text-[#F5F5F5]">
                Ibu {couple.groom.motherName}
              </span>
            </p>

            {couple.groom.instagram && (
              <a
                href={`https://instagram.com/${couple.groom.instagram.substring(1)}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex items-center space-x-1.5 py-1.5 px-3 rounded-full bg-[#0A0A0A] border border-[#C5A059]/30 text-[#C5A059] text-xs font-semibold tracking-wide hover:bg-[#C5A059] hover:text-black hover:scale-105 transition-all"
              >
                <Instagram className="w-3.5 h-3.5" />
                <span>{couple.groom.instagram}</span>
              </a>
            )}
          </motion.div>

          {/* Separation Heart for mobile */}
          <div className="flex md:hidden items-center justify-center py-2 text-[#C5A059]/40">
            <Heart className="w-6 h-6 fill-[#C5A059]/10" />
          </div>

          {/* Bride Profile */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center text-center p-6 bg-[#151515] rounded-3xl border border-[#C5A059]/20 shadow-2xl"
          >
            {/* Bride Image Frame — Elegant Gold Oval with Float Animation */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="relative mb-5 group"
            >
              {/* Outer glow ring */}
              <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-[#C5A059]/30 via-[#E2C284]/10 to-[#C5A059]/30 blur-md opacity-60 animate-pulse" />
              {/* Gold bordered oval frame */}
              <div className="relative w-36 h-44 md:w-40 md:h-48 rounded-[50%] p-1.5 border-2 border-[#C5A059] shadow-xl overflow-hidden bg-[#0A0A0A]">
                <div className="absolute inset-0 rounded-[50%] border border-[#E2C284]/40 m-1 pointer-events-none z-20" />
                <img
                  src={couple.bride.avatar}
                  alt={couple.bride.fullName}
                  className="w-full h-full object-cover rounded-[50%] group-hover:scale-105 transition-all duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 rounded-[50%] bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all" />
              </div>
            </motion.div>

            {/* Bride Bio */}
            <h4 className="font-script text-2xl md:text-3xl text-[#C5A059] leading-none">
              {couple.bride.nickname}
            </h4>
            <span className="text-[11px] font-mono tracking-widest text-[#E5E5E5] uppercase font-bold mt-1.5 mb-3">
              {couple.bride.fullName}
            </span>

            <p className="text-xs md:text-sm text-[#E5E5E5]/80 leading-relaxed font-sans max-w-xs">
              {couple.bride.childOrdinal} dari pasangan:
              <span className="block font-semibold text-[#F5F5F5] mt-1">
                Bp. {couple.bride.fatherName}
              </span>
              <span className="block text-[10px] text-gray-500 font-serif">&</span>
              <span className="block font-semibold text-[#F5F5F5]">
                Ibu {couple.bride.motherName}
              </span>
            </p>

            {couple.bride.instagram && (
              <a
                href={`https://instagram.com/${couple.bride.instagram.substring(1)}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex items-center space-x-1.5 py-1.5 px-3 rounded-full bg-[#0A0A0A] border border-[#C5A059]/30 text-[#C5A059] text-xs font-semibold tracking-wide hover:bg-[#C5A059] hover:text-black hover:scale-105 transition-all"
              >
                <Instagram className="w-3.5 h-3.5" />
                <span>{couple.bride.instagram}</span>
              </a>
            )}
          </motion.div>
        </div>

        {/* Bottom Divider — elegant gold hairline (replaces Bali motif) */}
        <GoldHairline className="-mb-2" />
      </div>
    );
  };

  return (
    <div id="couple-profiles-section" className="py-20 md:py-28 px-4 max-w-5xl mx-auto space-y-16">
      {/* Dynamic titles */}
      {selectedCouple === 'both' ? (
        <>
          <div className="text-center mb-8">
            <span className="font-mono text-xs tracking-widest text-[#C5A059] uppercase block mb-1">
              KEDUA PASANGAN
            </span>
            <h3 className="font-serif text-2xl md:text-3xl lg:text-4xl font-semibold text-[#F5F5F5]">
              Pasangan Pengantin Berbahagia
            </h3>
            <p className="mt-2 text-xs md:text-sm text-[#E5E5E5]/70 max-w-md mx-auto italic">
              Dengan penuh kesyukuran dan limpahan karunia, kami mengumumkan persatuan dua pasang mempelai mulia.
            </p>
          </div>

          {/* Couple A Profile */}
          <div className="space-y-6">
            <div className="flex items-center justify-center space-x-3 text-[#C5A059] font-serif font-bold text-lg md:text-xl">
              <span className="h-[1px] w-12 bg-[#C5A059]/30" />
              <span>PASANGAN I : ARIA & BELLA</span>
              <span className="h-[1px] w-12 bg-[#C5A059]/30" />
            </div>
            {renderCoupleProfiles(weddingData.coupleA)}
          </div>

          {/* Divider */}
          <div className="flex items-center justify-center py-6">
            <div className="flex items-center space-x-4 text-[#C5A059]/30">
              <span className="h-[1px] w-24 bg-[#C5A059]/20" />
              <Heart className="w-5 h-5 fill-[#C5A059]/10 text-[#C5A059]/40" />
              <span className="h-[1px] w-24 bg-[#C5A059]/20" />
            </div>
          </div>

          {/* Couple B Profile */}
          <div className="space-y-6">
            <div className="flex items-center justify-center space-x-3 text-[#C5A059] font-serif font-bold text-lg md:text-xl">
              <span className="h-[1px] w-12 bg-[#C5A059]/30" />
              <span>PASANGAN II : DEVAN & ELINA</span>
              <span className="h-[1px] w-12 bg-[#C5A059]/30" />
            </div>
            {renderCoupleProfiles(weddingData.coupleB)}
          </div>
        </>
      ) : (
        <>
          <div className="text-center mb-8">
            <span className="font-mono text-xs tracking-widest text-[#C5A059] uppercase block mb-1">
              PROFIL MEMPELAI
            </span>
            <h3 className="font-serif text-2xl md:text-3xl font-semibold text-[#F5F5F5]">
              Mempelai Berbahagia
            </h3>
          </div>
          {selectedCouple === 'coupleA'
            ? renderCoupleProfiles(weddingData.coupleA)
            : renderCoupleProfiles(weddingData.coupleB)
          }
        </>
      )}
    </div>
  );
}
