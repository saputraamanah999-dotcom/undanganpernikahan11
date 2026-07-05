import React, { useState, useEffect } from 'react';
import { Bell, X, Sparkles, MessageSquare, Trash2, Eye, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  subscribeToAnnouncements, 
  subscribeToViewedByTracking, 
  deleteAnnouncementFromFirebase, 
  trackAnnouncementViewInFirebase 
} from '../lib/firebaseService';

export default function AdminBroadcasts() {
  const [isOpen, setIsOpen] = useState(false);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Admin login sync state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return localStorage.getItem('wedding_admin_logged_in') === 'true';
  });

  // Track views state mapping (notification ID -> list of viewers)
  const [views, setViews] = useState<Record<string, string[]>>({});

  useEffect(() => {
    // 1. Subscribe to announcements real-time from Firestore
    const unsubscribeAnnouncements = subscribeToAnnouncements((list) => {
      setBroadcasts(list);
      
      // Calculate unread count
      const lastRead = localStorage.getItem('wedding_last_read_broadcasts_time');
      if (lastRead) {
        const lastReadTime = new Date(lastRead).getTime();
        const unread = list.filter((b: any) => new Date(b.timestamp).getTime() > lastReadTime).length;
        setUnreadCount(unread);
      } else {
        setUnreadCount(list.length);
      }
    });

    // 2. Subscribe to viewedByTracking real-time from Firestore
    const unsubscribeViews = subscribeToViewedByTracking((viewsMap) => {
      setViews(viewsMap);
    });

    const handleAdminState = () => {
      setIsAdminLoggedIn(localStorage.getItem('wedding_admin_logged_in') === 'true');
    };

    window.addEventListener('wedding_admin_state_changed', handleAdminState);

    return () => {
      unsubscribeAnnouncements();
      unsubscribeViews();
      window.removeEventListener('wedding_admin_state_changed', handleAdminState);
    };
  }, []);

  // Record guest views in Firestore when opening the broadcasts drawer
  const recordViews = (items: any[]) => {
    const params = new URLSearchParams(window.location.search);
    const guestName = params.get('to')?.replace(/\+/g, ' ').trim() || 'Tamu Undangan';
    
    // Don't record admin views as regular guests
    const isAdmin = localStorage.getItem('wedding_admin_logged_in') === 'true';
    if (isAdmin) return;

    items.forEach((item) => {
      trackAnnouncementViewInFirebase(item.id, guestName)
        .catch(e => console.error("Error tracking view for item:", item.id, e));
    });
  };

  const handleOpenDrawer = () => {
    setIsOpen(true);
    setUnreadCount(0);
    localStorage.setItem('wedding_last_read_broadcasts_time', new Date().toISOString());
    recordViews(broadcasts);
  };

  const handleDeleteBroadcast = async (id: string) => {
    try {
      await deleteAnnouncementFromFirebase(id);
    } catch (e) {
      console.error("Error deleting announcement from Firebase:", e);
    }
  };

  // Highlights the word "Saputra" in elements with rainbow move animation
  const highlightSaputra = (text: string) => {
    if (!text) return '';
    const parts = text.split(/(Saputra)/gi);
    return parts.map((part, index) => 
      part.toLowerCase() === 'saputra' 
        ? <span key={index} className="fx-rainbow-text-move font-semibold">{part}</span> 
        : part
    );
  };

  return (
    <>
      {/* FLOATING ACTION BADGE - FIXED BOTTOM LEFT */}
      <div className="fixed bottom-6 left-6 md:bottom-8 md:left-8 z-45">
        <button
          id="btn-admin-broadcasts-badge"
          onClick={handleOpenDrawer}
          className="fx-misc-badge shadow-[0_8px_30px_rgba(197,160,89,0.12)] hover:shadow-[0_8px_35px_rgba(197,160,89,0.22)] active:scale-95 transition-all"
          title="Lihat Pengumuman Admin"
        >
          <Bell className="w-5 h-5 text-[#C5A059]" />
          
          {unreadCount > 0 && (
            <span className="fx-misc-badge-dot">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* FLOATING DRAWER (SLIDES FROM LEFT) */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex justify-start">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Sliding Drawer Body */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-sm h-full bg-[#0F0F0F] border-r border-[#C5A059]/20 shadow-2xl flex flex-col z-10"
            >
              {/* Gold Top Header Border Line */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#C5A059] to-[#E2C284]" />

              {/* Drawer Header */}
              <div className="p-5 border-b border-[#C5A059]/15 flex items-center justify-between mt-1">
                <div className="space-y-0.5">
                  <span className="font-mono text-[9px] tracking-wider text-[#C5A059] font-semibold uppercase block">
                    BROADCAST & ANNOUNCEMENTS
                  </span>
                  <h4 className="font-serif text-base font-bold text-white flex items-center space-x-1.5">
                    <MessageSquare className="w-4 h-4 text-[#C5A059]" />
                    <span>Pesan Keluarga</span>
                  </h4>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-[#C5A059]/20 scrollbar-track-transparent">
                {broadcasts.length === 0 ? (
                  <div className="text-center py-20 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mx-auto">
                      <Bell className="w-5 h-5" />
                    </div>
                    <p className="text-xs text-gray-500 font-mono italic">
                      Belum ada pesan siaran baru dari keluarga mempelai. Dapatkan pengumuman penting di sini.
                    </p>
                  </div>
                ) : (
                  broadcasts.map((item) => {
                    const viewersList = views[item.id] || [];
                    const audienceLabel = item.audience && item.audience !== 'all'
                      ? (item.audience === 'coupleA' ? 'untuk Couple A' : item.audience === 'coupleB' ? 'untuk Couple B' : 'untuk VIP')
                      : '';
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl bg-[#151515] border border-[#C5A059]/15 shadow-md space-y-2 relative overflow-hidden"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono font-bold tracking-widest text-[#C5A059] uppercase px-1.5 py-0.5 bg-[#C5A059]/10 rounded border border-[#C5A059]/20">
                            {highlightSaputra(item.title)}
                          </span>

                          <div className="flex items-center space-x-2">
                            <span className="text-[9px] font-mono text-gray-500">
                              {new Date(item.timestamp).toLocaleTimeString('id-ID', {
                                hour: '2-digit', minute: '2-digit'
                              })} WITA
                            </span>

                            {/* Admin Delete Action Button */}
                            {isAdminLoggedIn && (
                              <button
                                type="button"
                                onClick={() => handleDeleteBroadcast(item.id)}
                                className="p-1 rounded bg-red-950/40 text-red-400 hover:bg-red-900 hover:text-white border border-red-500/20 transition-all cursor-pointer"
                                title="Hapus Siaran Ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Sender (Nama Pengirim) + Audience badges */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/40">
                            <User className="w-2.5 h-2.5" />
                            <span>{highlightSaputra(item.sender || 'Keluarga Besar')}</span>
                          </span>
                          {audienceLabel && (
                            <span className="inline-flex items-center text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-gray-300 border border-white/10">
                              {audienceLabel}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#E5E5E5] font-sans leading-relaxed">
                          {highlightSaputra(item.message)}
                        </p>

                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                          <div className="flex items-center space-x-1">
                            <span>Oleh:</span>
                            <span className="fx-rainbow-text-move text-[10px]">
                              {item.sender || 'Keluarga Besar'}
                            </span>
                          </div>
                          <span className="text-[9px] italic">
                            {new Date(item.timestamp).toLocaleDateString('id-ID', {
                              day: 'numeric', month: 'short'
                            })}
                          </span>
                        </div>

                        {/* Viewers Tracking List for Admins */}
                        {isAdminLoggedIn && (
                          <div className="mt-2 pt-2 border-t border-dashed border-[#C5A059]/10 space-y-1 bg-black/35 p-2 rounded-lg">
                            <div className="flex items-center space-x-1 text-[9px] font-mono font-bold text-[#C5A059]">
                              <Eye className="w-3 h-3" />
                              <span>PENONTON ({viewersList.length}):</span>
                            </div>
                            {viewersList.length === 0 ? (
                              <p className="text-[8px] text-gray-500 font-mono italic">Belum ada penonton.</p>
                            ) : (
                              <p className="text-[9px] text-gray-400 font-mono leading-normal max-h-16 overflow-y-auto break-words scrollbar-thin">
                                {viewersList.join(', ')}
                              </p>
                            )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-white/5 bg-[#0A0A0A] text-center">
                <p className="text-[10px] text-gray-500 font-mono italic flex items-center justify-center space-x-1">
                  <Sparkles className="w-3 h-3 text-[#C5A059]" />
                  <span>Keluarga Besar I Gede Julianto</span>
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
