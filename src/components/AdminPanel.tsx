import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings, Lock, X, LogOut, Calendar, Trash2, Heart,
  AlertCircle, ShieldAlert, Edit, Save, Bell, Landmark, MapPin, Music,
  Image, Type, Sparkles, Plus, Users, Check, Clipboard,
  Radio, BarChart3, LogIn, User, Clock, Palette, MessageSquare, Video, Megaphone, ListOrdered,
  ChevronUp, ChevronDown
} from 'lucide-react';
import {
  signInWithGoogle,
  subscribeToSiteSettings,
  subscribeToAnnouncements,
  subscribeToGallery,
  subscribeToRSVP,
  subscribeToGuestbook,
  subscribeToViewedByTracking,
  updateSiteSettingsInFirebase,
  updateCoupleInFirebase,
  addGalleryPhotoToFirebase,
  updateGalleryPhotoInFirebase,
  deleteGalleryPhotoFromFirebase,
  addAnnouncementToFirebase,
  deleteAnnouncementFromFirebase,
  deleteGuestbookWishFromFirebase,
  deleteRsvpFromFirebase,
  type AnnouncementAudience,
} from '../lib/firebaseService';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'coupleA' | 'coupleB' | 'general' | 'theme' | 'notif' | 'guestbook' | 'gallery' | 'timeline' | 'streaming' | 'rsvp_stats' | 'guests_share';

export default function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isAuthBusy, setIsAuthBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('coupleA');

  // Real-time Firestore collections
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [galleryPhotos, setGalleryPhotos] = useState<any[]>([]);
  const [rsvpList, setRsvpList] = useState<any[]>([]);
  const [wishes, setWishes] = useState<any[]>([]);
  const [views, setViews] = useState<Record<string, string[]>>({});

  // The "live" wedding form data — kept in sync with Firestore siteSettings via App.tsx
  const [formData, setFormData] = useState<any>(null);
  const [countdownDate, setCountdownDate] = useState('2026-10-11T08:00');

  // Gallery form state
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [newGalleryCaption, setNewGalleryCaption] = useState('');
  const [newGalleryCategory, setNewGalleryCategory] = useState('Prewedding');
  const [editingGalleryId, setEditingGalleryId] = useState<string | null>(null);

  // Broadcast form state — includes `sender` (who broadcasts the announcement)
  // and `audience` (which guest segment it targets).
  const [broadcastTitle, setBroadcastTitle] = useState('PENGUMUMAN');
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastIcon, setBroadcastIcon] = useState('bell');
  const [broadcastLink, setBroadcastLink] = useState('');
  const [broadcastSender, setBroadcastSender] = useState('Keluarga Besar');
  const [broadcastAudience, setBroadcastAudience] = useState<AnnouncementAudience>('all');

  // Guest list state
  const [guestNameInput, setGuestNameInput] = useState('');
  const [guestCoupleInput, setGuestCoupleInput] = useState<'both' | 'coupleA' | 'coupleB'>('both');
  const [guestPhoneInput, setGuestPhoneInput] = useState('');
  const [guestSearchQuery, setGuestSearchQuery] = useState('');
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [copiedGuestId, setCopiedGuestId] = useState<string | null>(null);

  // Confirm-delete state (iframe-safe)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Timeline form state (admin can add / edit / delete rundown items)
  const [timelineForm, setTimelineForm] = useState({
    time: '',
    type: 'Akad Nikah',
    couple: 'coupleA' as 'coupleA' | 'coupleB',
    title: '',
    desc: '',
    icon: 'heart'
  });
  const [editingTimelineIdx, setEditingTimelineIdx] = useState<number | null>(null);

  // ============================================================
  // AUTH STATE + REAL-TIME SUBSCRIPTIONS
  // ------------------------------------------------------------
  // The admin panel subscribes DIRECTLY to Firestore siteSettings
  // (in addition to the localStorage fallback). This is the fix for
  // the cross-device admin sync bug: when an admin edits the music
  // URL on a laptop, the same admin opening the panel on a phone
  // now sees the LIVE Firestore data (not stale localStorage).
  // Firestore data always wins over the localStorage fallback.
  // ============================================================
  useEffect(() => {
    if (!isOpen) return;
    const loggedIn = localStorage.getItem('wedding_admin_logged_in') === 'true';
    setIsAdmin(loggedIn);

    // Real-time Firestore subscriptions (admin sees everything live)
    const unsubAnn = subscribeToAnnouncements(setAnnouncements);
    const unsubGal = subscribeToGallery(setGalleryPhotos);
    const unsubRsvp = subscribeToRSVP(setRsvpList);
    const unsubWish = subscribeToGuestbook(setWishes);
    const unsubViews = subscribeToViewedByTracking(setViews);

    // Load editable wedding data from localStorage as an initial FALLBACK.
    // The Firestore siteSettings subscription below overrides this with the
    // live cloud state — so cross-device admin edits flow into this form.
    const storedData = localStorage.getItem('wedding_custom_data');
    if (storedData) {
      try {
        setFormData(JSON.parse(storedData));
      } catch (e) {
        console.error("Error parsing stored data", e);
      }
    }

    // LIVE Firestore siteSettings subscription — admin form syncs across
    // devices. We merge: prev (current form) is overridden by the live
    // Firestore data, then re-attached to the latest couples from Firestore
    // so per-couple edits don't get clobbered by stale localStorage copies.
    const unsubSettings = subscribeToSiteSettings((settings: any) => {
      if (import.meta.env.DEV) {
        console.log('[AdminPanel] Firestore siteSettings update received →', {
          bgMusicUrl: settings?.bgMusicUrl,
          title: settings?.title,
          maintenanceMode: settings?.maintenanceMode,
          keys: settings ? Object.keys(settings).length : 0
        });
      }
      setFormData((prev: any) => {
        // Preserve the couples from the latest Firestore snapshot if present,
        // otherwise keep whatever the form already has (so admin can edit
        // couples before the couples snapshot arrives).
        const next: any = { ...(prev || {}), ...settings };
        // Persist to localStorage so any legacy listeners stay consistent.
        try {
          localStorage.setItem('wedding_custom_data', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    });

    // Also listen for live updates from App.tsx (legacy event-based sync)
    const handleDataChange = () => {
      const fresh = localStorage.getItem('wedding_custom_data');
      if (fresh) {
        try {
          const parsed = JSON.parse(fresh);
          setFormData((prev: any) => {
            return { ...parsed, ...(prev?._userEdits || {}) };
          });
        } catch (e) {}
      }
    };
    window.addEventListener('wedding_custom_data_changed', handleDataChange);

    // Load countdown date
    const storedDate = localStorage.getItem('wedding_target_date') || '2026-10-11T08:00:00';
    try {
      setCountdownDate(new Date(storedDate).toISOString().substring(0, 16));
    } catch (e) {
      setCountdownDate('2026-10-11T08:00');
    }

    return () => {
      unsubSettings();
      unsubAnn();
      unsubGal();
      unsubRsvp();
      unsubWish();
      unsubViews();
      window.removeEventListener('wedding_custom_data_changed', handleDataChange);
    };
  }, [isOpen]);

  // ============================================================
  // LOGIN (Google sign-in ONLY — no legacy credentials, no hardcoded admins)
  // ============================================================
  const handleGoogleLogin = async () => {
    setLoginError('');
    setIsAuthBusy(true);
    try {
      await signInWithGoogle();
      setIsAdmin(true);
      setIsAuthBusy(false);
    } catch (err: any) {
      setLoginError(err?.message || 'Gagal login dengan Google.');
      setIsAuthBusy(false);
    }
  };

  const handleLogout = () => {
    localStorage.setItem('wedding_admin_logged_in', 'false');
    setIsAdmin(false);
    window.dispatchEvent(new CustomEvent('wedding_admin_state_changed'));
    onClose();
  };

  // ============================================================
  // FORM DATA EDITOR + FIRESTORE PUSH (admin → all guests realtime)
  // ============================================================
  const updateField = (path: string[], value: any) => {
    setFormData((prev: any) => {
      if (!prev) return prev;
      const copy = JSON.parse(JSON.stringify(prev));
      let current = copy;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return copy;
    });
  };

  const showMsg = (m: string, duration = 2800) => {
    setMessage(m);
    setTimeout(() => setMessage(''), duration);
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    // Save countdown
    if (countdownDate) {
      const isoDate = new Date(countdownDate).toISOString();
      localStorage.setItem('wedding_target_date', isoDate);
      window.dispatchEvent(new CustomEvent('wedding_countdown_changed'));
    }

    // Save to localStorage (App.tsx syncs back)
    localStorage.setItem('wedding_custom_data', JSON.stringify(formData));
    window.dispatchEvent(new CustomEvent('wedding_custom_data_changed'));

    // PUSH TO FIRESTORE — propagates to ALL guests in real-time via onSnapshot
    try {
      // 1. Site settings (everything except couples)
      const { coupleA: _a, coupleB: _b, ...siteSettings } = formData;
      await updateSiteSettingsInFirebase(siteSettings);

      // 2. Couples (only if they changed)
      if (formData.coupleA) {
        await updateCoupleInFirebase('coupleA', formData.coupleA);
      }
      if (formData.coupleB) {
        await updateCoupleInFirebase('coupleB', formData.coupleB);
      }

      showMsg('✓ Tersimpan & disiarkan ke semua tamu secara REAL-TIME!');
    } catch (err: any) {
      console.error('Firestore save error:', err);
      showMsg('⚠ Tersimpan lokal tapi gagal sync ke Firestore: ' + (err?.message || ''), 5000);
    }
  };

  // ============================================================
  // BROADCAST NOTIFICATIONS (admin → all guests in realtime)
  // Includes `sender` (who broadcasts) and `audience` (target segment).
  // ============================================================
  const handleBroadcast = async () => {
    if (!broadcastText.trim()) return;
    try {
      await addAnnouncementToFirebase(broadcastTitle.trim() || 'PENGUMUMAN', broadcastText.trim(), {
        icon: broadcastIcon,
        link: broadcastLink.trim(),
        sender: broadcastSender.trim() || 'Keluarga Besar',
        audience: broadcastAudience
      });
      // Also broadcast via legacy localStorage channel (for same-browser tabs)
      window.dispatchEvent(new CustomEvent('wedding_push_notification', {
        detail: {
          id: `local-${Date.now()}`,
          title: broadcastTitle.trim() || 'PENGUMUMAN',
          message: broadcastText.trim(),
          timestamp: Date.now(),
          sender: broadcastSender.trim() || 'Keluarga Besar',
          audience: broadcastAudience
        }
      }));
      setBroadcastText('');
      setBroadcastLink('');
      showMsg('✓ Pengumuman disiarkan ke semua tamu via Firestore!');
    } catch (err: any) {
      showMsg('⚠ Gagal menyiarkan: ' + (err?.message || ''), 5000);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await deleteAnnouncementFromFirebase(id);
      showMsg('Pengumuman dihapus.');
    } catch (e: any) {
      showMsg('Gagal hapus: ' + (e?.message || ''), 4000);
    }
  };

  // ============================================================
  // GALLERY MANAGEMENT (real-time Firestore)
  // ============================================================
  const handleSaveGallery = async () => {
    if (!newGalleryUrl.trim()) return;
    try {
      if (editingGalleryId) {
        await updateGalleryPhotoInFirebase(editingGalleryId, {
          url: newGalleryUrl,
          caption: newGalleryCaption || 'Momen Indah',
          category: newGalleryCategory
        });
        showMsg('Item galeri diperbarui!');
      } else {
        await addGalleryPhotoToFirebase({
          url: newGalleryUrl,
          caption: newGalleryCaption || 'Momen Indah',
          category: newGalleryCategory
        });
        showMsg('Item galeri ditambahkan & langsung tersinkron ke semua tamu!');
      }
      setNewGalleryUrl('');
      setNewGalleryCaption('');
      setNewGalleryCategory('Prewedding');
      setEditingGalleryId(null);
    } catch (err: any) {
      showMsg('Gagal simpan galeri: ' + (err?.message || ''), 5000);
    }
  };

  const handleDeleteGallery = async (id: string) => {
    try {
      await deleteGalleryPhotoFromFirebase(id);
      showMsg('Foto dihapus dari galeri.');
    } catch (err: any) {
      showMsg('Gagal hapus: ' + (err?.message || ''), 4000);
    }
  };

  // ============================================================
  // GUEST LIST (writes to siteSettings.guestList via Firestore)
  // ============================================================
  const persistGuestList = async (updatedGuests: any[]) => {
    if (!formData) return;
    const updated = { ...formData, guestList: updatedGuests };
    setFormData(updated);
    localStorage.setItem('wedding_custom_data', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('wedding_custom_data_changed'));
    try {
      await updateSiteSettingsInFirebase({ guestList: updatedGuests });
    } catch (e: any) {
      showMsg('Tersimpan lokal, Firestore sync gagal: ' + (e?.message || ''), 4000);
    }
  };

  const handleAddOrEditGuest = () => {
    if (!guestNameInput.trim() || !formData) return;
    const current = formData.guestList || [];
    let updated: any[];
    if (editingGuestId) {
      updated = current.map((g: any) => g.id === editingGuestId
        ? { ...g, name: guestNameInput.trim(), invitedCouple: guestCoupleInput, phone: guestPhoneInput.trim() }
        : g);
      showMsg('Tamu diperbarui!');
    } else {
      updated = [...current, {
        id: `guest-${Math.random().toString(36).substring(2, 9)}`,
        name: guestNameInput.trim(),
        invitedCouple: guestCoupleInput,
        phone: guestPhoneInput.trim(),
        visits: 0
      }];
      showMsg('Tamu ditambahkan!');
    }
    persistGuestList(updated);
    setGuestNameInput('');
    setGuestPhoneInput('');
    setGuestCoupleInput('both');
    setEditingGuestId(null);
  };

  const handleDeleteGuest = (id: string) => {
    if (!formData) return;
    const updated = (formData.guestList || []).filter((g: any) => g.id !== id);
    persistGuestList(updated);
    showMsg('Tamu dihapus.');
  };

  // ============================================================
  // SHARE TEMPLATE + MAINTENANCE MODE
  // ============================================================
  const handleSaveShareTemplate = async () => {
    if (!formData) return;
    localStorage.setItem('wedding_custom_data', JSON.stringify(formData));
    window.dispatchEvent(new CustomEvent('wedding_custom_data_changed'));
    try {
      await updateSiteSettingsInFirebase({ shareTemplate: formData.shareTemplate });
      showMsg('Template share tersimpan & tersinkron!');
    } catch (e: any) {
      showMsg('Lokal OK, Firestore gagal: ' + (e?.message || ''), 4000);
    }
  };

  const handleToggleMaintenance = async () => {
    if (!formData) return;
    const updated = { ...formData, maintenanceMode: !formData.maintenanceMode };
    setFormData(updated);
    localStorage.setItem('wedding_custom_data', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('wedding_custom_data_changed'));
    try {
      await updateSiteSettingsInFirebase({ maintenanceMode: updated.maintenanceMode });
      showMsg(updated.maintenanceMode ? 'Mode pemeliharaan AKTIF (semua tamu lihat maintenance).' : 'Mode pemeliharaan NONAKTIF.');
    } catch (e: any) {
      showMsg('Lokal OK, Firestore gagal: ' + (e?.message || ''), 4000);
    }
  };

  // ============================================================
  // TIMELINE / RUNDOWN MANAGEMENT
  // Timeline items live in `siteSettings.timeline` array.
  // Each item: { time, type, couple, title, desc, icon }
  // ============================================================
  const persistTimeline = async (updated: any[]) => {
    if (!formData) return;
    const updatedForm = { ...formData, timeline: updated };
    setFormData(updatedForm);
    localStorage.setItem('wedding_custom_data', JSON.stringify(updatedForm));
    window.dispatchEvent(new CustomEvent('wedding_custom_data_changed'));
    try {
      await updateSiteSettingsInFirebase({ timeline: updated });
    } catch (e: any) {
      showMsg('Lokal OK, Firestore gagal: ' + (e?.message || ''), 4000);
    }
  };

  const handleAddOrEditTimeline = () => {
    if (!timelineForm.title.trim() || !formData) return;
    const current = Array.isArray(formData.timeline) ? [...formData.timeline] : [];
    let updated: any[];
    if (editingTimelineIdx !== null) {
      updated = current.map((t, i) => i === editingTimelineIdx ? { ...timelineForm } : t);
      showMsg('Item timeline diperbarui!');
    } else {
      updated = [...current, { ...timelineForm }];
      showMsg('Item timeline ditambahkan!');
    }
    persistTimeline(updated);
    setTimelineForm({ time: '', type: 'Akad Nikah', couple: 'coupleA', title: '', desc: '', icon: 'heart' });
    setEditingTimelineIdx(null);
  };

  const handleEditTimeline = (idx: number) => {
    if (!formData?.timeline?.[idx]) return;
    const t = formData.timeline[idx];
    setTimelineForm({
      time: t.time || '',
      type: t.type || 'Akad Nikah',
      couple: (t.couple === 'coupleB' ? 'coupleB' : 'coupleA'),
      title: t.title || '',
      desc: t.desc || '',
      icon: t.icon || 'heart'
    });
    setEditingTimelineIdx(idx);
  };

  const handleDeleteTimeline = (idx: number) => {
    if (!formData?.timeline) return;
    const updated = formData.timeline.filter((_: any, i: number) => i !== idx);
    persistTimeline(updated);
    showMsg('Item timeline dihapus.');
  };

  const handleMoveTimeline = (idx: number, dir: -1 | 1) => {
    if (!formData?.timeline) return;
    const arr = [...formData.timeline];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    persistTimeline(arr);
  };

  // ============================================================
  // LIVE STREAMING MANAGEMENT
  // Fields: streamingUrl, streamingEnabled, streamingLiveStart, streamingLiveEnd
  // ============================================================
  const handleSaveStreaming = async () => {
    if (!formData) return;
    const updated = { ...formData };
    localStorage.setItem('wedding_custom_data', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('wedding_custom_data_changed'));
    try {
      await updateSiteSettingsInFirebase({
        streamingUrl: updated.streamingUrl || '',
        streamingEnabled: updated.streamingEnabled ?? true,
        streamingLiveStart: updated.streamingLiveStart || '',
        streamingLiveEnd: updated.streamingLiveEnd || ''
      });
      showMsg('✓ Pengaturan live streaming tersimpan & tersinkron!');
    } catch (e: any) {
      showMsg('Lokal OK, Firestore gagal: ' + (e?.message || ''), 4000);
    }
  };

  const handleToggleStreamingEnabled = async () => {
    if (!formData) return;
    const next = { ...formData, streamingEnabled: !(formData.streamingEnabled ?? true) };
    setFormData(next);
    localStorage.setItem('wedding_custom_data', JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('wedding_custom_data_changed'));
    try {
      await updateSiteSettingsInFirebase({ streamingEnabled: next.streamingEnabled });
    } catch (e) {}
  };

  // ============================================================
  // RSVP / WISH DELETE
  // ============================================================
  const handleDeleteRsvp = async (id: string) => {
    try {
      await deleteRsvpFromFirebase(id);
      showMsg('RSVP dihapus.');
    } catch (e: any) {
      showMsg('Gagal: ' + (e?.message || ''), 4000);
    }
  };
  const handleDeleteWish = async (id: string) => {
    try {
      await deleteGuestbookWishFromFirebase(id);
      showMsg('Ucapan dihapus.');
    } catch (e: any) {
      showMsg('Gagal: ' + (e?.message || ''), 4000);
    }
  };

  if (!isOpen) return null;

  const rsvpStats = {
    total: rsvpList.length,
    attending: rsvpList.filter((r: any) => r.status === 'hadir').length,
    declined: rsvpList.filter((r: any) => r.status === 'tidak_hadir').length,
    totalGuests: rsvpList.reduce((acc: number, r: any) => acc + (r.guestsCount || 0), 0),
    coupleA: rsvpList.filter((r: any) => r.coupleChoice === 'coupleA').length,
    coupleB: rsvpList.filter((r: any) => r.coupleChoice === 'coupleB').length,
    both: rsvpList.filter((r: any) => r.coupleChoice === 'both').length
  };

  const inputCls = "w-full p-2 rounded bg-[#151515] border border-gray-800 text-xs text-white focus:border-[#C5A059] focus:outline-none";
  const labelCls = "block text-[9px] text-[#C5A059] uppercase font-bold mb-1";
  const sectionCls = "p-4 bg-[#0A0A0A] rounded-xl border border-[#C5A059]/20 space-y-4";
  const sectionTitleCls = "font-serif text-xs font-bold text-[#C5A059] uppercase tracking-wider flex items-center space-x-1.5";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-2xl bg-[#151515] border border-[#C5A059]/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#C5A059] to-[#E2C284]" />

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#C5A059]/20">
          <div className="flex items-center space-x-2.5">
            <Settings className="w-5 h-5 text-[#C5A059] animate-spin" style={{ animationDuration: '10s' }} />
            <h4 className="font-serif text-base md:text-lg font-bold text-[#F5F5F5]">
              Sistem Manajemen Undangan (Admin)
            </h4>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
          <AnimatePresence mode="wait">
            {!isAdmin ? (
              /* ========== LOGIN STATE ========== */
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4 max-w-sm mx-auto py-8"
              >
                <div className="text-center py-4 space-y-2">
                  <div className="mx-auto w-12 h-12 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] mb-2">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h5 className="font-serif text-sm font-semibold text-[#F5F5F5]">
                    Login Administrator
                  </h5>
                  <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                    Gunakan akun Google Anda. Email harus terdaftar di koleksi <span className="font-mono text-[#C5A059]">admins</span> di Firestore Firebase.
                  </p>
                </div>

                {loginError && (
                  <div className="flex items-start space-x-2 p-3 bg-red-950/30 text-red-400 rounded-xl text-xs font-medium border border-red-900/30">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                {/* PRIMARY: Google Sign-In */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isAuthBusy}
                  className="w-full py-3 mt-2 bg-white hover:bg-gray-100 text-gray-900 font-bold rounded-xl text-xs tracking-wider uppercase transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-60"
                >
                  {isAuthBusy ? (
                    <span>Memproses...</span>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Masuk dengan Google</span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-gray-400 italic text-center pt-3 leading-relaxed">
                  Login dengan akun Google yang sudah terdaftar sebagai admin.
                  <br />
                  Hubungi developer untuk mendaftarkan email admin baru.
                </p>
              </motion.div>
            ) : (
              /* ========== LOGGED-IN DASHBOARD ========== */
              <motion.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {message && (
                  <div className="p-3 bg-emerald-950/30 text-emerald-400 rounded-xl text-xs font-semibold border border-emerald-900/30">
                    {message}
                  </div>
                )}

                {/* Tabs — comprehensive navigation with icons */}
                <div className="flex flex-wrap gap-1 border-b border-[#C5A059]/20 pb-3">
                  {([
                    ['general', 'Umum', Settings],
                    ['coupleA', 'Pasangan A', Heart],
                    ['coupleB', 'Pasangan B', Heart],
                    ['theme', 'Tema & BG', Palette],
                    ['gallery', 'Galeri', Image],
                    ['timeline', 'Timeline', ListOrdered],
                    ['notif', 'Pengumuman', Megaphone],
                    ['guestbook', 'Buku Tamu', MessageSquare],
                    ['rsvp_stats', 'RSVP', BarChart3],
                    ['guests_share', 'Tamu & Share', Users],
                    ['streaming', 'Streaming', Video]
                  ] as [Tab, string, React.ComponentType<{ className?: string }>][]).map(([tab, label, Icon]) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] md:text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                        activeTab === tab ? 'bg-[#C5A059] text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>

                {formData && (
                  <div className="space-y-6">

                    {/* ====================== TAB: COUPLE A ====================== */}
                    {activeTab === 'coupleA' && (
                      <form onSubmit={handleSaveChanges} className="space-y-5">
                        <div className={sectionCls}>
                          <h5 className={sectionTitleCls}>
                            <Heart className="w-4 h-4 text-pink-500 fill-pink-500/20" />
                            <span>Profil Pengantin Aria & Bella (Mempelai I)</span>
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Groom */}
                            <div className="space-y-3 p-3 bg-[#151515] rounded-lg border border-white/5">
                              <span className="block text-[10px] uppercase font-bold text-gray-500">Mempelai Pria</span>
                              <div><label className={labelCls}>Nama Lengkap & Gelar</label><input className={inputCls} value={formData.coupleA?.groom?.fullName || ''} onChange={(e) => updateField(['coupleA', 'groom', 'fullName'], e.target.value)} /></div>
                              <div><label className={labelCls}>Nama Panggilan</label><input className={inputCls} value={formData.coupleA?.groom?.nickname || ''} onChange={(e) => updateField(['coupleA', 'groom', 'nickname'], e.target.value)} /></div>
                              <div><label className={labelCls}>Nama Ayah</label><input className={inputCls} value={formData.coupleA?.groom?.fatherName || ''} onChange={(e) => updateField(['coupleA', 'groom', 'fatherName'], e.target.value)} /></div>
                              <div><label className={labelCls}>Nama Ibu</label><input className={inputCls} value={formData.coupleA?.groom?.motherName || ''} onChange={(e) => updateField(['coupleA', 'groom', 'motherName'], e.target.value)} /></div>
                              <div><label className={labelCls}>Urutan Anak</label><input className={inputCls} value={formData.coupleA?.groom?.childOrdinal || ''} onChange={(e) => updateField(['coupleA', 'groom', 'childOrdinal'], e.target.value)} /></div>
                              <div><label className={labelCls}>Instagram</label><input className={inputCls} value={formData.coupleA?.groom?.instagram || ''} onChange={(e) => updateField(['coupleA', 'groom', 'instagram'], e.target.value)} /></div>
                              <div><label className={labelCls}>URL Foto Profil</label><input className={inputCls} value={formData.coupleA?.groom?.avatar || ''} onChange={(e) => updateField(['coupleA', 'groom', 'avatar'], e.target.value)} placeholder="/images/BALI-COUPLE-1.png" /></div>
                            </div>
                            {/* Bride */}
                            <div className="space-y-3 p-3 bg-[#151515] rounded-lg border border-white/5">
                              <span className="block text-[10px] uppercase font-bold text-gray-500">Mempelai Wanita</span>
                              <div><label className={labelCls}>Nama Lengkap & Gelar</label><input className={inputCls} value={formData.coupleA?.bride?.fullName || ''} onChange={(e) => updateField(['coupleA', 'bride', 'fullName'], e.target.value)} /></div>
                              <div><label className={labelCls}>Nama Panggilan</label><input className={inputCls} value={formData.coupleA?.bride?.nickname || ''} onChange={(e) => updateField(['coupleA', 'bride', 'nickname'], e.target.value)} /></div>
                              <div><label className={labelCls}>Nama Ayah</label><input className={inputCls} value={formData.coupleA?.bride?.fatherName || ''} onChange={(e) => updateField(['coupleA', 'bride', 'fatherName'], e.target.value)} /></div>
                              <div><label className={labelCls}>Nama Ibu</label><input className={inputCls} value={formData.coupleA?.bride?.motherName || ''} onChange={(e) => updateField(['coupleA', 'bride', 'motherName'], e.target.value)} /></div>
                              <div><label className={labelCls}>Urutan Anak</label><input className={inputCls} value={formData.coupleA?.bride?.childOrdinal || ''} onChange={(e) => updateField(['coupleA', 'bride', 'childOrdinal'], e.target.value)} /></div>
                              <div><label className={labelCls}>Instagram</label><input className={inputCls} value={formData.coupleA?.bride?.instagram || ''} onChange={(e) => updateField(['coupleA', 'bride', 'instagram'], e.target.value)} /></div>
                              <div><label className={labelCls}>URL Foto Profil</label><input className={inputCls} value={formData.coupleA?.bride?.avatar || ''} onChange={(e) => updateField(['coupleA', 'bride', 'avatar'], e.target.value)} placeholder="/images/BALI-COUPLE-2.webp" /></div>
                            </div>
                          </div>
                          <div><label className={labelCls}>Quote / Ayat</label><textarea rows={2} className={inputCls} value={formData.coupleA?.quote || ''} onChange={(e) => updateField(['coupleA', 'quote'], e.target.value)} /></div>
                          <div><label className={labelCls}>Sumber Quote</label><input className={inputCls} value={formData.coupleA?.quoteAuthor || ''} onChange={(e) => updateField(['coupleA', 'quoteAuthor'], e.target.value)} /></div>
                        </div>

                        {/* Akad */}
                        <div className={sectionCls}>
                          <h5 className={sectionTitleCls}><Calendar className="w-4 h-4" /><span>Akad Nikah</span></h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div><label className={labelCls}>Tanggal (YYYY-MM-DD)</label><input className={inputCls} value={formData.coupleA?.akad?.date || ''} onChange={(e) => updateField(['coupleA', 'akad', 'date'], e.target.value)} /></div>
                            <div><label className={labelCls}>Waktu (WITA)</label><input className={inputCls} value={formData.coupleA?.akad?.time || ''} onChange={(e) => updateField(['coupleA', 'akad', 'time'], e.target.value)} /></div>
                            <div><label className={labelCls}>Tempat</label><input className={inputCls} value={formData.coupleA?.akad?.venue || ''} onChange={(e) => updateField(['coupleA', 'akad', 'venue'], e.target.value)} /></div>
                            <div><label className={labelCls}>Alamat</label><input className={inputCls} value={formData.coupleA?.akad?.address || ''} onChange={(e) => updateField(['coupleA', 'akad', 'address'], e.target.value)} /></div>
                            <div className="md:col-span-2"><label className={labelCls}>Link Google Maps</label><input className={inputCls} value={formData.coupleA?.akad?.mapsLink || ''} onChange={(e) => updateField(['coupleA', 'akad', 'mapsLink'], e.target.value)} /></div>
                            <div className="md:col-span-2"><label className={labelCls}>URL Google Calendar</label><input className={inputCls} value={formData.coupleA?.akad?.googleCalendarUrl || ''} onChange={(e) => updateField(['coupleA', 'akad', 'googleCalendarUrl'], e.target.value)} /></div>
                          </div>
                        </div>

                        {/* Resepsi */}
                        <div className={sectionCls}>
                          <h5 className={sectionTitleCls}><Calendar className="w-4 h-4" /><span>Resepsi Pernikahan</span></h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div><label className={labelCls}>Tanggal (YYYY-MM-DD)</label><input className={inputCls} value={formData.coupleA?.resepsi?.date || ''} onChange={(e) => updateField(['coupleA', 'resepsi', 'date'], e.target.value)} /></div>
                            <div><label className={labelCls}>Waktu (WITA)</label><input className={inputCls} value={formData.coupleA?.resepsi?.time || ''} onChange={(e) => updateField(['coupleA', 'resepsi', 'time'], e.target.value)} /></div>
                            <div><label className={labelCls}>Tempat</label><input className={inputCls} value={formData.coupleA?.resepsi?.venue || ''} onChange={(e) => updateField(['coupleA', 'resepsi', 'venue'], e.target.value)} /></div>
                            <div><label className={labelCls}>Alamat</label><input className={inputCls} value={formData.coupleA?.resepsi?.address || ''} onChange={(e) => updateField(['coupleA', 'resepsi', 'address'], e.target.value)} /></div>
                            <div><label className={labelCls}>Dress Code</label><input className={inputCls} value={formData.coupleA?.resepsi?.dressCode || ''} onChange={(e) => updateField(['coupleA', 'resepsi', 'dressCode'], e.target.value)} /></div>
                            <div><label className={labelCls}>Link Maps</label><input className={inputCls} value={formData.coupleA?.resepsi?.mapsLink || ''} onChange={(e) => updateField(['coupleA', 'resepsi', 'mapsLink'], e.target.value)} /></div>
                            <div className="md:col-span-2"><label className={labelCls}>URL Google Calendar</label><input className={inputCls} value={formData.coupleA?.resepsi?.googleCalendarUrl || ''} onChange={(e) => updateField(['coupleA', 'resepsi', 'googleCalendarUrl'], e.target.value)} /></div>
                          </div>
                        </div>

                        {/* Gift */}
                        <div className={sectionCls}>
                          <h5 className={sectionTitleCls}><Landmark className="w-4 h-4" /><span>Amplop Digital</span></h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div><label className={labelCls}>Nama Bank</label><input className={inputCls} value={formData.coupleA?.gift?.bankName || ''} onChange={(e) => updateField(['coupleA', 'gift', 'bankName'], e.target.value)} /></div>
                            <div><label className={labelCls}>No. Rekening</label><input className={inputCls} value={formData.coupleA?.gift?.accountNumber || ''} onChange={(e) => updateField(['coupleA', 'gift', 'accountNumber'], e.target.value)} /></div>
                            <div><label className={labelCls}>Atas Nama</label><input className={inputCls} value={formData.coupleA?.gift?.accountHolder || ''} onChange={(e) => updateField(['coupleA', 'gift', 'accountHolder'], e.target.value)} /></div>
                            <div><label className={labelCls}>URL QRIS</label><input className={inputCls} value={formData.coupleA?.gift?.qrisUrl || ''} onChange={(e) => updateField(['coupleA', 'gift', 'qrisUrl'], e.target.value)} /></div>
                          </div>
                        </div>

                        <button type="submit" className="w-full py-3 bg-[#C5A059] hover:bg-[#b38e4b] text-black font-bold rounded-xl text-xs tracking-wider uppercase transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center space-x-1.5">
                          <Save className="w-4 h-4" />
                          <span>Simpan & Siarkan (Real-time ke Semua Tamu)</span>
                        </button>
                      </form>
                    )}

                    {/* ====================== TAB: COUPLE B (mirror of A) ====================== */}
                    {activeTab === 'coupleB' && (
                      <form onSubmit={handleSaveChanges} className="space-y-5">
                        <div className={sectionCls}>
                          <h5 className={sectionTitleCls}>
                            <Heart className="w-4 h-4 text-blue-400 fill-blue-500/20" />
                            <span>Profil Pengantin Devan & Elina (Mempelai II)</span>
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3 p-3 bg-[#151515] rounded-lg border border-white/5">
                              <span className="block text-[10px] uppercase font-bold text-gray-500">Mempelai Pria</span>
                              <div><label className={labelCls}>Nama Lengkap & Gelar</label><input className={inputCls} value={formData.coupleB?.groom?.fullName || ''} onChange={(e) => updateField(['coupleB', 'groom', 'fullName'], e.target.value)} /></div>
                              <div><label className={labelCls}>Nama Panggilan</label><input className={inputCls} value={formData.coupleB?.groom?.nickname || ''} onChange={(e) => updateField(['coupleB', 'groom', 'nickname'], e.target.value)} /></div>
                              <div><label className={labelCls}>Nama Ayah</label><input className={inputCls} value={formData.coupleB?.groom?.fatherName || ''} onChange={(e) => updateField(['coupleB', 'groom', 'fatherName'], e.target.value)} /></div>
                              <div><label className={labelCls}>Nama Ibu</label><input className={inputCls} value={formData.coupleB?.groom?.motherName || ''} onChange={(e) => updateField(['coupleB', 'groom', 'motherName'], e.target.value)} /></div>
                              <div><label className={labelCls}>Urutan Anak</label><input className={inputCls} value={formData.coupleB?.groom?.childOrdinal || ''} onChange={(e) => updateField(['coupleB', 'groom', 'childOrdinal'], e.target.value)} /></div>
                              <div><label className={labelCls}>Instagram</label><input className={inputCls} value={formData.coupleB?.groom?.instagram || ''} onChange={(e) => updateField(['coupleB', 'groom', 'instagram'], e.target.value)} /></div>
                              <div><label className={labelCls}>URL Foto Profil</label><input className={inputCls} value={formData.coupleB?.groom?.avatar || ''} onChange={(e) => updateField(['coupleB', 'groom', 'avatar'], e.target.value)} placeholder="/images/BALI-COUPLE-3.png" /></div>
                            </div>
                            <div className="space-y-3 p-3 bg-[#151515] rounded-lg border border-white/5">
                              <span className="block text-[10px] uppercase font-bold text-gray-500">Mempelai Wanita</span>
                              <div><label className={labelCls}>Nama Lengkap & Gelar</label><input className={inputCls} value={formData.coupleB?.bride?.fullName || ''} onChange={(e) => updateField(['coupleB', 'bride', 'fullName'], e.target.value)} /></div>
                              <div><label className={labelCls}>Nama Panggilan</label><input className={inputCls} value={formData.coupleB?.bride?.nickname || ''} onChange={(e) => updateField(['coupleB', 'bride', 'nickname'], e.target.value)} /></div>
                              <div><label className={labelCls}>Nama Ayah</label><input className={inputCls} value={formData.coupleB?.bride?.fatherName || ''} onChange={(e) => updateField(['coupleB', 'bride', 'fatherName'], e.target.value)} /></div>
                              <div><label className={labelCls}>Nama Ibu</label><input className={inputCls} value={formData.coupleB?.bride?.motherName || ''} onChange={(e) => updateField(['coupleB', 'bride', 'motherName'], e.target.value)} /></div>
                              <div><label className={labelCls}>Urutan Anak</label><input className={inputCls} value={formData.coupleB?.bride?.childOrdinal || ''} onChange={(e) => updateField(['coupleB', 'bride', 'childOrdinal'], e.target.value)} /></div>
                              <div><label className={labelCls}>Instagram</label><input className={inputCls} value={formData.coupleB?.bride?.instagram || ''} onChange={(e) => updateField(['coupleB', 'bride', 'instagram'], e.target.value)} /></div>
                              <div><label className={labelCls}>URL Foto Profil</label><input className={inputCls} value={formData.coupleB?.bride?.avatar || ''} onChange={(e) => updateField(['coupleB', 'bride', 'avatar'], e.target.value)} placeholder="/images/BALI-COUPLE-4.webp" /></div>
                            </div>
                          </div>
                          <div><label className={labelCls}>Quote / Ayat</label><textarea rows={2} className={inputCls} value={formData.coupleB?.quote || ''} onChange={(e) => updateField(['coupleB', 'quote'], e.target.value)} /></div>
                          <div><label className={labelCls}>Sumber Quote</label><input className={inputCls} value={formData.coupleB?.quoteAuthor || ''} onChange={(e) => updateField(['coupleB', 'quoteAuthor'], e.target.value)} /></div>
                        </div>
                        <div className={sectionCls}>
                          <h5 className={sectionTitleCls}><Calendar className="w-4 h-4" /><span>Akad Nikah</span></h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div><label className={labelCls}>Tanggal</label><input className={inputCls} value={formData.coupleB?.akad?.date || ''} onChange={(e) => updateField(['coupleB', 'akad', 'date'], e.target.value)} /></div>
                            <div><label className={labelCls}>Waktu (WITA)</label><input className={inputCls} value={formData.coupleB?.akad?.time || ''} onChange={(e) => updateField(['coupleB', 'akad', 'time'], e.target.value)} /></div>
                            <div><label className={labelCls}>Tempat</label><input className={inputCls} value={formData.coupleB?.akad?.venue || ''} onChange={(e) => updateField(['coupleB', 'akad', 'venue'], e.target.value)} /></div>
                            <div><label className={labelCls}>Alamat</label><input className={inputCls} value={formData.coupleB?.akad?.address || ''} onChange={(e) => updateField(['coupleB', 'akad', 'address'], e.target.value)} /></div>
                            <div className="md:col-span-2"><label className={labelCls}>URL Google Calendar</label><input className={inputCls} value={formData.coupleB?.akad?.googleCalendarUrl || ''} onChange={(e) => updateField(['coupleB', 'akad', 'googleCalendarUrl'], e.target.value)} /></div>
                          </div>
                        </div>
                        <div className={sectionCls}>
                          <h5 className={sectionTitleCls}><Calendar className="w-4 h-4" /><span>Resepsi</span></h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div><label className={labelCls}>Tanggal</label><input className={inputCls} value={formData.coupleB?.resepsi?.date || ''} onChange={(e) => updateField(['coupleB', 'resepsi', 'date'], e.target.value)} /></div>
                            <div><label className={labelCls}>Waktu (WITA)</label><input className={inputCls} value={formData.coupleB?.resepsi?.time || ''} onChange={(e) => updateField(['coupleB', 'resepsi', 'time'], e.target.value)} /></div>
                            <div><label className={labelCls}>Tempat</label><input className={inputCls} value={formData.coupleB?.resepsi?.venue || ''} onChange={(e) => updateField(['coupleB', 'resepsi', 'venue'], e.target.value)} /></div>
                            <div><label className={labelCls}>Dress Code</label><input className={inputCls} value={formData.coupleB?.resepsi?.dressCode || ''} onChange={(e) => updateField(['coupleB', 'resepsi', 'dressCode'], e.target.value)} /></div>
                            <div className="md:col-span-2"><label className={labelCls}>URL Google Calendar</label><input className={inputCls} value={formData.coupleB?.resepsi?.googleCalendarUrl || ''} onChange={(e) => updateField(['coupleB', 'resepsi', 'googleCalendarUrl'], e.target.value)} /></div>
                          </div>
                        </div>
                        <div className={sectionCls}>
                          <h5 className={sectionTitleCls}><Landmark className="w-4 h-4" /><span>Amplop Digital</span></h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div><label className={labelCls}>Nama Bank</label><input className={inputCls} value={formData.coupleB?.gift?.bankName || ''} onChange={(e) => updateField(['coupleB', 'gift', 'bankName'], e.target.value)} /></div>
                            <div><label className={labelCls}>No. Rekening</label><input className={inputCls} value={formData.coupleB?.gift?.accountNumber || ''} onChange={(e) => updateField(['coupleB', 'gift', 'accountNumber'], e.target.value)} /></div>
                            <div><label className={labelCls}>Atas Nama</label><input className={inputCls} value={formData.coupleB?.gift?.accountHolder || ''} onChange={(e) => updateField(['coupleB', 'gift', 'accountHolder'], e.target.value)} /></div>
                            <div><label className={labelCls}>URL QRIS</label><input className={inputCls} value={formData.coupleB?.gift?.qrisUrl || ''} onChange={(e) => updateField(['coupleB', 'gift', 'qrisUrl'], e.target.value)} /></div>
                          </div>
                        </div>
                        <button type="submit" className="w-full py-3 bg-[#C5A059] hover:bg-[#b38e4b] text-black font-bold rounded-xl text-xs tracking-wider uppercase transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center space-x-1.5">
                          <Save className="w-4 h-4" />
                          <span>Simpan & Siarkan (Real-time)</span>
                        </button>
                      </form>
                    )}

                    {/* ====================== TAB: GENERAL ====================== */}
                    {activeTab === 'general' && (
                      <form onSubmit={handleSaveChanges} className="space-y-4">
                        <div className={sectionCls}>
                          <h5 className={sectionTitleCls}><Music className="w-4 h-4" /><span>Tampilan & Musik Latar</span></h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className={labelCls}>Judul Undangan</label><input className={inputCls} value={formData.title || ''} onChange={(e) => updateField(['title'], e.target.value)} /></div>
                            <div><label className={labelCls}>Teks Tanggal Utama</label><input className={inputCls} value={formData.dateText || ''} onChange={(e) => updateField(['dateText'], e.target.value)} /></div>
                            <div className="md:col-span-2"><label className={labelCls}>URL Musik Latar (MP3)</label><input className={inputCls} value={formData.bgMusicUrl || ''} onChange={(e) => updateField(['bgMusicUrl'], e.target.value)} /></div>
                            <div className="md:col-span-2"><label className={labelCls}>Judul Musik</label><input className={inputCls} value={formData.bgMusicTitle || ''} onChange={(e) => updateField(['bgMusicTitle'], e.target.value)} /></div>
                          </div>
                        </div>

                        <div className={sectionCls}>
                          <h5 className={sectionTitleCls}><MapPin className="w-4 h-4" /><span>Lokasi & Peta</span></h5>
                          <div className="space-y-3">
                            <div><label className={labelCls}>Nama Tempat Bersama</label><input className={inputCls} value={formData.commonVenue || ''} onChange={(e) => updateField(['commonVenue'], e.target.value)} /></div>
                            <div><label className={labelCls}>Alamat Lengkap</label><input className={inputCls} value={formData.commonAddress || ''} onChange={(e) => updateField(['commonAddress'], e.target.value)} /></div>
                            <div><label className={labelCls}>Link Google Maps</label><input className={inputCls} value={formData.commonMapsLink || ''} onChange={(e) => updateField(['commonMapsLink'], e.target.value)} /></div>
                          </div>
                        </div>

                        <div className={sectionCls}>
                          <h5 className={sectionTitleCls}><Type className="w-4 h-4" /><span>Section Titles</span></h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div><label className={labelCls}>Save The Date</label><input className={inputCls} value={formData.sectionTitleSaveTheDate || ''} onChange={(e) => updateField(['sectionTitleSaveTheDate'], e.target.value)} /></div>
                            <div><label className={labelCls}>Akad</label><input className={inputCls} value={formData.sectionTitleAkad || ''} onChange={(e) => updateField(['sectionTitleAkad'], e.target.value)} /></div>
                            <div><label className={labelCls}>Resepsi</label><input className={inputCls} value={formData.sectionTitleResepsi || ''} onChange={(e) => updateField(['sectionTitleResepsi'], e.target.value)} /></div>
                            <div><label className={labelCls}>Story</label><input className={inputCls} value={formData.sectionTitleStory || ''} onChange={(e) => updateField(['sectionTitleStory'], e.target.value)} /></div>
                            <div><label className={labelCls}>Galeri</label><input className={inputCls} value={formData.sectionTitleGallery || ''} onChange={(e) => updateField(['sectionTitleGallery'], e.target.value)} /></div>
                            <div><label className={labelCls}>Gift</label><input className={inputCls} value={formData.sectionTitleGift || ''} onChange={(e) => updateField(['sectionTitleGift'], e.target.value)} /></div>
                            <div className="md:col-span-2"><label className={labelCls}>Guestbook</label><input className={inputCls} value={formData.sectionTitleWishes || ''} onChange={(e) => updateField(['sectionTitleWishes'], e.target.value)} /></div>
                          </div>
                        </div>

                        <div className={sectionCls}>
                          <h5 className={sectionTitleCls}><Heart className="w-4 h-4 text-rose-500" /><span>Pesan Terima Kasih Footer</span></h5>
                          <textarea rows={3} className={inputCls} value={formData.footerThankYou || ''} onChange={(e) => updateField(['footerThankYou'], e.target.value)} />
                        </div>

                        <div className={sectionCls}>
                          <h5 className={sectionTitleCls}><Calendar className="w-4 h-4" /><span>Waktu Countdown Target (WITA)</span></h5>
                          <input type="datetime-local" value={countdownDate} onChange={(e) => setCountdownDate(e.target.value)} className={inputCls} />
                        </div>

                        <button type="submit" className="w-full py-3 bg-[#C5A059] hover:bg-[#b38e4b] text-black font-bold rounded-xl text-xs tracking-wider uppercase transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center space-x-1.5">
                          <Save className="w-4 h-4" />
                          <span>Simpan & Siarkan ke Semua Tamu</span>
                        </button>
                      </form>
                    )}

                    {/* ====================== TAB: NOTIF (Broadcasts) ====================== */}
                    {activeTab === 'notif' && (
                      <div className="space-y-4">
                        <div className={sectionCls}>
                          <h5 className={sectionTitleCls}><Megaphone className="w-4 h-4 text-amber-500" /><span>Siarkan Pengumuman ke Semua Tamu</span></h5>
                          <p className="text-[10px] text-gray-500 leading-tight">
                            Pengumuman dikirim ke Firestore <span className="font-mono text-[#C5A059]">announcements</span> collection.
                            Semua tamu yang membuka undangan akan langsung melihat toast + bunyi chime + notifikasi OS (jika diizinkan) tanpa refresh.
                          </p>
                          <div className="space-y-3">
                            <div><label className={labelCls}>Judul Pengumuman</label><input className={inputCls} value={broadcastTitle} onChange={(e) => setBroadcastTitle(e.target.value)} placeholder="PENGUMUMAN" /></div>

                            {/* Nama Pengirim (sender) — quick-pick chips + free text */}
                            <div>
                              <label className={labelCls}>Nama Pengirim (siapa yang menyiarakan)</label>
                              <input className={inputCls} value={broadcastSender} onChange={(e) => setBroadcastSender(e.target.value)} placeholder="Keluarga Besar / Developer / Panitia / ..." />
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {['Keluarga Besar', 'Developer', 'Panitia', 'Klien'].map((preset) => (
                                  <button
                                    key={preset}
                                    type="button"
                                    onClick={() => setBroadcastSender(preset)}
                                    className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                                      broadcastSender === preset
                                        ? 'bg-[#C5A059] text-black border-[#C5A059]'
                                        : 'bg-[#0A0A0A] text-[#C5A059] border-[#C5A059]/30 hover:border-[#C5A059]/60'
                                    }`}
                                  >
                                    {preset}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Target Pelanggan (audience) */}
                            <div>
                              <label className={labelCls}>Target Pelanggan (audience)</label>
                              <select
                                className={inputCls}
                                value={broadcastAudience}
                                onChange={(e) => setBroadcastAudience(e.target.value as AnnouncementAudience)}
                              >
                                <option value="all">Semua Tamu</option>
                                <option value="coupleA">Tamu Couple A</option>
                                <option value="coupleB">Tamu Couple B</option>
                                <option value="vip">VIP</option>
                              </select>
                              <p className="text-[9px] text-gray-500 italic mt-1">*Untuk saat ini semua tamu menerima semua pengumuman; field ini tersimpan untuk filtering mendatang.</p>
                            </div>

                            <div>
                              <label className={labelCls}>Ikon (opsional)</label>
                              <select className={inputCls} value={broadcastIcon} onChange={(e) => setBroadcastIcon(e.target.value)}>
                                <option value="bell">Bell</option>
                                <option value="sparkles">Sparkles</option>
                                <option value="heart">Heart</option>
                                <option value="calendar">Calendar</option>
                                <option value="info">Info</option>
                              </select>
                            </div>
                            <div><label className={labelCls}>Isi Pesan</label><textarea rows={3} className={inputCls} value={broadcastText} onChange={(e) => setBroadcastText(e.target.value)} placeholder="Tulis pesan pengumuman..." /></div>
                            <div><label className={labelCls}>Link Tautan (opsional)</label><input className={inputCls} value={broadcastLink} onChange={(e) => setBroadcastLink(e.target.value)} placeholder="https://..." /></div>
                            <button
                              type="button"
                              onClick={handleBroadcast}
                              disabled={!broadcastText.trim()}
                              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-black rounded-lg text-xs font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center space-x-1"
                            >
                              <Megaphone className="w-3.5 h-3.5" />
                              <span>Siarkan ke Semua Tamu (Real-time)</span>
                            </button>
                          </div>
                        </div>

                        <div className={sectionCls}>
                          <h5 className={sectionTitleCls}><Bell className="w-4 h-4 text-amber-500" /><span>Daftar Riwayat Siaran ({announcements.length})</span></h5>
                          <div className="max-h-[240px] overflow-y-auto space-y-2 pr-1">
                            {announcements.length === 0 ? (
                              <p className="text-center py-6 text-xs text-gray-500 italic font-mono">Belum ada siaran aktif.</p>
                            ) : announcements.map((item) => {
                              const viewers = views[item.id] || [];
                              return (
                                <div key={item.id} className="p-3 rounded-lg bg-[#151515] border border-white/5 space-y-2 relative">
                                  <div className="flex items-start justify-between">
                                    <div className="space-y-0.5">
                                      <span className="text-[10px] font-mono font-bold text-[#C5A059] uppercase bg-[#C5A059]/10 px-1.5 py-0.5 rounded border border-[#C5A059]/20">
                                        {item.title}
                                      </span>
                                      <span className="block text-[9px] text-gray-500 font-mono">
                                        {item.timestamp ? new Date(item.timestamp).toLocaleString('id-ID') : ''}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteAnnouncement(item.id)}
                                      className="p-1 rounded bg-red-950/40 text-red-400 hover:bg-red-900 hover:text-white border border-red-500/20 transition-all cursor-pointer text-[10px] uppercase font-bold font-mono px-2"
                                    >
                                      Hapus
                                    </button>
                                  </div>
                                  {/* Sender + audience badges */}
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/40">
                                      <User className="w-2.5 h-2.5" />
                                      <span>{item.sender || 'Keluarga Besar'}</span>
                                    </span>
                                    {item.audience && item.audience !== 'all' && (
                                      <span className="inline-flex items-center text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-gray-300 border border-white/10">
                                        untuk {item.audience === 'coupleA' ? 'Couple A' : item.audience === 'coupleB' ? 'Couple B' : 'VIP'}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-300 leading-relaxed font-sans">{item.message}</p>
                                  <div className="pt-2 border-t border-white/5 space-y-1">
                                    <span className="text-[9px] font-mono text-[#C5A059] block uppercase font-bold">
                                      Pelacakan Penonton ({viewers.length}):
                                    </span>
                                    {viewers.length === 0 ? (
                                      <span className="text-[9px] font-mono text-gray-500 italic">Belum ada tamu yang melihat pengumuman ini.</span>
                                    ) : (
                                      <span className="text-[10px] font-mono text-gray-400 block leading-normal break-words">{viewers.join(', ')}</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ====================== TAB: GUESTBOOK (Moderasi Ucapan) ====================== */}
                    {activeTab === 'guestbook' && (
                      <div className="space-y-4">
                        <div className={sectionCls}>
                          <h5 className={sectionTitleCls}><MessageSquare className="w-4 h-4 text-[#C5A059]" /><span>Kelola Ucapan ({wishes.length})</span></h5>
                          <p className="text-[10px] text-gray-500 leading-tight">
                            Moderasi buku tamu — hapus ucapan yang tidak pantas. Daftar ini real-time dari Firestore <span className="font-mono text-[#C5A059]">guestbook</span> collection.
                          </p>
                          <div className="max-h-[420px] overflow-y-auto pr-1 space-y-2 border border-[#C5A059]/15 rounded-xl p-2 bg-[#0A0A0A]">
                            {wishes.length === 0 ? (
                              <p className="text-center py-8 text-xs text-gray-500 italic font-mono">Guestbook kosong.</p>
                            ) : wishes.map((w) => (
                              <div key={w.id} className="p-2.5 rounded-lg bg-[#151515] border border-white/5 flex items-start justify-between space-x-3 text-xs">
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-bold text-[#F5F5F5]">{w.name}</span>
                                    <span className="text-[9px] text-[#C5A059] font-mono px-1.5 py-0.2 bg-[#C5A059]/10 rounded border border-[#C5A059]/20">
                                      {w.coupleChoice === 'both' ? 'Keduanya' : w.coupleChoice === 'coupleA' ? 'Aria-Bella' : 'Devan-Elina'}
                                    </span>
                                    {w.likes ? <span className="text-[9px] text-pink-400 font-mono">♥ {w.likes}</span> : null}
                                  </div>
                                  <p className="text-[#E5E5E5]/70 line-clamp-2 leading-relaxed italic pr-2">&ldquo;{w.wishes}&rdquo;</p>
                                  {w.timestamp && (
                                    <span className="block text-[9px] text-gray-600 font-mono">{new Date(w.timestamp).toLocaleString('id-ID')}</span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteWish(w.id)}
                                  className="p-2 rounded-lg text-gray-500 hover:bg-red-950/30 hover:text-red-400 transition-all cursor-pointer flex-shrink-0"
                                  title="Hapus Ucapan"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ====================== TAB: THEME (Tema & Backgrounds) ====================== */}
                    {activeTab === 'theme' && (
                      <form onSubmit={handleSaveChanges} className="space-y-4">
                        <div className={sectionCls}>
                          <h5 className={sectionTitleCls}><Sparkles className="w-4 h-4" /><span>Identitas Visual & Tema</span></h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className={labelCls}>Teks Monogram</label><input className={inputCls} value={formData.monogramText || 'ABDE'} onChange={(e) => updateField(['monogramText'], e.target.value)} /></div>
                            <div>
                              <label className={labelCls}>Tema Default</label>
                              <select className={inputCls} value={formData.defaultTheme || 'plum-gold'} onChange={(e) => updateField(['defaultTheme'], e.target.value)}>
                                <option value="plum-gold">Royal Plum &amp; Gold</option>
                                <option value="sage-cream">Sage Green &amp; Cream</option>
                                <option value="navy-rose">Midnight Navy &amp; Rose</option>
                                <option value="ivory-blush">Ivory &amp; Blush</option>
                                <option value="elegant-black">Elegant Black</option>
                                <option value="minimalist-white">Minimalist White</option>
                              </select>
                            </div>
                            <div className="md:col-span-2">
                              <label className={labelCls}>URL Logo Gambar (default: /images/BALI-ICON.webp)</label>
                              <input className={inputCls} value={formData.logoUrl || ''} onChange={(e) => updateField(['logoUrl'], e.target.value)} />
                            </div>
                          </div>
                        </div>

                        <div className={sectionCls}>
                          <h5 className={sectionTitleCls}><Image className="w-4 h-4" /><span>Background Images</span></h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div><label className={labelCls}>Hero Cover (bgCoverUrl)</label><input className={inputCls} value={formData.bgCoverUrl || ''} onChange={(e) => updateField(['bgCoverUrl'], e.target.value)} /></div>
                            <div><label className={labelCls}>Akad BG (bgAkadUrl)</label><input className={inputCls} value={formData.bgAkadUrl || ''} onChange={(e) => updateField(['bgAkadUrl'], e.target.value)} /></div>
                            <div><label className={labelCls}>Resepsi BG (bgResepsiUrl)</label><input className={inputCls} value={formData.bgResepsiUrl || ''} onChange={(e) => updateField(['bgResepsiUrl'], e.target.value)} /></div>
                            <div><label className={labelCls}>Story BG (bgStoryUrl)</label><input className={inputCls} value={formData.bgStoryUrl || ''} onChange={(e) => updateField(['bgStoryUrl'], e.target.value)} /></div>
                            <div><label className={labelCls}>Gift BG (bgGiftUrl)</label><input className={inputCls} value={formData.bgGiftUrl || ''} onChange={(e) => updateField(['bgGiftUrl'], e.target.value)} /></div>
                          </div>
                        </div>

                        <button type="submit" className="w-full py-3 bg-[#C5A059] hover:bg-[#b38e4b] text-black font-bold rounded-xl text-xs tracking-wider uppercase transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center space-x-1.5">
                          <Save className="w-4 h-4" />
                          <span>Simpan & Siarkan ke Semua Tamu</span>
                        </button>
                      </form>
                    )}

                    {/* ====================== TAB: TIMELINE (Rundown CRUD) ====================== */}
                    {activeTab === 'timeline' && (
                      <div className="space-y-4">
                        <div className={sectionCls}>
                          <h5 className={sectionTitleCls}><ListOrdered className="w-4 h-4" /><span>{editingTimelineIdx !== null ? 'Edit Item Rundown' : 'Tambah Item Rundown'}</span></h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div><label className={labelCls}>Waktu (mis. 08:00 - 09:30)</label><input className={inputCls} value={timelineForm.time} onChange={(e) => setTimelineForm({ ...timelineForm, time: e.target.value })} placeholder="08:00 - 09:30" /></div>
                            <div>
                              <label className={labelCls}>Tipe Acara</label>
                              <select className={inputCls} value={timelineForm.type} onChange={(e) => setTimelineForm({ ...timelineForm, type: e.target.value })}>
                                <option value="Akad Nikah">Akad Nikah</option>
                                <option value="Resepsi">Resepsi</option>
                                <option value="Persiapan">Persiapan</option>
                                <option value="Hiburan">Hiburan</option>
                                <option value="Penutup">Penutup</option>
                              </select>
                            </div>
                            <div>
                              <label className={labelCls}>Pasangan</label>
                              <select className={inputCls} value={timelineForm.couple} onChange={(e) => setTimelineForm({ ...timelineForm, couple: e.target.value as 'coupleA' | 'coupleB' })}>
                                <option value="coupleA">Aria &amp; Bella</option>
                                <option value="coupleB">Devan &amp; Elina</option>
                              </select>
                            </div>
                            <div>
                              <label className={labelCls}>Ikon</label>
                              <select className={inputCls} value={timelineForm.icon} onChange={(e) => setTimelineForm({ ...timelineForm, icon: e.target.value })}>
                                <option value="heart">Heart</option>
                                <option value="party">Party</option>
                                <option value="ring">Ring</option>
                                <option value="calendar">Calendar</option>
                                <option value="star">Star</option>
                              </select>
                            </div>
                            <div className="md:col-span-2"><label className={labelCls}>Judul</label><input className={inputCls} value={timelineForm.title} onChange={(e) => setTimelineForm({ ...timelineForm, title: e.target.value })} placeholder="Akad Nikah Aria & Bella" /></div>
                            <div className="md:col-span-2"><label className={labelCls}>Deskripsi</label><textarea rows={2} className={inputCls} value={timelineForm.desc} onChange={(e) => setTimelineForm({ ...timelineForm, desc: e.target.value })} placeholder="Prosesi ijab kabul suci..." /></div>
                          </div>
                          <div className="flex space-x-2 pt-2">
                            <button
                              type="button"
                              onClick={handleAddOrEditTimeline}
                              disabled={!timelineForm.title.trim()}
                              className="flex-1 py-2 bg-[#C5A059] hover:bg-[#b38e4b] disabled:opacity-50 text-black rounded-lg text-xs font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center space-x-1"
                            >
                              {editingTimelineIdx !== null ? <Save className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                              <span>{editingTimelineIdx !== null ? 'SIMPAN PERUBAHAN' : 'TAMBAH ITEM'}</span>
                            </button>
                            {editingTimelineIdx !== null && (
                              <button
                                type="button"
                                onClick={() => { setEditingTimelineIdx(null); setTimelineForm({ time: '', type: 'Akad Nikah', couple: 'coupleA', title: '', desc: '', icon: 'heart' }); }}
                                className="px-4 py-2 bg-zinc-850 hover:bg-zinc-800 text-gray-400 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                              >
                                Batal
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h5 className="font-serif text-xs font-bold text-[#C5A059] uppercase tracking-wider flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Daftar Rundown ({formData.timeline?.length || 0}) — Real-time</span>
                          </h5>
                          <div className="max-h-[420px] overflow-y-auto pr-1 space-y-2">
                            {(formData.timeline || []).length === 0 ? (
                              <p className="text-center py-8 text-xs text-gray-500 italic font-mono">Belum ada item rundown.</p>
                            ) : (formData.timeline || []).map((t: any, idx: number) => (
                              <div key={idx} className="p-3 rounded-lg bg-[#151515] border border-white/5 space-y-1.5 relative">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-0.5 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[9px] font-mono text-[#C5A059] bg-[#C5A059]/10 px-1.5 py-0.5 rounded border border-[#C5A059]/20">{t.time || '-'}</span>
                                      <span className="text-[10px] font-bold text-[#F5F5F5]">{t.title}</span>
                                      <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10 uppercase">{t.type}</span>
                                      <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10 uppercase">{t.couple === 'coupleB' ? 'Devan-Elina' : 'Aria-Bella'}</span>
                                    </div>
                                    {t.desc && <p className="text-[10px] text-gray-400 italic leading-relaxed">{t.desc}</p>}
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <button type="button" onClick={() => handleMoveTimeline(idx, -1)} disabled={idx === 0} className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/5 disabled:opacity-30 cursor-pointer" title="Naik">
                                      <ChevronUp className="w-3 h-3" />
                                    </button>
                                    <button type="button" onClick={() => handleMoveTimeline(idx, 1)} disabled={idx === (formData.timeline?.length || 0) - 1} className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/5 disabled:opacity-30 cursor-pointer" title="Turun">
                                      <ChevronDown className="w-3 h-3" />
                                    </button>
                                    <button type="button" onClick={() => handleEditTimeline(idx)} className="p-1.5 rounded-lg border border-white/10 hover:border-[#C5A059]/40 text-gray-400 hover:text-white transition-all cursor-pointer" title="Edit">
                                      <Edit className="w-3 h-3" />
                                    </button>
                                    <button type="button" onClick={() => handleDeleteTimeline(idx)} className="p-1.5 rounded-lg border border-red-900/30 text-red-500 hover:bg-red-950/20 transition-all cursor-pointer" title="Hapus">
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ====================== TAB: STREAMING (Live Streaming Control) ====================== */}
                    {activeTab === 'streaming' && (
                      <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <h4 className="text-xs font-bold tracking-wider text-[#C5A059] uppercase flex items-center space-x-1.5">
                                <Video className="w-4 h-4" />
                                <span>Aktifkan Live Streaming</span>
                              </h4>
                              <p className="text-[10px] text-gray-400">
                                Saat aktif &amp; URL terisi, tombol "Tonton Live Streaming" muncul di hero. Live-Now banner muncul saat waktu berada dalam jendela akad/resepsi.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleToggleStreamingEnabled}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                (formData.streamingEnabled ?? true) ? 'bg-[#C5A059]' : 'bg-zinc-800'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                                  (formData.streamingEnabled ?? true) ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        <div className={sectionCls}>
                          <h5 className={sectionTitleCls}><Radio className="w-4 h-4" /><span>URL Live Streaming</span></h5>
                          <div className="space-y-3">
                            <div>
                              <label className={labelCls}>Link YouTube / Zoom / Meet</label>
                              <input
                                className={inputCls}
                                value={formData.streamingUrl || ''}
                                onChange={(e) => updateField(['streamingUrl'], e.target.value)}
                                placeholder="https://youtube.com/watch?v=... atau https://zoom.us/j/..."
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className={labelCls}>Go-Live Mulai (opsional)</label>
                                <input
                                  type="datetime-local"
                                  className={inputCls}
                                  value={(formData.streamingLiveStart || '').slice(0, 16)}
                                  onChange={(e) => updateField(['streamingLiveStart'], e.target.value)}
                                />
                              </div>
                              <div>
                                <label className={labelCls}>Go-Live Selesai (opsional)</label>
                                <input
                                  type="datetime-local"
                                  className={inputCls}
                                  value={(formData.streamingLiveEnd || '').slice(0, 16)}
                                  onChange={(e) => updateField(['streamingLiveEnd'], e.target.value)}
                                />
                              </div>
                            </div>
                            <p className="text-[9px] text-gray-500 italic">*Kosongkan jendela waktu untuk mengikuti jadwal akad/resepsi otomatis (deteksi Live-Now bawaan).</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleSaveStreaming}
                          className="w-full py-3 bg-[#C5A059] hover:bg-[#b38e4b] text-black font-bold rounded-xl text-xs tracking-wider uppercase transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center space-x-1.5"
                        >
                          <Save className="w-4 h-4" />
                          <span>Simpan Pengaturan Streaming</span>
                        </button>
                      </div>
                    )}

                    {/* ====================== TAB: GALLERY ====================== */}
                    {activeTab === 'gallery' && (
                      <div className="space-y-4">
                        <div className={sectionCls}>
                          <h5 className={sectionTitleCls}><Save className="w-4 h-4 text-[#C5A059]" /><span>{editingGalleryId ? 'Edit Item Galeri' : 'Tambah Galeri Baru'}</span></h5>
                          <div className="space-y-3">
                            <div><label className={labelCls}>URL Gambar/Video</label><input className={inputCls} value={newGalleryUrl} onChange={(e) => setNewGalleryUrl(e.target.value)} placeholder="https://... atau /images/BALI-*.jpg" /></div>
                            <div>
                              <label className={labelCls}>Atau Upload File (di-encode ke base64 — hanya untuk preview lokal)</label>
                              <input
                                type="file"
                                accept="image/*,video/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      if (event.target?.result) setNewGalleryUrl(event.target.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#C5A059]/10 file:text-[#C5A059] hover:file:bg-[#C5A059]/20 cursor-pointer"
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className={labelCls}>Kategori</label>
                                <select className={inputCls} value={newGalleryCategory} onChange={(e) => setNewGalleryCategory(e.target.value)}>
                                  <option value="Prewedding">Prewedding</option>
                                  <option value="Engagement">Engagement</option>
                                  <option value="Family">Family</option>
                                </select>
                              </div>
                              <div><label className={labelCls}>Caption</label><input className={inputCls} value={newGalleryCaption} onChange={(e) => setNewGalleryCaption(e.target.value)} placeholder="Momen bahagia..." /></div>
                            </div>
                            {newGalleryUrl && (
                              <div className="p-3 bg-[#151515] rounded-xl border border-white/5 space-y-1.5">
                                <span className="block text-[8px] text-gray-500 uppercase font-mono">Live Preview:</span>
                                <div className="relative aspect-video max-w-xs mx-auto rounded-lg overflow-hidden border border-[#C5A059]/20 bg-black flex items-center justify-center">
                                  {newGalleryUrl.startsWith('data:video/') || newGalleryUrl.endsWith('.mp4') || newGalleryUrl.endsWith('.webm') ? (
                                    <video src={newGalleryUrl} className="w-full h-full object-cover" controls muted playsInline />
                                  ) : (
                                    <img src={newGalleryUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  )}
                                </div>
                              </div>
                            )}
                            <div className="flex space-x-2 pt-2">
                              <button
                                type="button"
                                onClick={handleSaveGallery}
                                className="flex-1 py-2 bg-[#C5A059] hover:bg-[#b38e4b] text-black rounded-lg text-xs font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center space-x-1"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>{editingGalleryId ? 'SIMPAN PERUBAHAN' : 'TAMBAH KE GALERI'}</span>
                              </button>
                              {editingGalleryId && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewGalleryUrl(''); setNewGalleryCaption(''); setNewGalleryCategory('Prewedding'); setEditingGalleryId(null);
                                  }}
                                  className="px-4 py-2 bg-zinc-850 hover:bg-zinc-800 text-gray-400 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                                >
                                  Batal
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h5 className="font-serif text-xs font-bold text-[#C5A059] uppercase tracking-wider">
                            Daftar Galeri ({galleryPhotos.length}) — Real-time dari Firestore
                          </h5>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[280px] overflow-y-auto pr-1">
                            {galleryPhotos.length === 0 ? (
                              <div className="col-span-full text-center py-8 text-xs text-gray-500 italic font-mono">Belum ada foto.</div>
                            ) : galleryPhotos.map((item) => (
                              <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden bg-[#0A0A0A] border border-[#C5A059]/15 group flex flex-col justify-between">
                                <div className="w-full h-full absolute inset-0 z-0 bg-[#101010]">
                                  {item.url?.startsWith('data:video/') || item.url?.endsWith('.mp4') || item.url?.endsWith('.webm') ? (
                                    <video src={item.url} className="w-full h-full object-cover brightness-[0.7]" muted loop playsInline />
                                  ) : (
                                    <img src={item.url} alt={item.caption} className="w-full h-full object-cover brightness-[0.7]" referrerPolicy="no-referrer" />
                                  )}
                                </div>
                                <div className="absolute top-1.5 left-1.5 z-10">
                                  <span className="text-[8px] font-mono tracking-wider uppercase bg-black/80 text-[#C5A059] px-1.5 py-0.5 rounded border border-[#C5A059]/35">
                                    {item.category}
                                  </span>
                                </div>
                                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 z-20">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setNewGalleryUrl(item.url);
                                      setNewGalleryCategory(item.category);
                                      setNewGalleryCaption(item.caption || '');
                                      setEditingGalleryId(item.id);
                                    }}
                                    className="p-1.5 rounded-full bg-[#C5A059] text-black hover:scale-110 active:scale-95 transition-all cursor-pointer"
                                    title="Edit"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteGallery(item.id)}
                                    className="p-1.5 rounded-full bg-red-600 text-black hover:scale-110 active:scale-95 transition-all cursor-pointer"
                                    title="Hapus"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/80 to-transparent p-2 z-10">
                                  <p className="text-[9px] text-[#F5F5F5] font-serif line-clamp-1 italic">{item.caption || 'Tanpa keterangan'}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ====================== TAB: RSVP STATS ====================== */}
                    {activeTab === 'rsvp_stats' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <StatCard label="Total RSVP" value={rsvpStats.total} icon={<Users className="w-4 h-4" />} color="text-[#C5A059]" />
                          <StatCard label="Hadir" value={rsvpStats.attending} icon={<Check className="w-4 h-4" />} color="text-emerald-400" />
                          <StatCard label="Tidak Hadir" value={rsvpStats.declined} icon={<X className="w-4 h-4" />} color="text-red-400" />
                          <StatCard label="Total Tamu" value={rsvpStats.totalGuests} icon={<BarChart3 className="w-4 h-4" />} color="text-blue-400" />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <StatCard label="Aria & Bella" value={rsvpStats.coupleA} icon={<Heart className="w-4 h-4" />} color="text-pink-400" />
                          <StatCard label="Devan & Elina" value={rsvpStats.coupleB} icon={<Heart className="w-4 h-4" />} color="text-blue-400" />
                          <StatCard label="Keduanya" value={rsvpStats.both} icon={<Heart className="w-4 h-4" />} color="text-[#C5A059]" />
                        </div>

                        <div className={sectionCls}>
                          <h5 className={sectionTitleCls}><BarChart3 className="w-4 h-4" /><span>Daftar RSVP ({rsvpList.length}) — Real-time</span></h5>
                          <div className="max-h-[280px] overflow-y-auto pr-1 space-y-2">
                            {rsvpList.length === 0 ? (
                              <p className="text-center py-6 text-xs text-gray-500 italic font-mono">Belum ada RSVP.</p>
                            ) : rsvpList.map((r) => (
                              <div key={r.id} className="p-2.5 rounded-lg bg-[#151515] border border-white/5 flex items-start justify-between space-x-3 text-xs">
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-bold text-[#F5F5F5]">{r.name}</span>
                                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                                      r.status === 'hadir' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/30' : 'bg-red-950/30 text-red-400 border-red-900/30'
                                    }`}>
                                      {r.status === 'hadir' ? `Hadir (${r.guestsCount} org)` : 'Tidak Hadir'}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-gray-500 font-mono">
                                    {r.coupleChoice === 'both' ? 'Keduanya' : r.coupleChoice === 'coupleA' ? 'Aria-Bella' : 'Devan-Elina'} • {r.ceremonyChoice === 'both' ? 'Akad+Resepsi' : r.ceremonyChoice}
                                  </p>
                                  {r.wishes && <p className="text-[#E5E5E5]/70 line-clamp-2 italic">&ldquo;{r.wishes}&rdquo;</p>}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRsvp(r.id)}
                                  className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-950/30 transition-all cursor-pointer flex-shrink-0"
                                  title="Hapus"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ====================== TAB: GUESTS & SHARE ====================== */}
                    {activeTab === 'guests_share' && (
                      <div className="space-y-6">
                        {/* Maintenance mode */}
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <h4 className="text-xs font-bold tracking-wider text-[#C5A059] uppercase flex items-center space-x-1.5">
                                <ShieldAlert className="w-4 h-4" />
                                <span>Mode Pemeliharaan (Maintenance Mode)</span>
                              </h4>
                              <p className="text-[10px] text-gray-400">
                                Saat aktif, semua tamu melihat MaintenanceScreen. Admin tetap bisa akses dashboard.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleToggleMaintenance}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                formData.maintenanceMode ? 'bg-[#C5A059]' : 'bg-zinc-800'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                                  formData.maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Share template */}
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                          <h4 className="text-xs font-bold tracking-wider text-[#C5A059] uppercase flex items-center space-x-1.5">
                            <Type className="w-4 h-4" />
                            <span>Format Pesan Share</span>
                          </h4>
                          <div className="grid grid-cols-3 gap-1.5">
                            <span className="p-1 px-1.5 bg-black/40 rounded border border-white/5 font-mono text-[9px] text-[#C5A059] text-center">{"{nama_tamu}"}</span>
                            <span className="p-1 px-1.5 bg-black/40 rounded border border-white/5 font-mono text-[9px] text-[#C5A059] text-center">{"{nama_pasangan}"}</span>
                            <span className="p-1 px-1.5 bg-black/40 rounded border border-white/5 font-mono text-[9px] text-[#C5A059] text-center">{"{link}"}</span>
                          </div>
                          <textarea
                            value={formData.shareTemplate || ''}
                            onChange={(e) => setFormData({ ...formData, shareTemplate: e.target.value })}
                            placeholder="Masukkan template teks..."
                            className="w-full h-32 p-3 text-xs rounded-xl bg-black/30 border border-white/10 text-[#F5F5F5] font-mono focus:border-[#C5A059] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleSaveShareTemplate}
                            className="inline-flex items-center space-x-1 py-1.5 px-4 rounded-xl bg-[#C5A059] hover:bg-[#b38e4b] text-black text-xs font-semibold tracking-wider transition-all cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Simpan & Siarkan</span>
                          </button>
                        </div>

                        {/* Guest list manager */}
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                          <h4 className="text-xs font-bold tracking-wider text-[#C5A059] uppercase flex items-center space-x-1.5">
                            <Users className="w-4 h-4" />
                            <span>Manajemen Daftar Tamu ({formData.guestList?.length || 0} Tamu)</span>
                          </h4>
                          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                              <div className="sm:col-span-5 space-y-1">
                                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#C5A059]">Nama Tamu</label>
                                <input type="text" value={guestNameInput} onChange={(e) => setGuestNameInput(e.target.value)} placeholder="Budi Santoso & Keluarga" className="w-full p-2 text-xs rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#C5A059] focus:outline-none" />
                              </div>
                              <div className="sm:col-span-4 space-y-1">
                                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#C5A059]">Pilihan Pasangan</label>
                                <select value={guestCoupleInput} onChange={(e: any) => setGuestCoupleInput(e.target.value)} className="w-full p-2 text-xs rounded-lg bg-zinc-900 border border-white/10 text-white focus:border-[#C5A059] focus:outline-none">
                                  <option value="both">Keduanya</option>
                                  <option value="coupleA">Aria & Bella</option>
                                  <option value="coupleB">Devan & Elina</option>
                                </select>
                              </div>
                              <div className="sm:col-span-3 space-y-1">
                                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#C5A059]">No. WA</label>
                                <input type="text" value={guestPhoneInput} onChange={(e) => setGuestPhoneInput(e.target.value)} placeholder="081234..." className="w-full p-2 text-xs rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#C5A059] focus:outline-none" />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                              {editingGuestId && (
                                <button
                                  type="button"
                                  onClick={() => { setEditingGuestId(null); setGuestNameInput(''); setGuestPhoneInput(''); setGuestCoupleInput('both'); }}
                                  className="py-1 px-3 rounded-lg border border-white/10 text-xs text-gray-400 hover:text-white transition-all cursor-pointer"
                                >
                                  Batal
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={handleAddOrEditGuest}
                                className="inline-flex items-center space-x-1.5 py-1.5 px-4 rounded-xl bg-[#C5A059] hover:bg-[#b38e4b] text-black text-xs font-semibold tracking-wider transition-all cursor-pointer shadow-md"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>{editingGuestId ? 'Simpan' : 'Tambah'}</span>
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-t border-white/5 pt-3">
                            <input type="text" value={guestSearchQuery} onChange={(e) => setGuestSearchQuery(e.target.value)} placeholder="Cari nama tamu..." className="w-full sm:max-w-xs p-2 pl-3 text-xs rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#C5A059] focus:outline-none placeholder-gray-500" />
                            <div className="flex gap-3 text-[10px] font-mono text-gray-400">
                              <div>TOTAL VISITS: <span className="text-[#C5A059] font-bold">{(formData.guestList || []).reduce((acc: number, cur: any) => acc + (cur.visits || 0), 0)}x</span></div>
                              <div>AKTIF: <span className="text-emerald-400 font-bold">{(formData.guestList || []).filter((g: any) => (g.visits || 0) > 0).length}</span></div>
                            </div>
                          </div>

                          <div className="border border-white/5 rounded-xl overflow-hidden max-h-96 overflow-y-auto bg-black/20">
                            {(() => {
                              const guests = formData.guestList || [];
                              const filtered = guests.filter((g: any) => g.name.toLowerCase().includes(guestSearchQuery.toLowerCase()));
                              if (filtered.length === 0) {
                                return <div className="p-6 text-center text-xs text-gray-500 font-mono italic">Tidak ada tamu ditemukan.</div>;
                              }
                              return (
                                <div className="divide-y divide-white/5">
                                  {filtered.map((g: any) => {
                                    const guestLink = `${window.location.origin}${window.location.pathname}?to=${encodeURIComponent(g.name)}&couple=${g.invitedCouple}`;
                                    return (
                                      <div key={g.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-white/[0.02] transition-colors">
                                        <div className="space-y-1 flex-1">
                                          <div className="flex items-center gap-2">
                                            <span className="font-bold text-white text-sm">{g.name}</span>
                                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                                              g.invitedCouple === 'coupleA' ? 'bg-amber-950/20 text-amber-400 border-amber-900/30' : g.invitedCouple === 'coupleB' ? 'bg-blue-950/20 text-blue-400 border-blue-900/30' : 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30'
                                            }`}>
                                              {g.invitedCouple === 'coupleA' ? 'I' : g.invitedCouple === 'coupleB' ? 'II' : 'Keduanya'}
                                            </span>
                                          </div>
                                          <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-500 font-mono">
                                            {g.phone && <span>WA: {g.phone}</span>}
                                            <span>Kunjungan: <strong className={g.visits > 0 ? 'text-emerald-400' : 'text-gray-500'}>{g.visits || 0}x</strong></span>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={async () => {
                                              try { await navigator.clipboard.writeText(guestLink); setCopiedGuestId(g.id); setTimeout(() => setCopiedGuestId(null), 2000); } catch (err) { console.error(err); }
                                            }}
                                            className="inline-flex items-center space-x-1 py-1 px-2.5 rounded-lg border border-[#C5A059]/20 bg-black/40 hover:bg-[#C5A059] hover:text-black transition-all text-[10px] font-mono font-semibold text-gray-300 cursor-pointer"
                                          >
                                            {copiedGuestId === g.id ? (<><Check className="w-3 h-3" /><span>Copied!</span></>) : (<><Clipboard className="w-3 h-3" /><span>Copy Link</span></>)}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setGuestNameInput(g.name);
                                              setGuestPhoneInput(g.phone || '');
                                              setGuestCoupleInput(g.invitedCouple || 'both');
                                              setEditingGuestId(g.id);
                                            }}
                                            className="p-1.5 rounded-lg border border-white/10 hover:border-[#C5A059]/40 text-gray-400 hover:text-white transition-all cursor-pointer"
                                            title="Edit"
                                          >
                                            <Edit className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteGuest(g.id)}
                                            className="p-1.5 rounded-lg border border-red-900/30 text-red-500 hover:bg-red-950/20 transition-all cursor-pointer"
                                            title="Hapus"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="text-[10px] font-mono text-gray-500 italic">
                    {isAdmin && (localStorage.getItem('wedding_admin_email') || 'Admin')}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center space-x-1.5 py-2 px-4 rounded-xl border border-gray-700 bg-[#0A0A0A] hover:bg-white/5 text-gray-400 hover:text-white text-xs font-semibold tracking-wide transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// Small inline stat card for RSVP stats tab
function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="p-3 rounded-xl bg-[#151515] border border-[#C5A059]/20 text-center">
      <div className={`flex items-center justify-center mb-1 ${color}`}>{icon}</div>
      <div className="font-serif text-xl font-bold text-[#F5F5F5]">{value}</div>
      <div className="text-[9px] text-gray-500 uppercase tracking-wider font-mono">{label}</div>
    </div>
  );
}
