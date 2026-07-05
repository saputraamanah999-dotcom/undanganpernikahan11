import { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, MapPin, Clock, ExternalLink, CalendarPlus, Shirt, Download, Bell } from 'lucide-react';
import { CoupleInfo } from '../data/weddingData';
import Map from './Map';
import { generateIcsEvent, downloadIcs, parseWitaDateRange } from '../lib/ics';

interface ScheduleSectionProps {
  selectedCouple: 'coupleA' | 'coupleB' | 'both';
  weddingData: any;
}

export default function ScheduleSection({ selectedCouple, weddingData }: ScheduleSectionProps) {

  const handleDownloadIcs = (
    title: string,
    date: string,
    timeRange: string,
    venue: string,
    address: string,
    description: string
  ) => {
    const { start, end } = parseWitaDateRange(date, timeRange);
    const ics = generateIcsEvent({
      title,
      start,
      end,
      description: `${description} — ${venue}, ${address}`,
      location: `${venue}, ${address}`
    });
    const safe = title.replace(/[^a-zA-Z0-9-]+/g, '-').toLowerCase();
    downloadIcs(`bali-wedding-${safe}`, ics);
  };

  const handleSaveTheDateReminder = (title: string, date: string, timeRange: string) => {
    // Use Notification API to schedule a reminder (best-effort, OS-dependent)
    if (!('Notification' in window)) {
      alert('Browser Anda tidak mendukung notifikasi. Coba gunakan tombol "Tambah ke Kalender" sebagai gantinya.');
      return;
    }
    if (Notification.permission !== 'granted') {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          new Notification('Pengingat Tersimpan!', {
            body: `Kami akan mengingatkan Anda tentang "${title}" pada ${date} (${timeRange}). Untuk pengingat tepat waktu, mohon tambahkan ke Google Kalender Anda.`,
            icon: '/images/BALI-ICON.webp'
          });
        } else {
          alert('Izin notifikasi ditolak. Silakan gunakan tombol "Tambah ke Kalender".');
        }
      });
    } else {
      new Notification('Pengingat Tersimpan!', {
        body: `Kami akan mengingatkan Anda tentang "${title}" pada ${date} (${timeRange}). Untuk pengingat tepat waktu, mohon tambahkan ke Google Kalender Anda.`,
        icon: '/images/BALI-ICON.webp'
      });
    }
  };

  const renderScheduleCards = (couple: CoupleInfo) => {
    const coupleName = `${couple.groom.nickname} & ${couple.bride.nickname}`;
    const cardBorderColorClass = 'border-[#C5A059]/20 hover:border-[#C5A059]/60';

    return (
      <div key={couple.id} id={`schedule-group-${couple.id}`} className="space-y-8">
        <h4 className="font-serif text-lg font-bold text-center text-[#C5A059] flex items-center justify-center space-x-2">
          <span>Jadwal Pernikahan {coupleName}</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Card 1: Akad Nikah */}
          <motion.div
            id={`schedule-card-akad-${couple.id}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={`bg-[#151515] rounded-2xl p-6 border-2 ${cardBorderColorClass} shadow-2xl transition-all duration-300 flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#C5A059]/10">
                <span className="text-xs uppercase font-mono tracking-wider font-bold text-[#C5A059]">
                  Akad Nikah
                </span>
                <Calendar className="w-5 h-5 text-[#C5A059]/80" />
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Clock className="w-4 h-4 text-[#C5A059] mt-1 flex-shrink-0" />
                  <div>
                    <span className="block text-[11px] font-mono uppercase tracking-wide text-gray-500">Waktu</span>
                    <span className="text-sm font-semibold text-[#F5F5F5]">{weddingData.dateText}</span>
                    <span className="block text-xs text-[#C5A059] font-mono mt-0.5">{couple.akad.time}</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <MapPin className="w-4 h-4 text-[#C5A059] mt-1 flex-shrink-0" />
                  <div>
                    <span className="block text-[11px] font-mono uppercase tracking-wide text-gray-500">Tempat / Ruangan</span>
                    <span className="text-sm font-bold text-[#F5F5F5] block">{couple.akad.venue}</span>
                    <span className="text-xs text-[#E5E5E5]/80 block leading-relaxed mt-1">
                      {couple.akad.address}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#C5A059]/10 flex flex-col gap-2.5">
              {/* Google Calendar Button — visually distinct gold styling */}
              <a
                href={couple.akad.googleCalendarUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl border border-[#C5A059]/30 bg-[#0A0A0A] hover:bg-[#C5A059] hover:text-black text-xs font-semibold tracking-wide text-[#C5A059] flex items-center justify-center space-x-2 transition-all shadow-inner"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                <span>Tambah ke Google Kalender</span>
              </a>

              <div className="grid grid-cols-2 gap-2.5">
                {/* ICS Download */}
                <button
                  type="button"
                  onClick={() =>
                    handleDownloadIcs(
                      `Akad Nikah ${coupleName}`,
                      couple.akad.date,
                      couple.akad.time,
                      couple.akad.venue,
                      couple.akad.address,
                      `Akad Nikah pasangan ${coupleName}`
                    )
                  }
                  className="w-full py-2 rounded-xl border border-[#C5A059]/20 bg-[#0A0A0A] hover:bg-[#C5A059]/15 text-[10px] font-semibold tracking-wide text-[#C5A059] flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>.ICS File</span>
                </button>

                {/* Save the Date Reminder */}
                <button
                  type="button"
                  onClick={() =>
                    handleSaveTheDateReminder(
                      `Akad Nikah ${coupleName}`,
                      couple.akad.date,
                      couple.akad.time
                    )
                  }
                  className="w-full py-2 rounded-xl border border-[#C5A059]/20 bg-[#0A0A0A] hover:bg-[#C5A059]/15 text-[10px] font-semibold tracking-wide text-[#C5A059] flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Bell className="w-3 h-3" />
                  <span>Save Date</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Resepsi Pernikahan */}
          <motion.div
            id={`schedule-card-resepsi-${couple.id}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={`bg-[#151515] rounded-2xl p-6 border-2 ${cardBorderColorClass} shadow-2xl transition-all duration-300 flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#C5A059]/10">
                <span className="text-xs uppercase font-mono tracking-wider font-bold text-[#C5A059]">
                  Resepsi Pernikahan
                </span>
                <Calendar className="w-5 h-5 text-[#C5A059]/80" />
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Clock className="w-4 h-4 text-[#C5A059] mt-1 flex-shrink-0" />
                  <div>
                    <span className="block text-[11px] font-mono uppercase tracking-wide text-gray-500">Waktu</span>
                    <span className="text-sm font-semibold text-[#F5F5F5]">{weddingData.dateText}</span>
                    <span className="block text-xs text-[#C5A059] font-mono mt-0.5">{couple.resepsi.time}</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <MapPin className="w-4 h-4 text-[#C5A059] mt-1 flex-shrink-0" />
                  <div>
                    <span className="block text-[11px] font-mono uppercase tracking-wide text-gray-500">Tempat / Ruangan</span>
                    <span className="text-sm font-bold text-[#F5F5F5] block">{couple.resepsi.venue}</span>
                    <span className="text-xs text-[#E5E5E5]/80 block leading-relaxed mt-1">
                      {couple.resepsi.address}
                    </span>
                  </div>
                </div>

                {couple.resepsi.dressCode && (
                  <div className="flex items-start space-x-3 pt-1">
                    <Shirt className="w-4 h-4 text-[#C5A059] mt-1 flex-shrink-0" />
                    <div>
                      <span className="block text-[11px] font-mono uppercase tracking-wide text-gray-500">Dress Code</span>
                      <span className="text-xs font-medium text-[#C5A059]">
                        {couple.resepsi.dressCode}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#C5A059]/10 flex flex-col gap-2.5">
              {/* Google Calendar Button — visually distinct gold styling */}
              <a
                href={couple.resepsi.googleCalendarUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl border border-[#C5A059]/30 bg-[#0A0A0A] hover:bg-[#C5A059] hover:text-black text-xs font-semibold tracking-wide text-[#C5A059] flex items-center justify-center space-x-2 transition-all shadow-inner"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                <span>Tambah ke Google Kalender</span>
              </a>

              <div className="grid grid-cols-2 gap-2.5">
                {/* ICS Download */}
                <button
                  type="button"
                  onClick={() =>
                    handleDownloadIcs(
                      `Resepsi Pernikahan ${coupleName}`,
                      couple.resepsi.date,
                      couple.resepsi.time,
                      couple.resepsi.venue,
                      couple.resepsi.address,
                      `Resepsi Pernikahan pasangan ${coupleName}`
                    )
                  }
                  className="w-full py-2 rounded-xl border border-[#C5A059]/20 bg-[#0A0A0A] hover:bg-[#C5A059]/15 text-[10px] font-semibold tracking-wide text-[#C5A059] flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>.ICS File</span>
                </button>

                {/* Save the Date Reminder */}
                <button
                  type="button"
                  onClick={() =>
                    handleSaveTheDateReminder(
                      `Resepsi Pernikahan ${coupleName}`,
                      couple.resepsi.date,
                      couple.resepsi.time
                    )
                  }
                  className="w-full py-2 rounded-xl border border-[#C5A059]/20 bg-[#0A0A0A] hover:bg-[#C5A059]/15 text-[10px] font-semibold tracking-wide text-[#C5A059] flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Bell className="w-3 h-3" />
                  <span>Save Date</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  };

  return (
    <div id="schedule-section" className="py-20 md:py-28 px-4 max-w-5xl mx-auto space-y-16">
      {/* Top Divider — elegant gold hairline (replaces Bali motif) */}
      <div className="flex items-center justify-center" aria-hidden="true">
        <span className="h-px w-24 bg-gradient-to-r from-transparent via-[#C5A059] to-transparent" />
        <span className="mx-2 w-1.5 h-1.5 rounded-full bg-[#C5A059]/70 shadow-[0_0_8px_rgba(197,160,89,0.55)]" />
        <span className="h-px w-24 bg-gradient-to-r from-transparent via-[#C5A059] to-transparent" />
      </div>

      {/* Cards Display */}
      {selectedCouple === 'both' ? (
        <div className="space-y-14">
          <div className="text-center">
            <span className="font-mono text-xs tracking-widest text-[#C5A059] uppercase block mb-1">
              WAKTU & TEMPAT
            </span>
            <h3 className="font-serif text-2xl md:text-3xl font-semibold text-[#F5F5F5]">
              Rangkaian Jadwal Acara
            </h3>
          </div>
          {renderScheduleCards(weddingData.coupleA)}
          <div className="w-24 h-[1px] bg-[#C5A059]/20 mx-auto" />
          {renderScheduleCards(weddingData.coupleB)}
        </div>
      ) : (
        <div className="space-y-10">
          <div className="text-center">
            <span className="font-mono text-xs tracking-widest text-[#C5A059] uppercase block mb-1">
              WAKTU & TEMPAT
            </span>
            <h3 className="font-serif text-2xl md:text-3xl font-semibold text-[#F5F5F5]">
              Informasi Sesi Acara
            </h3>
          </div>
          {selectedCouple === 'coupleA'
            ? renderScheduleCards(weddingData.coupleA)
            : renderScheduleCards(weddingData.coupleB)
          }
        </div>
      )}

      {/* Embedded Map Section */}
      <motion.div
        id="schedule-maps-container"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto bg-[#151515] p-5 md:p-6 rounded-3xl border border-[#C5A059]/25 shadow-2xl space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="font-serif text-base md:text-lg font-bold text-[#F5F5F5]">
              Peta Lokasi Pernikahan
            </h4>
            <p className="text-xs text-[#C5A059] font-medium">
              {weddingData.commonVenue}
            </p>
          </div>

          <a
            href={weddingData.commonMapsLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-1.5 py-2 px-4 rounded-xl bg-[#C5A059] hover:bg-[#b38e4b] text-black text-xs font-bold tracking-wider transition-all shadow-md hover:scale-103 active:scale-97"
          >
            <span>Buka Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Custom Map Component (scaled perfectly for small devices & responsive containment) */}
        <Map
          address={weddingData.commonAddress}
          venue={weddingData.commonVenue}
          mapsLink={weddingData.commonMapsLink}
          className="h-80 md:h-96"
        />

        <p className="text-[11px] text-center text-gray-500 italic">
          *Lokasi akad dan resepsi kedua pasangan diselenggarakan secara bersama-sama di {weddingData.commonVenue}, Karangasem, Bali.
        </p>
      </motion.div>

      {/* Bottom Divider — elegant gold hairline (replaces Bali motif) */}
      <div className="flex items-center justify-center" aria-hidden="true">
        <span className="h-px w-24 bg-gradient-to-r from-transparent via-[#C5A059] to-transparent" />
        <span className="mx-2 w-1.5 h-1.5 rounded-full bg-[#C5A059]/70 shadow-[0_0_8px_rgba(197,160,89,0.55)]" />
        <span className="h-px w-24 bg-gradient-to-r from-transparent via-[#C5A059] to-transparent" />
      </div>
    </div>
  );
}
