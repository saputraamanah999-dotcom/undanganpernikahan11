import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Check, Gift, QrCode, Landmark } from 'lucide-react';
import { weddingData } from '../data/weddingData';

interface GiftSectionProps {
  selectedCouple: 'coupleA' | 'coupleB' | 'both';
  weddingData: any;
}

export default function GiftSection({ selectedCouple, weddingData }: GiftSectionProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeQrisUrl, setActiveQrisUrl] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Determine gift details dynamically based on selected couple
  const currentCoupleGift = selectedCouple === 'coupleB' ? weddingData.coupleB?.gift : weddingData.coupleA?.gift;

  const bankName = currentCoupleGift?.bankName || "Bank Central Asia (BCA)";
  const accountNumber = currentCoupleGift?.accountNumber || "8012345678";
  const accountHolder = currentCoupleGift?.accountHolder || "SAPUTRA DEVELOPER";
  const qrisUrl = currentCoupleGift?.qrisUrl || "https://images.unsplash.com/photo-1595079676339-1534801ad6cf?auto=format&fit=crop&q=80&w=300";

  return (
    <div id="wedding-gift-section" className="py-12 px-4 max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <span className="font-mono text-xs tracking-widest text-[#C5A059] uppercase block mb-1">
          WEDDING GIFT
        </span>
        <h3 className="font-serif text-2xl md:text-3xl font-semibold text-[#F5F5F5]">
          Kirim Kado / Amplop Digital
        </h3>
        <p className="mt-2 text-xs md:text-sm text-[#E5E5E5]/70 max-w-md mx-auto italic">
          Doa restu Anda adalah karunia terindah. Namun jika ingin mengirimkan tanda kasih kepada keluarga besar kami, Anda dapat menyalurkannya melalui satu pintu rekening keluarga berikut:
        </p>
      </div>

      {/* Single Unified Bank Card */}
      <div className="max-w-md mx-auto">
        <motion.div
          id="unified-family-gift-card"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="w-full"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1C1C1C] via-[#0F0F0F] to-[#121212] p-6 text-white border border-[#C5A059]/30 shadow-2xl flex flex-col justify-between aspect-[1.6/1]">
            {/* Subtle premium card pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#C5A059_1px,transparent_1px)] opacity-[0.06] [background-size:16px_16px] pointer-events-none" />
            <div className="absolute -right-16 -top-16 w-40 h-40 bg-[#C5A059]/5 rounded-full blur-3xl pointer-events-none" />
            
            {/* Chip and logo mockup */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Landmark className="w-5 h-5 text-[#C5A059]" />
                <span className="font-mono text-xs font-semibold tracking-wider uppercase text-[#C5A059]">
                  {bankName}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <Gift className="w-6 h-6 text-[#C5A059] opacity-80" />
                <span className="text-[7px] font-mono uppercase tracking-widest text-[#C5A059] mt-1 font-bold">
                  FAMILY CARD
                </span>
              </div>
            </div>

            {/* Account Details */}
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#C5A059]/60 block">
                Nomor Rekening Keluarga Besar
              </span>
              <div className="flex items-center justify-between space-x-2 mt-1">
                <span className="font-mono text-lg md:text-xl font-bold tracking-wider text-[#F5F5F5]">
                  {accountNumber}
                </span>
                <button
                  id="btn-copy-unified-bank"
                  onClick={() => copyToClipboard(accountNumber, 'unified')}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-[#C5A059] hover:text-white cursor-pointer"
                  title="Salin Nomor Rekening"
                >
                  <AnimatePresence mode="wait">
                    {copiedId === 'unified' ? (
                      <motion.div key="check" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
                        <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                      </motion.div>
                    ) : (
                      <motion.div key="copy" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
                        <Copy className="w-4 h-4" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            </div>

            {/* Footer of Card */}
            <div className="flex items-end justify-between mt-4 pt-4 border-t border-white/10">
              <div>
                <span className="text-[9px] uppercase font-mono tracking-widest text-[#C5A059]/60 block leading-none">
                  Atas Nama (Kepala Keluarga)
                </span>
                <span className="font-serif text-sm font-semibold tracking-wide text-[#F5F5F5] block mt-1">
                  {accountHolder}
                </span>
              </div>
              
              {qrisUrl && (
                <button
                  id="btn-qris-unified"
                  onClick={() => setActiveQrisUrl(qrisUrl)}
                  className="flex items-center space-x-1 py-1 px-3 rounded-full bg-[#C5A059] hover:bg-[#b38e4b] active:scale-95 text-black text-[10px] font-bold tracking-wider transition-all cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>QRIS</span>
                </button>
              )}
            </div>
          </div>

          {/* Unified Caption */}
          <p className="mt-3 text-center text-xs text-[#E5E5E5]/50 italic font-medium">
            *Satu pintu rekening untuk seluruh rangkaian acara pernikahan keluarga besar {accountHolder}.
          </p>
        </motion.div>
      </div>

      {/* QRIS Modal Overlay */}
      <AnimatePresence>
        {activeQrisUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveQrisUrl(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#151515] rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl border border-[#C5A059]/30 cursor-default"
            >
              <h4 className="font-serif text-base font-bold text-[#F5F5F5] mb-1">
                Scan QRIS Kado Digital
              </h4>
              <p className="text-[11px] text-[#E5E5E5]/70 mb-4 italic">
                Simpan atau langsung scan QRIS ini menggunakan aplikasi M-Banking atau E-Wallet Anda.
              </p>
              
              <div className="mx-auto w-48 h-48 bg-[#0A0A0A] rounded-xl p-2 border border-[#C5A059]/20 overflow-hidden flex items-center justify-center shadow-inner">
                <img
                  src={activeQrisUrl}
                  alt="QRIS Code"
                  className="w-full h-full object-cover rounded-lg"
                  referrerPolicy="no-referrer"
                />
              </div>

              <button
                id="btn-close-qris-modal"
                onClick={() => setActiveQrisUrl(null)}
                className="mt-5 w-full py-2.5 bg-[#C5A059] hover:bg-[#b38e4b] text-black rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shadow-md"
              >
                TUTUP
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
