import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, User, Heart, Trash2, ImagePlus, X } from 'lucide-react';
import { 
  subscribeToGuestbook, 
  submitGuestbookWishToFirebase, 
  likeGuestbookWishInFirebase, 
  deleteGuestbookWishFromFirebase 
} from '../lib/firebaseService';

interface Wish {
  id: string;
  name: string;
  wishes: string;
  coupleChoice: 'coupleA' | 'coupleB' | 'both';
  createdAt: string;
  likes?: number;
  photoUrl?: string;
}

const DEFAULT_WISHES: Wish[] = [
  {
    id: 'seed-1',
    name: 'Keluarga Besar Bp. H. Joko Santoso',
    wishes: 'Selamat menempuh hidup baru untuk Aria & Bella serta Devan & Elina! Pernikahan ganda yang sangat luar biasa indah. Semoga kedua pasangan sakinah mawaddah warahmah, dilimpahkan kebahagiaan dan keturunan yang sholeh/sholehah.',
    coupleChoice: 'both',
    createdAt: '2026-07-02T10:30:00.000Z'
  },
  {
    id: 'seed-2',
    name: 'Sarah Amalia (Sahabat Bella)',
    wishes: 'Happy wedding Kak Bella & Kak Aria! Lancar-lancar ya acaranya hari H nanti. Masih terharu akhirnya kalian berlabuh di pelaminan bareng adik tercinta. Cantik dan ganteng maksimal semuanya!',
    coupleChoice: 'coupleA',
    createdAt: '2026-07-01T15:45:00.000Z'
  },
  {
    id: 'seed-3',
    name: 'Reza Kurniawan (Teman Kantor Devan)',
    wishes: 'Selamat Devan & Elina! Mantap bener nikah barengan kakak tercinta. Semoga awet sampai kakek nenek bro! Sakinah selalu dan cepet dapet momongan!',
    coupleChoice: 'coupleB',
    createdAt: '2026-07-02T08:12:00.000Z'
  },
  {
    id: 'seed-4',
    name: 'Ibu Ratna & Bp. Hendra',
    wishes: 'Selamat atas bersatunya pilar cinta suci kedua pasangan berbahagia. Aria, Bella, Devan, Elina, selamat menempuh bahtera rumah tangga baru ya nak. Titip doa restu dari kami sekeluarga di Bali.',
    coupleChoice: 'both',
    createdAt: '2026-06-30T09:20:00.000Z'
  }
];

export default function Guestbook() {
  const [wishesList, setWishesList] = useState<Wish[]>([]);
  const [filter, setFilter] = useState<'all' | 'coupleA' | 'coupleB'>('all');
  const [newWish, setNewWish] = useState({
    name: '',
    wishes: '',
    coupleChoice: 'both' as 'coupleA' | 'coupleB' | 'both',
    photoUrl: ''
  });
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likedWishes, setLikedWishes] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Subscribe to Firestore guestbook wishes in real-time
    const unsubscribe = subscribeToGuestbook((list) => {
      // Sort newest first
      const sorted = [...list].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setWishesList(sorted);
    });

    // Sync liked items by me
    const liked = JSON.parse(localStorage.getItem('wedding_liked_by_me') || '[]');
    setLikedWishes(liked);

    // Sync admin login status
    const handleAdminState = () => {
      setIsAdmin(localStorage.getItem('wedding_admin_logged_in') === 'true');
    };
    handleAdminState();
    window.addEventListener('wedding_admin_state_changed', handleAdminState);

    // Auto-populate name from URL parameter '?to=Name'
    const params = new URLSearchParams(window.location.search);
    const to = params.get('to');
    if (to) {
      setNewWish(prev => ({ ...prev, name: to.replace(/\+/g, ' ') }));
    }

    return () => {
      unsubscribe();
      window.removeEventListener('wedding_admin_state_changed', handleAdminState);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewWish(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWish.name.trim() || !newWish.wishes.trim()) return;

    setIsSubmitting(true);
    try {
      const wish: Wish = {
        id: `guest-${Math.random().toString(36).substring(2, 9)}`,
        name: newWish.name.trim(),
        wishes: newWish.wishes.trim(),
        coupleChoice: newWish.coupleChoice,
        createdAt: new Date().toISOString(),
        likes: 0,
        photoUrl: newWish.photoUrl.trim() || null
      };

      await submitGuestbookWishToFirebase(wish as any);
      
      setNewWish(prev => ({ ...prev, wishes: '', photoUrl: '' }));
      setIsSubmitting(false);
    } catch (err) {
      console.error("Error submitting wish to Firebase:", err);
      setIsSubmitting(false);
    }
  };

  const handleLike = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const liked = JSON.parse(localStorage.getItem('wedding_liked_by_me') || '[]');
    const isCurrentlyLiked = liked.includes(id);

    let updatedLiked = [...liked];
    if (isCurrentlyLiked) {
      updatedLiked = updatedLiked.filter(i => i !== id);
    } else {
      updatedLiked.push(id);
    }

    localStorage.setItem('wedding_liked_by_me', JSON.stringify(updatedLiked));
    setLikedWishes(updatedLiked);

    try {
      await likeGuestbookWishInFirebase(id, isCurrentlyLiked);
    } catch (err) {
      console.error("Error toggling like in Firebase:", err);
    }
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDeleteWish = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }

    try {
      await deleteGuestbookWishFromFirebase(id);
      setConfirmDeleteId(null);
    } catch (err) {
      console.error("Error deleting wish from Firebase:", err);
    }
  };

  // Filter list
  const filteredWishes = wishesList.filter(item => {
    if (filter === 'all') return true;
    return item.coupleChoice === filter || item.coupleChoice === 'both';
  });

  const getCoupleBadge = (couple: 'coupleA' | 'coupleB' | 'both') => {
    if (couple === 'coupleA') return 'Aria & Bella';
    if (couple === 'coupleB') return 'Devan & Elina';
    return 'Keduanya';
  };

  return (
    <div id="guestbook-section" className="py-12 px-4 max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <span className="font-mono text-xs tracking-widest text-[#C5A059] uppercase block mb-1">
          GUESTBOOK / UCAPAN
        </span>
        <h3 className="font-serif text-2xl md:text-3xl font-semibold text-[#F5F5F5]">
          Kirim Ucapan & Doa Restu
        </h3>
        <p className="mt-2 text-xs md:text-sm text-[#E5E5E5]/70 max-w-md mx-auto italic">
          Ungkapkan kegembiraan dan doa restu Anda kepada pasangan pengantin yang berbahagia.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Write Wish Column */}
        <div className="md:col-span-2">
          <form
            onSubmit={handleSubmit}
            className="sticky top-24 bg-[#151515] p-5 rounded-2xl border border-[#C5A059]/20 shadow-2xl space-y-4"
          >
            <h4 className="font-serif text-sm font-bold text-[#F5F5F5] flex items-center space-x-1.5 border-b border-[#C5A059]/10 pb-2.5 mb-2">
              <MessageSquare className="w-4 h-4 text-[#C5A059]" />
              <span>Tulis Ucapan Anda</span>
            </h4>

            <div>
              <label htmlFor="guestbook-name" className="block text-[10px] font-bold text-[#C5A059] uppercase tracking-wider mb-1">
                Nama Pengirim
              </label>
              <input
                type="text"
                id="guestbook-name"
                name="name"
                value={newWish.name}
                onChange={handleChange}
                placeholder="Nama Anda / Instansi"
                className="w-full px-3 py-2.5 rounded-lg border border-[#C5A059]/30 bg-[#0A0A0A] text-xs text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] transition-all placeholder:text-gray-600"
                required
              />
            </div>

            <div>
              <label htmlFor="guestbook-couple" className="block text-[10px] font-bold text-[#C5A059] uppercase tracking-wider mb-1">
                Ditujukan Kepada
              </label>
              <select
                id="guestbook-couple"
                name="coupleChoice"
                value={newWish.coupleChoice}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg border border-[#C5A059]/30 bg-[#0A0A0A] text-xs text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] transition-all [&>option]:bg-[#151515] [&>option]:text-[#F5F5F5]"
              >
                <option value="both">Keduanya (Aria-Bella & Devan-Elina)</option>
                <option value="coupleA">Aria & Bella</option>
                <option value="coupleB">Devan & Elina</option>
              </select>
            </div>

            <div>
              <label htmlFor="guestbook-wishes" className="block text-[10px] font-bold text-[#C5A059] uppercase tracking-wider mb-1">
                Ucapan Selamat
              </label>
              <textarea
                id="guestbook-wishes"
                name="wishes"
                rows={4}
                value={newWish.wishes}
                onChange={handleChange}
                placeholder="Selamat berbahagia..."
                className="w-full px-3 py-2 rounded-lg border border-[#C5A059]/30 bg-[#0A0A0A] text-xs text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] transition-all placeholder:text-gray-600 resize-none"
                required
              />
            </div>

            {/* Photo URL attachment (optional) */}
            <div>
              <label htmlFor="guestbook-photo" className="block text-[10px] font-bold text-[#C5A059] uppercase tracking-wider mb-1">
                Foto Kenangan (URL — Opsional)
              </label>
              <div className="relative">
                <input
                  type="url"
                  id="guestbook-photo"
                  name="photoUrl"
                  value={newWish.photoUrl}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[#C5A059]/30 bg-[#0A0A0A] text-xs text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] transition-all placeholder:text-gray-600"
                />
                <ImagePlus className="w-4 h-4 text-[#C5A059] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {newWish.photoUrl && (
                <div className="mt-2 relative inline-block">
                  <img
                    src={newWish.photoUrl}
                    alt="preview"
                    className="w-16 h-16 object-cover rounded-lg border border-[#C5A059]/30"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setNewWish(prev => ({ ...prev, photoUrl: '' }))}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-900/80 text-white flex items-center justify-center"
                    title="Hapus foto"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !newWish.name.trim() || !newWish.wishes.trim()}
              className="w-full py-2.5 bg-[#C5A059] hover:bg-[#b38e4b] text-black rounded-lg text-xs font-semibold tracking-wider uppercase transition-all shadow-md active:scale-97 flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Mengirim...' : 'Kirim'}</span>
            </button>
          </form>
        </div>

        {/* Wishes List Column */}
        <div className="md:col-span-3 flex flex-col space-y-4">
          {/* Filtering buttons */}
          <div className="flex space-x-1 bg-[#151515] p-1 rounded-lg border border-[#C5A059]/25 shadow-md">
            {(['all', 'coupleA', 'coupleB'] as const).map((btn) => (
              <button
                key={btn}
                onClick={() => setFilter(btn)}
                className={`flex-1 py-1.5 px-2 rounded-md text-[10px] md:text-xs font-medium tracking-wide transition-all cursor-pointer ${
                  filter === btn
                    ? 'bg-[#C5A059] text-black font-semibold shadow-md'
                    : 'text-[#E5E5E5]/70 hover:bg-[#0A0A0A] hover:text-white'
                }`}
              >
                {btn === 'all' ? 'Semua' : btn === 'coupleA' ? 'Aria-Bella' : 'Devan-Elina'}
              </button>
            ))}
          </div>

          {/* List Scroll Wrapper */}
          <div className="h-[460px] overflow-y-auto pr-1 space-y-3 scrollbar-thin scrollbar-thumb-[#C5A059]/30 scrollbar-track-transparent">
            <AnimatePresence initial={false}>
              {filteredWishes.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-xs font-mono">
                  Belum ada ucapan untuk filter ini.
                </div>
              ) : (
                filteredWishes.map((item) => (
                  <motion.div
                    key={item.id}
                    id={`wish-card-${item.id}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="bg-[#151515] p-4 rounded-xl border border-[#C5A059]/15 shadow-xl hover:border-[#C5A059]/40 transition-all group/card relative"
                  >
                    <div className="flex items-start justify-between space-x-2 mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-full bg-[#0A0A0A] border border-[#C5A059]/25 flex items-center justify-center text-[#C5A059] shadow-inner">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h5 className="font-serif text-xs md:text-sm font-bold text-[#F5F5F5] leading-tight">
                            {item.name}
                          </h5>
                          <span className="text-[9px] text-gray-500 block font-mono">
                            {new Date(item.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Couple Badge & Quick Delete for Admin */}
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[8px] font-mono tracking-wider px-2 py-0.5 rounded-full border bg-[#0A0A0A] text-[#C5A059] border-[#C5A059]/30">
                          {getCoupleBadge(item.coupleChoice)}
                        </span>
                        
                        {isAdmin && (
                          confirmDeleteId === item.id ? (
                            <div className="flex items-center space-x-1">
                              <button
                                id={`btn-inline-delete-confirm-${item.id}`}
                                onClick={(e) => handleDeleteWish(item.id, e)}
                                className="px-1.5 py-0.5 rounded text-[10px] bg-red-900/45 text-red-100 hover:bg-red-800 transition-all cursor-pointer font-semibold"
                              >
                                Yakin?
                              </button>
                              <button
                                id={`btn-inline-delete-cancel-${item.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteId(null);
                                }}
                                className="px-1 py-0.5 rounded text-[10px] bg-gray-800 text-gray-400 hover:text-white transition-all cursor-pointer"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <button
                              id={`btn-inline-delete-${item.id}`}
                              onClick={(e) => handleDeleteWish(item.id, e)}
                              className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-950/20 transition-all cursor-pointer"
                              title="Hapus Ucapan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <p className="text-xs md:text-sm text-[#E5E5E5]/80 leading-relaxed font-sans mt-1 pr-6">
                      {item.wishes}
                    </p>

                    {/* Optional photo attachment */}
                    {item.photoUrl && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxPhoto(item.photoUrl!);
                        }}
                        className="mt-3 block group"
                        title="Perbesar foto"
                      >
                        <img
                          src={item.photoUrl}
                          alt={`Foto dari ${item.name}`}
                          className="w-24 h-24 object-cover rounded-lg border border-[#C5A059]/30 hover:border-[#C5A059] hover:scale-105 transition-all"
                          referrerPolicy="no-referrer"
                          onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                        />
                      </button>
                    )}

                    {/* Interactive Like Button */}
                    <div className="mt-3 flex items-center justify-end">
                      <button
                        id={`btn-like-wish-${item.id}`}
                        onClick={(e) => handleLike(item.id, e)}
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                          likedWishes.includes(item.id)
                            ? 'bg-pink-950/30 text-pink-400 border border-pink-900/30 scale-105'
                            : 'bg-[#0A0A0A]/80 text-[#E5E5E5]/50 border border-white/5 hover:text-pink-400 hover:bg-[#0A0A0A]'
                        }`}
                      >
                        <Heart 
                          className={`w-3.5 h-3.5 transition-transform active:scale-125 ${
                            likedWishes.includes(item.id) ? 'fill-pink-500 text-pink-400' : ''
                          }`} 
                        />
                        <span className="font-mono">{item.likes || 0}</span>
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Photo Lightbox Modal */}
      <AnimatePresence>
        {lightboxPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxPhoto(null)}
            className="fixed inset-0 bg-black/95 backdrop-blur-md z-[120] flex items-center justify-center p-4 cursor-pointer"
          >
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-[#C5A059] hover:text-black hover:scale-110 transition-all z-50 shadow-2xl"
              title="Tutup"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={lightboxPhoto}
              alt="Foto kenangan"
              className="max-h-[80vh] max-w-full rounded-2xl border-2 border-[#C5A059]/40 shadow-2xl object-contain"
              referrerPolicy="no-referrer"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; setLightboxPhoto(null); }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
