import React, { useState } from 'react';
import { Send, Radio, Film, CheckCircle, AlertCircle, Copy, Sparkles, MessageSquare } from 'lucide-react';
import { Movie, BotConfig } from '../types';

interface BroadcastManagerProps {
  movies: Movie[];
  config: BotConfig;
}

export const BroadcastManager: React.FC<BroadcastManagerProps> = ({ movies, config }) => {
  const [targetChannel, setTargetChannel] = useState(config.channelUsername || '@CineTele_Channel');
  const [selectedMovieId, setSelectedMovieId] = useState<string>(movies[0]?.id || '');
  const [broadcastText, setBroadcastText] = useState(
    `🎬 <b>RILIS FILM TERBARU DI BIOSKOP TELEGRAM!</b>\n\n` +
    `🍿 <b>${movies[0]?.title || 'Judul Film'}</b> (${movies[0]?.year || '2026'})\n` +
    `⭐ Rating: ${movies[0]?.rating || '8.5'} | Durasi: ${movies[0]?.duration || '2j 10m'}\n` +
    `📺 Kualitas: ${movies[0]?.quality || '1080p FHD'} [Sub Indo]\n\n` +
    `📖 <i>"${movies[0]?.synopsis || 'Sinopsis film seru'}"</i>\n\n` +
    `👇 <b>Klik link bot di bawah untuk menonton sekarang:</b>\n` +
    `https://t.me/${config.botUsername}?start=film_${movies[0]?.id || '1'}`
  );

  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const handleSelectMovie = (id: string) => {
    setSelectedMovieId(id);
    const m = movies.find((item) => item.id === id);
    if (m) {
      setBroadcastText(
        `🎬 <b>RILIS FILM TERBARU DI BIOSKOP TELEGRAM!</b>\n\n` +
        `🍿 <b>${m.title}</b> (${m.year})\n` +
        `⭐ Rating: ${m.rating} | Durasi: ${m.duration}\n` +
        `📺 Kualitas: ${m.quality} [${m.language}]\n\n` +
        `📖 <i>"${m.synopsis}"</i>\n\n` +
        `👇 <b>Klik link bot di bawah untuk menonton langsung:</b>\n` +
        `https://t.me/${config.botUsername}?start=film_${m.id}`
      );
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;

    setIsSending(true);
    setStatusMessage(null);

    try {
      const selected = movies.find((m) => m.id === selectedMovieId);
      const res = await fetch('/api/bot/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelOrChatId: targetChannel,
          text: broadcastText,
          photoUrl: selected?.posterUrl
        })
      });

      const data = await res.json();
      if (data.ok) {
        setStatusMessage({
          ok: true,
          text: `Siaran pesan berhasil dikirim ke ${targetChannel} melalui Telegram Bot API!`
        });
      } else {
        setStatusMessage({
          ok: false,
          text: data.error || 'Gagal mengirim pesan ke Telegram. Pastikan Bot sudah diundang ke channel sebagai Administrator.'
        });
      }
    } catch (err: any) {
      setStatusMessage({
        ok: false,
        text: err.message || 'Gagal menghubungi server'
      });
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(broadcastText);
    alert('Format broadcast tersalin ke papan klip!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Broadcast & Pengumuman Film</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Kirim notifikasi film baru ke Channel Telegram atau ribuan penonton bot secara serentak
            </p>
          </div>
        </div>

        <form onSubmit={handleSendBroadcast} className="mt-6 space-y-6">
          {/* Quick Movie Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Pilih Film untuk Template Siaran Otomatis
            </label>
            <div className="flex gap-2">
              <select
                value={selectedMovieId}
                onChange={(e) => handleSelectMovie(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                {movies.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} ({m.year}) - {m.quality}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Target Channel */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Target Channel / Username Grup
            </label>
            <input
              type="text"
              required
              value={targetChannel}
              onChange={(e) => setTargetChannel(e.target.value)}
              placeholder="@CineTele_Channel atau ID Chat"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-purple-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              *Syarat: Bot Telegram Anda harus sudah dimasukkan sebagai <b>Admin</b> di channel target dengan izin mengirim pesan (Post Messages).
            </p>
          </div>

          {/* Message Text Editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Pesan Siaran (Mendukung Format HTML Telegram)
              </label>
              <button
                type="button"
                onClick={copyToClipboard}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Teks</span>
              </button>
            </div>
            <textarea
              rows={8}
              required
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 font-mono leading-relaxed focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                statusMessage.ok
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
              }`}
            >
              {statusMessage.ok ? (
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs">
                <p className="font-semibold">{statusMessage.text}</p>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isSending}
              className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-lg cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'Mengirim Siaran...' : 'Kirim Siaran ke Telegram'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
