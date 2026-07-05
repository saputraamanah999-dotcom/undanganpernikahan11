import { useEffect, useState } from 'react';
import { MailOpen, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

interface EnvelopeProps {
  onOpen: () => void;
  weddingData: any;
}

export default function Envelope({ onOpen, weddingData }: EnvelopeProps) {
  const [guestName, setGuestName] = useState('Tamu Undangan');
  const [isOpen, setIsOpen] = useState(false);
  const [isOpeningSequence, setIsOpeningSequence] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const to = params.get('to');
    if (to) {
      setGuestName(to.replace(/\+/g, ' '));
    }
  }, []);

  const fireGoldenConfetti = () => {
    try {
      const colors = ['#C5A059', '#E2C284', '#F5E1B8', '#B8860B', '#D4AF37'];
      // First burst from the center
      confetti({
        particleCount: 80,
        spread: 75,
        origin: { y: 0.6 },
        colors,
        startVelocity: 35,
        gravity: 0.9,
        ticks: 220,
        shapes: ['circle'],
        scalar: 0.9
      });
      // Side bursts for an elegant "petals" effect
      setTimeout(() => {
        confetti({
          particleCount: 40,
          angle: 60,
          spread: 60,
          origin: { x: 0, y: 0.65 },
          colors,
          gravity: 0.8,
          ticks: 200
        });
        confetti({
          particleCount: 40,
          angle: 120,
          spread: 60,
          origin: { x: 1, y: 0.65 },
          colors,
          gravity: 0.8,
          ticks: 200
        });
      }, 200);
      // Final sparkle from above
      setTimeout(() => {
        confetti({
          particleCount: 50,
          spread: 100,
          origin: { y: 0 },
          colors,
          gravity: 0.5,
          ticks: 280,
          startVelocity: 25
        });
      }, 500);
    } catch (err) {
      console.warn('Confetti failed', err);
    }
  };

  const handleOpen = () => {
    if (isOpen || isOpeningSequence) return;
    setIsOpeningSequence(true);
    setIsOpen(true);
    fireGoldenConfetti();

    // Sequence timing:
    // 1. Top flap folds up (~1s)
    // 2. Card slides up (~1.2s)
    // 3. Whole cover fades into main content (~0.8s)
    setTimeout(() => {
      onOpen();
    }, 2200);
  };

  return (
    <div
      id="envelope-cover-container"
      className="fixed inset-0 z-50 flex flex-col items-center justify-between overflow-hidden bg-[#0A0A0A] py-12 px-4 select-none"
      style={{
        background: `radial-gradient(circle at center, #1a1410 0%, #050505 70%, #000000 100%), url(${weddingData.bgCoverUrl || '/images/BALI-BACKGROUND.jpg'})`,
        backgroundSize: 'cover, cover',
        backgroundPosition: 'center, center',
        backgroundBlendMode: 'multiply, normal'
      }}
    >
      {/* Decorative Gold Borders (Design Theme Style) */}
      <div className="absolute inset-4 border border-[#C5A059]/25 pointer-events-none z-10" />
      <div className="absolute inset-5.5 border border-[#C5A059]/10 pointer-events-none z-10" />

      {/* Header Section */}
      <motion.div
        id="envelope-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="text-center max-w-md z-20 mt-4"
      >
        <span className="font-mono text-xs tracking-widest text-[#C5A059]/80 uppercase block mb-3">
          The Wedding Invitation
        </span>
        <h1 className="font-script text-5xl md:text-6xl text-[#C5A059] leading-none mb-1">
          {weddingData.coupleA?.groom?.nickname || "Aria"} & {weddingData.coupleA?.bride?.nickname || "Bella"}
        </h1>
        <div className="flex items-center justify-center my-3 space-x-2 text-[#C5A059]/40">
          <span className="h-[1px] w-12 bg-[#C5A059]/20" />
          <Heart className="w-3.5 h-3.5 fill-[#C5A059]/10 animate-pulse text-[#C5A059]" />
          <span className="h-[1px] w-12 bg-[#C5A059]/20" />
        </div>
        <h1 className="font-script text-5xl md:text-6xl text-[#C5A059] leading-none mt-1">
          {weddingData.coupleB?.groom?.nickname || "Devan"} & {weddingData.coupleB?.bride?.nickname || "Elina"}
        </h1>
        <p className="mt-4 font-serif text-sm italic text-[#C5A059]">
          {weddingData.dateText}
        </p>
      </motion.div>

      {/* The Interactive Envelope (CSS 3D Transforms) */}
      <div className="relative w-full max-w-[340px] md:max-w-[420px] aspect-[4/3] my-6 flex items-center justify-center z-20">
        <div
          id="css-envelope"
          className="relative w-full h-full bg-[#1A1A1A] rounded-lg shadow-2xl overflow-visible transition-all duration-1000 ease-in-out cursor-pointer"
          style={{
            perspective: '1000px',
            transformStyle: 'preserve-3d',
            boxShadow: '0 25px 50px -12px rgba(197, 160, 89, 0.15)'
          }}
          onClick={handleOpen}
        >
          {/* Inside Background of Envelope */}
          <div className="absolute inset-0 bg-[#0F0F0F] rounded-lg overflow-hidden border border-[#C5A059]/20">
            {/* Pattern lining inside */}
            <div className="w-full h-full opacity-10 bg-[radial-gradient(#C5A059_1px,transparent_1px)] [background-size:16px_16px]" />
          </div>

          {/* Invitation Card (Slides Up) */}
          <motion.div
            id="envelope-card"
            initial={{ y: 0, scale: 0.95 }}
            animate={
              isOpen
                ? { y: -160, scale: 1, zIndex: 30 }
                : { y: 0, scale: 0.95, zIndex: 10 }
            }
            transition={{
              delay: 0.8,
              duration: 1.2,
              ease: 'easeInOut',
            }}
            className="absolute left-4 right-4 top-4 bottom-4 bg-[#151515] rounded shadow-inner border border-[#C5A059]/30 flex flex-col items-center justify-center p-4 text-center select-none"
            style={{
              backgroundImage: 'radial-gradient(#1A1A1A 70%, #111111 100%)',
              boxShadow: 'inset 0 0 40px rgba(197, 160, 89, 0.05), 0 4px 20px rgba(0,0,0,0.5)'
            }}
          >
            <div className="border border-[#C5A059]/20 p-4 w-full h-full flex flex-col items-center justify-between rounded">
              <span className="font-mono text-[9px] tracking-widest text-[#C5A059] uppercase">
                Save the Date
              </span>
              <div className="my-1">
                <p className="font-script text-2xl text-[#F5F5F5] leading-none">
                  {weddingData.coupleA?.groom?.nickname || "Aria"} & {weddingData.coupleA?.bride?.nickname || "Bella"}
                </p>
                <p className="font-serif text-[10px] text-[#C5A059] my-0.5">&</p>
                <p className="font-script text-2xl text-[#F5F5F5] leading-none">
                  {weddingData.coupleB?.groom?.nickname || "Devan"} & {weddingData.coupleB?.bride?.nickname || "Elina"}
                </p>
              </div>
              <div className="text-[10px] text-[#E5E5E5]/70 font-mono">
                {weddingData.dateText}
              </div>
            </div>
          </motion.div>

          {/* Left Flap */}
          <div className="absolute left-0 bottom-0 top-0 w-1/2 bg-[#1E1E1E] rounded-l-lg border-r border-black/30"
            style={{
              clipPath: 'polygon(0 0, 100% 50%, 0 100%)',
              zIndex: 20,
              boxShadow: '2px 0 10px rgba(0,0,0,0.2)'
            }}
          />

          {/* Right Flap */}
          <div className="absolute right-0 bottom-0 top-0 w-1/2 bg-[#1E1E1E] rounded-r-lg border-l border-black/30"
            style={{
              clipPath: 'polygon(100% 0, 0 50%, 100% 100%)',
              zIndex: 20,
              boxShadow: '-2px 0 10px rgba(0,0,0,0.2)'
            }}
          />

          {/* Bottom Flap */}
          <div className="absolute left-0 right-0 bottom-0 h-2/3 bg-[#171717] rounded-b-lg border-t border-black/10"
            style={{
              clipPath: 'polygon(0 100%, 50% 0, 100% 100%)',
              zIndex: 22,
              boxShadow: '0 -4px 15px rgba(0,0,0,0.2)'
            }}
          />

          {/* Top Flap (Flips Open) */}
          <div
            id="envelope-top-flap"
            className="absolute left-0 right-0 top-0 h-2/3 bg-[#242424] rounded-t-lg transition-transform duration-800"
            style={{
              clipPath: 'polygon(0 0, 50% 100%, 100% 0)',
              transformOrigin: 'top',
              zIndex: isOpen ? 5 : 25,
              transform: isOpen ? 'rotateX(180deg) translateY(-2px)' : 'rotateX(0deg)',
              boxShadow: isOpen ? 'none' : '0 10px 15px rgba(0,0,0,0.3)'
            }}
          />

          {/* Gold Wax Seal using BALI-ICON (Fades out when open) */}
          <AnimatePresence>
            {!isOpen && (
              <motion.div
                key="seal"
                exit={{ opacity: 0, scale: 0.7, y: 10 }}
                transition={{ duration: 0.4 }}
                className="absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2 z-28 flex flex-col items-center justify-center cursor-pointer"
              >
                <div
                  className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#E2C284] via-[#C5A059] to-[#9c783c] shadow-xl border-2 border-[#E2C284]/50 flex items-center justify-center animate-pulse hover:scale-110 active:scale-95 transition-transform"
                  style={{ boxShadow: '0 0 25px rgba(197, 160, 89, 0.5)' }}
                >
                  <div className="w-16 h-16 rounded-full border border-[#E2C284]/40 flex items-center justify-center overflow-hidden bg-[#0A0A0A]">
                    <img
                      src={weddingData.logoUrl || '/images/BALI-ICON.webp'}
                      alt="Wedding Seal"
                      className="w-full h-full object-contain p-1"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                  {/* Micro reflection effect on seal */}
                  <div className="absolute top-1 left-2 w-3 h-3 rounded-full bg-white/30 blur-xs" />
                </div>
                <span className="mt-2 text-[9px] font-mono tracking-widest text-[#C5A059]/80 uppercase">
                  Ketuk untuk Membuka
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Guest Greeting & CTA Section */}
      <motion.div
        id="envelope-cta"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 1 }}
        className="text-center w-full max-w-sm px-4 z-20 mb-4"
      >
        <p className="text-xs tracking-wider text-[#E5E5E5]/70 uppercase font-mono mb-1">
          Kepada Yth. Bapak/Ibu/Saudara/i:
        </p>
        <div className="bg-[#151515] backdrop-blur-md py-3 px-5 rounded-lg border border-[#C5A059]/30 shadow-lg inline-block min-w-[240px] mb-6">
          <h2 className="font-serif text-lg md:text-xl font-semibold text-[#F5F5F5]">
            {guestName}
          </h2>
        </div>

        <button
          id="btn-open-invitation"
          onClick={handleOpen}
          disabled={isOpeningSequence}
          className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#C5A059] via-[#dfbf82] to-[#C5A059] hover:from-[#dfbf82] hover:to-[#C5A059] text-black font-semibold tracking-wider text-sm flex items-center justify-center space-x-3 shadow-xl hover:scale-103 active:scale-97 transition-all duration-300 select-none group"
        >
          <MailOpen className="w-4 h-4 group-hover:animate-bounce" />
          <span>{isOpeningSequence ? 'Membuka Undangan...' : 'BUKA UNDANGAN'}</span>
        </button>

        <p className="mt-4 text-[11px] text-[#E5E5E5]/50 max-w-xs mx-auto">
          *Ketuk amplop atau tombol di atas untuk membuka undangan dan memutar musik latar romantis.
        </p>
      </motion.div>
    </div>
  );
}
