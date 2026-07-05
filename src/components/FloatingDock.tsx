import React, { useState, useEffect, useRef } from 'react';
import { 
  Palette, Bell, Share2, Music, Volume2, VolumeX, Check, Sparkles, 
  X, Link2, Play, Pause, ChevronUp, ChevronDown, MessageSquare, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { themes } from './ThemeSwitcher';
import { subscribeToAnnouncements } from '../lib/firebaseService';

interface FloatingDockProps {
  currentTheme: string;
  onChangeTheme: (themeId: string) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  bgMusicUrl: string;
  bgMusicTitle?: string;
  selectedCouple: 'coupleA' | 'coupleB' | 'both';
}

export default function FloatingDock({
  currentTheme,
  onChangeTheme,
  isPlaying,
  setIsPlaying,
  bgMusicUrl,
  bgMusicTitle,
  selectedCouple
}: FloatingDockProps) {
  const [activePanel, setActivePanel] = useState<'none' | 'broadcast' | 'theme' | 'share' | 'music'>('none');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  // Audio Player Internal Refs/State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const trackTitle = bgMusicTitle || "Melodi Swarga - Gamelan Bali & Suling Klasik";

  // Initialize and Sync Audio player
  useEffect(() => {
    const audio = new Audio(bgMusicUrl);
    audio.autoplay = false;
    audio.loop = true;
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioRef.current = null;
    };
  }, [bgMusicUrl]);

  // Sync isPlaying prop with HTMLAudioElement
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((err) => {
          console.log("Autoplay blocked by browser. Interaction required.", err);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, setIsPlaying]);

  // Handle progress bar scrubbing
  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Load broadcasts and check unread count
  // Subscribes directly to Firestore announcements — admin's broadcasts
  // propagate to every guest's bell panel in real-time via onSnapshot.
  const loadBroadcasts = () => {
    const stored = localStorage.getItem('wedding_custom_notifications');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setBroadcasts(parsed);
        const lastRead = localStorage.getItem('wedding_last_read_broadcasts_time');
        if (lastRead) {
          const lastReadTime = new Date(lastRead).getTime();
          const unread = parsed.filter((b: any) => new Date(b.timestamp).getTime() > lastReadTime).length;
          setUnreadCount(unread);
        } else {
          setUnreadCount(parsed.length);
        }
      } catch (e) {
        console.error('Failed to parse broadcasts history', e);
      }
    }
  };

  useEffect(() => {
    // Subscribe directly to Firestore announcements (real-time)
    const unsubscribe = subscribeToAnnouncements((list) => {
      // Normalize: Firestore stores timestamp as epoch ms; legacy localStorage
      // stored it as an ISO string. Coerce to a shape the UI can render.
      const normalized = (list || []).map((b: any) => ({
        id: b.id,
        title: b.title || 'PENGUMUMAN',
        message: b.message || '',
        timestamp: typeof b.timestamp === 'number' ? b.timestamp : Date.now(),
        link: b.link || '',
        icon: b.icon || 'bell',
        sender: b.sender || 'Keluarga Besar',
        audience: b.audience || 'all'
      }));
      setBroadcasts(normalized);

      // Compute unread count based on last-read timestamp
      const lastRead = localStorage.getItem('wedding_last_read_broadcasts_time');
      if (lastRead) {
        const lastReadTime = new Date(lastRead).getTime();
        const unread = normalized.filter((b: any) => b.timestamp > lastReadTime).length;
        setUnreadCount(unread);
      } else {
        setUnreadCount(normalized.length);
      }
    });

    // Keep legacy localStorage mechanism for backward compat
    const handleNewBroadcast = () => {
      loadBroadcasts();
    };
    window.addEventListener('wedding_push_notification', handleNewBroadcast);
    return () => {
      unsubscribe();
      window.removeEventListener('wedding_push_notification', handleNewBroadcast);
    };
  }, []);

  // Format Helper: 135 -> "02:15"
  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getInterpolatedShareText = () => {
    let template = "Dengan penuh rasa syukur dan hormat, kami mengundang Bapak/Ibu/Saudara/i {nama_tamu} untuk turut hadir dan memberikan doa restu di hari bahagia kami, pernikahan bersama (joint wedding) {nama_pasangan}.\n\nBuka tautan undangan digital resmi kami berikut ini:\n{link}";
    let guestName = "Tamu Undangan";
    let coupleNames = "Aria & Bella & Devan & Elina";
    
    const params = new URLSearchParams(window.location.search);
    const toParam = params.get('to');
    if (toParam) {
      guestName = toParam.replace(/\+/g, ' ').trim();
    }

    try {
      const stored = localStorage.getItem('wedding_custom_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.shareTemplate) {
          template = parsed.shareTemplate;
        }
        
        if (selectedCouple === 'coupleA' && parsed.coupleA) {
          coupleNames = `${parsed.coupleA.groom.nickname} & ${parsed.coupleA.bride.nickname}`;
        } else if (selectedCouple === 'coupleB' && parsed.coupleB) {
          coupleNames = `${parsed.coupleB.groom.nickname} & ${parsed.coupleB.bride.nickname}`;
        } else if (parsed.coupleA && parsed.coupleB) {
          coupleNames = `${parsed.coupleA.groom.nickname} & ${parsed.coupleA.bride.nickname} & ${parsed.coupleB.groom.nickname} & ${parsed.coupleB.bride.nickname}`;
        }
      }
    } catch (e) {
      console.error(e);
    }

    const shareUrl = new URL(window.location.href);
    shareUrl.searchParams.set('couple', selectedCouple);
    const finalUrl = shareUrl.toString();

    return template
      .replace(/{nama_tamu}/g, guestName)
      .replace(/{nama_pasangan}/g, coupleNames)
      .replace(/{link}/g, finalUrl);
  };

  const handleShareLink = async () => {
    const textMessage = getInterpolatedShareText();
    const shareUrl = new URL(window.location.href);
    shareUrl.searchParams.set('couple', selectedCouple);
    const finalUrl = shareUrl.toString();
    const shareTitle = selectedCouple === 'coupleA' ? 'Undangan Pernikahan Aria & Bella' : selectedCouple === 'coupleB' ? 'Undangan Pernikahan Devan & Elina' : 'Undangan Pernikahan Bersama Aria-Bella & Devan-Elina';

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: textMessage,
          url: finalUrl
        });
      } catch (err) {
        console.log('Share canceled or dismissed', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(textMessage);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch (err) {
        console.error('Copy failed', err);
      }
    }
  };

  const handleTogglePanel = (panel: typeof activePanel) => {
    if (activePanel === panel) {
      setActivePanel('none');
    } else {
      setActivePanel(panel);
      if (panel === 'broadcast') {
        setUnreadCount(0);
        localStorage.setItem('wedding_last_read_broadcasts_time', new Date().toISOString());
      }
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Add the two new themes in the array inside dock for rendering
  const extendedThemes = [
    ...themes,
    {
      id: 'elegant-black',
      name: 'Elegant Black',
      primary: '#000000',
      secondary: '#C5A059',
      accentClass: 'bg-[#000000]'
    },
    {
      id: 'minimalist-white',
      name: 'Minimalist White',
      primary: '#FAF9F6',
      secondary: '#8C8273',
      accentClass: 'bg-[#FAF9F6]'
    }
  ];

  return (
    <div 
      id="unified-floating-dock"
      className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[100] flex flex-col items-end space-y-3 pointer-events-none"
    >
      {/* 1. DOCK FLOATING CARDS (Only one panel shown at once) */}
      <AnimatePresence mode="wait">
        {activePanel !== 'none' && (
          <motion.div
            key={activePanel}
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 350, damping: 26 }}
            className="w-72 md:w-80 rounded-2xl bg-[#111111]/95 border border-[#C5A059]/30 p-4 shadow-[0_15px_45px_rgba(0,0,0,0.7)] pointer-events-auto backdrop-blur-md relative select-none flex flex-col space-y-3"
          >
            {/* Header section inside card */}
            <div className="flex items-center justify-between border-b border-[#C5A059]/15 pb-2">
              <span className="font-display text-xs font-semibold text-[#F5F5F5] flex items-center space-x-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#C5A059] animate-pulse" />
                <span>
                  {activePanel === 'theme' && 'Ganti Tema Warna'}
                  {activePanel === 'broadcast' && 'Pemberitahuan Keluarga'}
                  {activePanel === 'share' && 'Bagikan Undangan'}
                  {activePanel === 'music' && 'Latar Musik Romantis'}
                </span>
              </span>
              <button 
                onClick={() => setActivePanel('none')}
                className="p-1 rounded-full text-gray-500 hover:text-white hover:bg-white/5 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Panel 1: Theme Switcher */}
            {activePanel === 'theme' && (
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gold/10">
                {extendedThemes.map((theme) => {
                  const isActive = currentTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => {
                        onChangeTheme(theme.id);
                        localStorage.setItem('wedding_theme_user_override', 'true');
                        if (navigator.vibrate) navigator.vibrate(20);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl border transition-all text-left cursor-pointer ${
                        isActive
                          ? 'border-[#C5A059] bg-[#C5A059]/15 text-white'
                          : 'border-white/5 hover:border-gold/20 bg-white/[0.02] text-gray-400 hover:text-[#F5F5F5]'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="flex space-x-0.5">
                          <div
                            className="w-3.5 h-3.5 rounded-full border border-white/20"
                            style={{ backgroundColor: theme.primary }}
                          />
                          <div
                            className="w-3.5 h-3.5 rounded-full border border-white/20"
                            style={{ backgroundColor: theme.secondary }}
                          />
                        </div>
                        <span className="text-[11px] font-sans font-medium">
                          {theme.name}
                        </span>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 text-[#C5A059]" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Panel 2: Broadcast Feed */}
            {activePanel === 'broadcast' && (
              <div className="space-y-3.5 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gold/10">
                {broadcasts.length === 0 ? (
                  <div className="text-center py-8 space-y-2">
                    <div className="w-10 h-10 rounded-full bg-[#111] border border-zinc-800 flex items-center justify-center text-zinc-500 mx-auto">
                      <Bell className="w-4 h-4" />
                    </div>
                    <p className="text-[11px] text-gray-500 font-mono italic px-4">
                      Belum ada pesan siaran baru dari keluarga mempelai.
                    </p>
                  </div>
                ) : (
                  broadcasts.map((b) => (
                    <div key={b.id} className="p-3 rounded-xl bg-white/[0.02] border border-[#C5A059]/10 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-bold tracking-widest text-[#C5A059] uppercase px-1 bg-[#C5A059]/10 rounded border border-[#C5A059]/20">
                          {b.title}
                        </span>
                        <span className="text-[9px] font-mono text-gray-500">
                          {new Date(b.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WITA
                        </span>
                      </div>

                      {/* Sender + audience badges */}
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="inline-flex items-center gap-1 text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/40">
                          <User className="w-2.5 h-2.5" />
                          <span>{b.sender || 'Keluarga Besar'}</span>
                        </span>
                        {b.audience && b.audience !== 'all' && (
                          <span className="inline-flex items-center text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-white/5 text-gray-300 border border-white/10">
                            untuk {b.audience === 'coupleA' ? 'Couple A' : b.audience === 'coupleB' ? 'Couple B' : 'VIP'}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#E5E5E5] leading-relaxed">
                        {b.message}
                      </p>
                      <div className="text-[9px] text-gray-500 flex items-center justify-between pt-1 border-t border-white/5">
                        <span className="font-mono">{b.sender || 'Keluarga Besar'}</span>
                        <span>{new Date(b.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Panel 3: Share/Bagikan */}
            {activePanel === 'share' && (
              <div className="space-y-3 py-1">
                <p className="text-xs text-gray-400 leading-normal italic text-center">
                  Bagikan tautan undangan ini ke teman, kerabat, atau rekan media sosial Anda.
                </p>
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={handleShareLink}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#C5A059] hover:bg-[#b38e4b] text-black font-semibold text-xs tracking-wider flex items-center justify-center space-x-2 shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <Link2 className="w-4 h-4" />
                    <span>{copied ? 'BERHASIL DISALIN!' : 'SALIN & BAGIKAN LINK'}</span>
                  </button>

                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(getInterpolatedShareText())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 font-semibold text-xs tracking-wider flex items-center justify-center space-x-2 transition-all active:scale-95"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-500" />
                    <span>BAGIKAN KE WHATSAPP</span>
                  </a>
                </div>
              </div>
            )}

            {/* Panel 4: Background Music Controls */}
            {activePanel === 'music' && (
              <div className="space-y-3.5 py-1">
                <div className="flex items-center space-x-3.5">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-10 h-10 rounded-full bg-[#C5A059] hover:bg-[#b38e4b] text-black flex items-center justify-center transition-all active:scale-90 shadow-md flex-shrink-0 cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-4.5 h-4.5 fill-black" /> : <Play className="w-4.5 h-4.5 fill-black ml-0.5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <span className="block text-[9px] tracking-wider text-[#C5A059]/80 font-mono uppercase leading-none">
                      Sedang Diputar
                    </span>
                    <p className="text-xs font-semibold text-white truncate mt-1">
                      {trackTitle}
                    </p>
                  </div>
                </div>

                {/* Progress bar and time indicators */}
                <div className="space-y-1.5">
                  <div 
                    onClick={handleScrub}
                    className="w-full h-1.5 bg-zinc-900 rounded-full relative cursor-pointer overflow-hidden group"
                  >
                    <div 
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#C5A059] to-[#E2C284] rounded-full transition-all duration-100 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-gray-500 font-mono">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration || 180)}</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. ACTIONS DOCK BUTTONS BAR */}
      <div className="flex items-center space-x-2 pointer-events-auto">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className="flex items-center space-x-2 bg-[#121212]/95 border border-[#C5A059]/35 px-3 py-2 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.6)] backdrop-blur-md"
            >
              {/* Button A: Broadcast history / Notifications */}
              <button
                onClick={() => handleTogglePanel('broadcast')}
                className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 cursor-pointer ${
                  activePanel === 'broadcast' 
                    ? 'bg-[#C5A059] text-black border border-[#C5A059]' 
                    : 'bg-transparent text-[#C5A059] hover:bg-white/5 hover:text-white'
                }`}
                title="Pemberitahuan & Siaran"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#C5A059] text-black font-mono text-[9px] font-bold flex items-center justify-center border border-[#121212] animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Button B: Theme Picker */}
              <button
                onClick={() => handleTogglePanel('theme')}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 cursor-pointer ${
                  activePanel === 'theme' 
                    ? 'bg-[#C5A059] text-black border border-[#C5A059]' 
                    : 'bg-transparent text-[#C5A059] hover:bg-white/5 hover:text-white'
                }`}
                title="Pilih Tema Warna"
              >
                <Palette className="w-4.5 h-4.5" />
              </button>

              {/* Button C: Share */}
              <button
                onClick={() => handleTogglePanel('share')}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 cursor-pointer ${
                  activePanel === 'share' 
                    ? 'bg-[#C5A059] text-black border border-[#C5A059]' 
                    : 'bg-transparent text-[#C5A059] hover:bg-white/5 hover:text-white'
                }`}
                title="Bagikan Undangan"
              >
                <Share2 className="w-4.5 h-4.5" />
              </button>

              {/* Button D: Music Control (Shows playing animation if music active) */}
              <button
                onClick={() => handleTogglePanel('music')}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 cursor-pointer ${
                  activePanel === 'music' 
                    ? 'bg-[#C5A059] text-black border border-[#C5A059]' 
                    : 'bg-transparent text-[#C5A059] hover:bg-white/5 hover:text-white'
                }`}
                title="Pengatur Musik Latar"
              >
                {isPlaying ? (
                  <Music className="w-4.5 h-4.5 animate-[spin_4s_linear_infinite]" />
                ) : (
                  <VolumeX className="w-4.5 h-4.5 text-gray-500" />
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* E. DOCK COLLAPSE/TOGGLE CONTROLLER BUTTON */}
        <button
          onClick={() => {
            setIsCollapsed(!isCollapsed);
            setActivePanel('none');
          }}
          className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-[#151515] border border-[#C5A059]/40 text-[#C5A059] hover:text-white shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title={isCollapsed ? "Expand Controls" : "Collapse Controls"}
        >
          {isCollapsed ? <ChevronUp className="w-5 h-5 animate-pulse" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
