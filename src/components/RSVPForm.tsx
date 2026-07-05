import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Edit2, Users, Calendar, AlertCircle } from 'lucide-react';
import { submitRSVPToFirebase } from '../lib/firebaseService';

interface RSVPData {
  id: string;
  name: string;
  guestsCount: number;
  coupleChoice: 'coupleA' | 'coupleB' | 'both';
  ceremonyChoice: 'akad' | 'resepsi' | 'both';
  status: 'hadir' | 'tidak_hadir';
  wishes: string;
  createdAt: string;
}

export default function RSVPForm() {
  const [formData, setFormData] = useState({
    name: '',
    guestsCount: 1,
    coupleChoice: 'both' as 'coupleA' | 'coupleB' | 'both',
    ceremonyChoice: 'both' as 'akad' | 'resepsi' | 'both',
    status: 'hadir' as 'hadir' | 'tidak_hadir',
    wishes: ''
  });

  const [submittedRSVP, setSubmittedRSVP] = useState<RSVPData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Check if RSVP is already stored in localStorage
  useEffect(() => {
    const stored = localStorage.getItem('wedding_my_rsvp');
    if (stored) {
      try {
        setSubmittedRSVP(JSON.parse(stored));
      } catch (e) {
        console.error("Error reading stored RSVP", e);
      }
    }

    // Try to auto-populate name from URL search parameter '?to=Name'
    const params = new URLSearchParams(window.location.search);
    const to = params.get('to');
    if (to) {
      setFormData(prev => ({ ...prev, name: to.replace(/\+/g, ' ') }));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'guestsCount' ? parseInt(value) || 1 : value
    }));
  };

  const handleStatusChange = (status: 'hadir' | 'tidak_hadir') => {
    setFormData(prev => ({ ...prev, status }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Silakan masukkan nama Anda.');
      return;
    }

    setIsSubmitting(true);

    try {
      const rsvp: RSVPData = {
        id: submittedRSVP?.id || Math.random().toString(36).substring(2, 9),
        name: formData.name.trim(),
        guestsCount: formData.status === 'hadir' ? formData.guestsCount : 0,
        coupleChoice: formData.coupleChoice,
        ceremonyChoice: formData.ceremonyChoice,
        status: formData.status,
        wishes: formData.wishes.trim(),
        createdAt: new Date().toISOString()
      };

      // Submit to Firebase
      await submitRSVPToFirebase(rsvp);

      localStorage.setItem('wedding_my_rsvp', JSON.stringify(rsvp));
      setSubmittedRSVP(rsvp);
      setIsSubmitting(false);

      // Trigger custom event so Guestbook can fetch new wishes automatically
      if (rsvp.wishes) {
        const event = new CustomEvent('new_wish_submitted', { detail: rsvp });
        window.dispatchEvent(event);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Gagal mengirim RSVP. Silakan coba lagi.');
      setIsSubmitting(false);
    }
  };

  const handleEdit = () => {
    if (submittedRSVP) {
      setFormData({
        name: submittedRSVP.name,
        guestsCount: submittedRSVP.status === 'hadir' ? submittedRSVP.guestsCount : 1,
        coupleChoice: submittedRSVP.coupleChoice,
        ceremonyChoice: submittedRSVP.ceremonyChoice,
        status: submittedRSVP.status,
        wishes: submittedRSVP.wishes
      });
      setSubmittedRSVP(null);
    }
  };

  const getCoupleChoiceLabel = (choice: 'coupleA' | 'coupleB' | 'both') => {
    if (choice === 'coupleA') return 'Pernikahan Aria & Bella';
    if (choice === 'coupleB') return 'Pernikahan Devan & Elina';
    return 'Kedua Pernikahan';
  };

  const getCeremonyLabel = (choice: 'akad' | 'resepsi' | 'both') => {
    if (choice === 'akad') return 'Hanya Akad Nikah';
    if (choice === 'resepsi') return 'Hanya Resepsi';
    return 'Kedua Rangkaian (Akad & Resepsi)';
  };

  return (
    <div id="rsvp-section" className="py-12 px-4 max-w-xl mx-auto">
      <div className="text-center mb-8">
        <span className="font-mono text-xs tracking-widest text-[#C5A059] uppercase block mb-1">
          RESERVASI & RSVP
        </span>
        <h3 className="font-serif text-2xl md:text-3xl font-semibold text-[#F5F5F5]">
          Konfirmasi Kehadiran
        </h3>
        <p className="mt-2 text-xs md:text-sm text-[#E5E5E5]/70 max-w-md mx-auto italic">
          Bantu kami mempersiapkan kenyamanan acara dengan mengisi form di bawah ini.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {submittedRSVP ? (
          /* RSVP Confirmed Card */
          <motion.div
            key="confirmed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#151515] rounded-2xl p-6 md:p-8 border border-[#C5A059]/20 text-center shadow-2xl relative overflow-hidden"
          >
            {/* Top decorative badge */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#C5A059] to-[#E2C284]" />
            
            <div className="mx-auto w-12 h-12 bg-[#0A0A0A] border border-[#C5A059]/30 rounded-full flex items-center justify-center text-[#C5A059] mb-4 shadow-sm">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>

            <h4 className="font-serif text-lg md:text-xl font-semibold text-[#F5F5F5]">
              Konfirmasi Terkirim!
            </h4>
            <p className="mt-2 text-xs md:text-sm text-[#E5E5E5]/80 max-w-sm mx-auto">
              Terima kasih <strong>{submittedRSVP.name}</strong>, tanggapan Anda telah tercatat dengan aman.
            </p>

            {/* Response Details Summary */}
            <div className="mt-6 p-4 rounded-xl bg-[#0A0A0A] border border-[#C5A059]/15 text-left text-xs md:text-sm space-y-3.5 text-[#E5E5E5]/90">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#C5A059]" />
                <span>
                  Status:{' '}
                  <span className={`font-semibold uppercase tracking-wider text-[11px] px-2.5 py-0.5 rounded-full ${submittedRSVP.status === 'hadir' ? 'bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30' : 'bg-red-950/30 text-red-400 border border-red-900/30'}`}>
                    {submittedRSVP.status === 'hadir' ? 'Konfirmasi Hadir' : 'Tidak Bisa Hadir'}
                  </span>
                </span>
              </div>
              
              {submittedRSVP.status === 'hadir' && (
                <>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-[#C5A059]" />
                    <span>Jumlah Tamu: <strong>{submittedRSVP.guestsCount} Orang</strong></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-[#C5A059]" />
                    <span>Diundang Ke: <strong>{getCoupleChoiceLabel(submittedRSVP.coupleChoice)}</strong></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-[#C5A059]" />
                    <span>Sesi Acara: <strong>{getCeremonyLabel(submittedRSVP.ceremonyChoice)}</strong></span>
                  </div>
                </>
              )}

              {submittedRSVP.wishes && (
                <div className="mt-2 pt-2 border-t border-[#C5A059]/10 italic text-[#C5A059]/90">
                  &ldquo;{submittedRSVP.wishes}&rdquo;
                </div>
              )}
            </div>

            <button
              id="btn-edit-rsvp"
              onClick={handleEdit}
              className="mt-6 inline-flex items-center space-x-2 py-2 px-5 rounded-full bg-[#0A0A0A] border border-[#C5A059]/40 text-[#C5A059] hover:bg-[#C5A059] hover:text-black hover:scale-105 active:scale-95 text-xs font-semibold tracking-wide shadow-sm transition-all"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Ubah Tanggapan</span>
            </button>
          </motion.div>
        ) : (
          /* Interactive RSVP Form */
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            className="bg-[#151515] rounded-2xl p-6 md:p-8 border border-[#C5A059]/20 shadow-2xl space-y-5"
          >
            {errorMsg && (
              <div className="flex items-center space-x-2 p-3 bg-red-950/30 text-red-400 rounded-lg text-xs font-medium border border-red-900/30">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Name Input */}
            <div id="rsvp-field-name">
              <label htmlFor="name" className="block text-xs font-bold text-[#C5A059] uppercase tracking-wider mb-2">
                Nama Lengkap
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Masukkan nama lengkap Anda"
                className="w-full px-4 py-3 rounded-xl border border-[#C5A059]/30 bg-[#0A0A0A] text-[#F5F5F5] text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] transition-all placeholder:text-gray-600"
                required
              />
            </div>

            {/* Attendance Switcher */}
            <div>
              <span className="block text-xs font-bold text-[#C5A059] uppercase tracking-wider mb-2">
                Konfirmasi Kehadiran
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="rsvp-status-hadir"
                  onClick={() => handleStatusChange('hadir')}
                  className={`py-3 px-4 rounded-xl border text-center text-xs font-semibold tracking-wide transition-all ${
                    formData.status === 'hadir'
                      ? 'bg-[#C5A059] border-[#C5A059] text-black shadow-lg font-bold'
                      : 'bg-[#0A0A0A] border-[#C5A059]/25 text-[#E5E5E5]/70 hover:text-white hover:bg-black'
                  }`}
                >
                  SAYA HADIR
                </button>
                <button
                  type="button"
                  id="rsvp-status-tidak-hadir"
                  onClick={() => handleStatusChange('tidak_hadir')}
                  className={`py-3 px-4 rounded-xl border text-center text-xs font-semibold tracking-wide transition-all ${
                    formData.status === 'tidak_hadir'
                      ? 'bg-[#C5A059] border-[#C5A059] text-black shadow-lg font-bold'
                      : 'bg-[#0A0A0A] border-[#C5A059]/25 text-[#E5E5E5]/70 hover:text-white hover:bg-black'
                  }`}
                >
                  HALANGAN HADIR
                </button>
              </div>
            </div>

            {formData.status === 'hadir' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                {/* Guest Count */}
                <div id="rsvp-field-guests">
                  <label htmlFor="guestsCount" className="block text-xs font-bold text-[#C5A059] uppercase tracking-wider mb-2">
                    Jumlah Tamu (Maks. 4)
                  </label>
                  <select
                    id="guestsCount"
                    name="guestsCount"
                    value={formData.guestsCount}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-[#C5A059]/30 bg-[#0A0A0A] text-[#F5F5F5] text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] transition-all [&>option]:bg-[#151515] [&>option]:text-[#F5F5F5]"
                  >
                    {[1, 2, 3, 4].map(n => (
                      <option key={n} value={n}>{n} Orang</option>
                    ))}
                  </select>
                </div>

                {/* Which Couple's Celebration */}
                <div id="rsvp-field-couple">
                  <label htmlFor="coupleChoice" className="block text-xs font-bold text-[#C5A059] uppercase tracking-wider mb-2">
                    Menghadiri Undangan Pernikahan
                  </label>
                  <select
                    id="coupleChoice"
                    name="coupleChoice"
                    value={formData.coupleChoice}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-[#C5A059]/30 bg-[#0A0A0A] text-[#F5F5F5] text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] transition-all [&>option]:bg-[#151515] [&>option]:text-[#F5F5F5]"
                  >
                    <option value="both">Kedua Pasangan (Aria & Bella, Devan & Elina)</option>
                    <option value="coupleA">Hanya Aria & Bella</option>
                    <option value="coupleB">Hanya Devan & Elina</option>
                  </select>
                </div>

                {/* Which Ceremony */}
                <div id="rsvp-field-ceremony">
                  <label htmlFor="ceremonyChoice" className="block text-xs font-bold text-[#C5A059] uppercase tracking-wider mb-2">
                    Rencana Sesi Kehadiran
                  </label>
                  <select
                    id="ceremonyChoice"
                    name="ceremonyChoice"
                    value={formData.ceremonyChoice}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-[#C5A059]/30 bg-[#0A0A0A] text-[#F5F5F5] text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] transition-all [&>option]:bg-[#151515] [&>option]:text-[#F5F5F5]"
                  >
                    <option value="both">Seluruh Sesi (Akad & Resepsi)</option>
                    <option value="akad">Hanya Akad Nikah</option>
                    <option value="resepsi">Hanya Resepsi Pernikahan</option>
                  </select>
                </div>
              </motion.div>
            )}

            {/* Wishes/Greetings */}
            <div id="rsvp-field-wishes">
              <label htmlFor="wishes" className="block text-xs font-bold text-[#C5A059] uppercase tracking-wider mb-2">
                Ucapan & Doa Restu (Opsional)
              </label>
              <textarea
                id="wishes"
                name="wishes"
                rows={4}
                value={formData.wishes}
                onChange={handleChange}
                placeholder="Tulis ucapan selamat dan doa restu hangat Anda di sini..."
                className="w-full px-4 py-3 rounded-xl border border-[#C5A059]/30 bg-[#0A0A0A] text-[#F5F5F5] text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] transition-all placeholder:text-gray-600 resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="btn-submit-rsvp"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#C5A059] hover:bg-[#b38e4b] text-black rounded-xl text-sm font-semibold tracking-wider uppercase transition-all shadow-md active:scale-[0.99] flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-black" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>MENGIRIM...</span>
                </>
              ) : (
                <span>KIRIM RSVP</span>
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
