import React, { useState } from 'react';
import { BookOpen, Copy, Check, Terminal, ExternalLink, ShieldCheck, Film, Cpu, HelpCircle, Globe } from 'lucide-react';
import { BotConfig } from '../types';

interface BotSetupGuideProps {
  config: BotConfig;
}

export const BotSetupGuide: React.FC<BotSetupGuideProps> = ({ config }) => {
  const [copiedNode, setCopiedNode] = useState(false);
  const [copiedPython, setCopiedPython] = useState(false);
  const [copiedWrangler, setCopiedWrangler] = useState(false);
  const [activeTab, setActiveTab] = useState<'guide' | 'cloudflare' | 'node' | 'python'>('guide');

  const standaloneNodeScript = `// ==========================================
// CineTele - Bot Telegram Nonton Film (Node.js)
// Framework: Telegraf v4
// Jalankan: npm install telegraf dotenv && node bot.js
// ==========================================

const { Telegraf, Markup } = require('telegraf');
require('dotenv').config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '${config.botToken || 'YOUR_BOT_TOKEN_HERE'}';
const bot = new Telegraf(BOT_TOKEN);

// Database sederhana film
const MOVIES = [
  {
    id: 'film-1',
    title: 'Cyberpunk 2088: Jakarta Protocol',
    genre: 'Sci-Fi, Action',
    rating: '8.8/10',
    quality: '1080p FHD',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    synopsis: 'Petualangan detektif di megapolitan Jakarta masa depan.'
  },
  {
    id: 'film-2',
    title: 'Garis Batas Langit',
    genre: 'Drama, Petualangan',
    rating: '8.5/10',
    quality: '1080p FHD',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    synopsis: 'Dua pengelana menemukan arti harapan di Gunung Rinjani.'
  }
];

// Perintah /start
bot.start((ctx) => {
  const welcome = \`Halo \${ctx.from.first_name}! 🍿\\n\\nSelamat datang di Bot Nonton Film HD.\\nSilakan pilih menu di bawah ini untuk mulai menonton:\`;
  
  return ctx.reply(welcome, Markup.inlineKeyboard([
    [Markup.button.callback('🎬 Katalog Film', 'catalog'), Markup.button.callback('🔥 Trending', 'trending')],
    [Markup.button.callback('🔍 Cari Film', 'search_help'), Markup.button.callback('⭐ VIP Member', 'vip_info')],
    [Markup.button.url('📢 Channel Update', '${config.channelInviteLink || 'https://t.me/telegram'}')]
  ]));
});

// Aksi Katalog
bot.action('catalog', (ctx) => {
  const buttons = MOVIES.map(m => [Markup.button.callback(\`🎬 \${m.title}\`, \`movie_\${m.id}\`)]);
  buttons.push([Markup.button.callback('🔙 Menu Utama', 'start_back')]);
  return ctx.reply('Pilih film yang ingin kamu tonton:', Markup.inlineKeyboard(buttons));
});

// Detail dan Tonton Film
bot.action(/movie_(.+)/, (ctx) => {
  const movieId = ctx.match[1];
  const movie = MOVIES.find(m => m.id === movieId);
  if (!movie) return ctx.reply('Film tidak ditemukan.');

  // Template Iklan Sponsor di Bawah Detail Film
  const sponsorAdText = "\\n\\n📢 *Sponsor Resmi:*\\n🚀 FastVPN: Streaming film 4K tanpa buffering. Diskon 70%!";

  const caption = \`🎬 *\${movie.title}*\\n⭐ Rating: \${movie.rating}\\n🏷 Genre: \${movie.genre}\\n📺 Kualitas: \${movie.quality}\\n\\n📖 Sinopsis:\\n\${movie.synopsis}\${sponsorAdText}\`;
  
  return ctx.replyWithMarkdown(caption, Markup.inlineKeyboard([
    [Markup.button.url('▶️ Nonton Sekarang (Web Stream)', movie.streamUrl)],
    [Markup.button.url('🎁 Sponsor: Coba FastVPN Diskon 70%', 'https://t.me/telegram')],
    [Markup.button.callback('🔙 Kembali ke Katalog', 'catalog')]
  ]));
});

// Cari film lewat teks
bot.on('text', (ctx) => {
  const query = ctx.message.text.toLowerCase();
  if (query.startsWith('/')) return;

  const found = MOVIES.filter(m => m.title.toLowerCase().includes(query));
  if (found.length === 0) {
    return ctx.reply(\`Maaf, film "\${query}" belum ditemukan di katalog. Ketik /request \${query} untuk meminta admin.\`);
  }

  const buttons = found.map(m => [Markup.button.callback(\`🎬 \${m.title}\`, \`movie_\${m.id}\`)]);
  return ctx.reply(\`Ditemukan \${found.length} film:\`, Markup.inlineKeyboard(buttons));
});

bot.launch().then(() => {
  console.log('🎬 Bot Telegram Nonton Film berhasil berjalan!');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));`;

  const standalonePythonScript = `# ==========================================
# CineTele - Bot Telegram Nonton Film (Python)
# Library: python-telegram-bot
# Jalankan: pip install python-telegram-bot && python bot.py
# ==========================================

import os
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ApplicationBuilder, CommandHandler, CallbackQueryHandler, MessageHandler, filters, ContextTypes

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "${config.botToken || 'YOUR_BOT_TOKEN_HERE'}")

MOVIES = [
    {
        "id": "1",
        "title": "Cyberpunk 2088: Jakarta Protocol",
        "rating": "8.8/10",
        "quality": "1080p FHD",
        "url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
    },
    {
        "id": "2",
        "title": "Garis Batas Langit",
        "rating": "8.5/10",
        "quality": "1080p FHD",
        "url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
    }
]

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_name = update.effective_user.first_name
    text = f"Halo {user_name}! 🍿\\n\\nSelamat datang di Bot Nonton Film.\\nPilih menu di bawah untuk streaming film:"
    keyboard = [
        [InlineKeyboardButton("🎬 Jelajahi Film", callback_data="catalog")],
        [InlineKeyboardButton("🔥 Trending", callback_data="trending")]
    ]
    await update.message.reply_text(text, reply_markup=InlineKeyboardMarkup(keyboard))

async def button_click(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    if query.data == "catalog":
        keyboard = [[InlineKeyboardButton(f"▶️ {m['title']}", url=m['url'])] for m in MOVIES]
        await query.edit_message_text("Pilih film untuk ditonton:", reply_markup=InlineKeyboardMarkup(keyboard))

if __name__ == '__main__':
    app = ApplicationBuilder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CallbackQueryHandler(button_click))
    print("🎬 Bot Python berjalan...")
    app.run_polling()`;

  const copyCode = (type: 'node' | 'python') => {
    if (type === 'node') {
      navigator.clipboard.writeText(standaloneNodeScript);
      setCopiedNode(true);
      setTimeout(() => setCopiedNode(false), 2000);
    } else {
      navigator.clipboard.writeText(standalonePythonScript);
      setCopiedPython(true);
      setTimeout(() => setCopiedPython(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('guide')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'guide' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          📖 Panduan Langkah demi Langkah
        </button>
        <button
          onClick={() => setActiveTab('cloudflare')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'cloudflare' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          ☁️ Deploy ke Cloudflare
        </button>
        <button
          onClick={() => setActiveTab('node')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'node' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          📦 Script Node.js (Telegraf)
        </button>
        <button
          onClick={() => setActiveTab('python')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'python' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🐍 Script Python (PTB)
        </button>
      </div>

      {activeTab === 'guide' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-8">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <span>Cara Membuat Bot Telegram Nonton Film Sendiri</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Ikuti 4 langkah mudah di bawah ini untuk membuat dan meluncurkan bot nonton film Anda ke publik.
            </p>
          </div>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                1
              </div>
              <div className="flex-1 space-y-1.5">
                <h4 className="text-sm font-bold text-slate-200">
                  Buat Bot di @BotFather Resmi Telegram
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Buka aplikasi Telegram dan cari akun resmi <b>@BotFather</b> (memiliki centang biru terverifikasi).
                  Kirim perintah <code>/newbot</code>, lalu masukkan nama bot (misal: <i>Bioskop Nonton HD</i>) dan username bot yang berakhiran <i>_bot</i> (misal: <i>CinemaFilmKeren_bot</i>).
                </p>
                <div className="p-3 bg-slate-950 rounded-lg text-xs font-mono text-amber-300/90 border border-slate-800">
                  BotFather akan memberikan pesan berisi HTTP API Token seperti:<br />
                  <span className="text-slate-300">7123456789:AAFn_your_secret_token_here</span>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                2
              </div>
              <div className="flex-1 space-y-1.5">
                <h4 className="text-sm font-bold text-slate-200">
                  Hubungkan Token ke CineTele Studio
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Masuk ke tab <b>Integrasi Bot</b> di atas, tempelkan API Token dari BotFather ke kolom token, lalu klik <b>Tes Koneksi</b>.
                  Sistem akan memverifikasi nama dan username bot Anda secara otomatis.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                3
              </div>
              <div className="flex-1 space-y-1.5">
                <h4 className="text-sm font-bold text-slate-200">
                  Atur Force Subscribe (FSub) untuk Menambah Follower Channel
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Buat Channel Telegram baru untuk komunitas Anda (misal: <i>@UpdateFilmTerbaru</i>).
                  Jadikan bot Anda sebagai <b>Administrator</b> di channel tersebut dengan izin mengelola pesan.
                  Aktifkan fitur <b>Force Subscribe</b> di tab Integrasi sehingga setiap orang yang ingin menonton film harus join channel Anda terlebih dahulu.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                4
              </div>
              <div className="flex-1 space-y-1.5">
                <h4 className="text-sm font-bold text-slate-200">
                  Kelola Film & Uji Coba di Simulator
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tambahkan film favorit Anda lewat tab <b>Katalog Film</b> (bisa gunakan bantuan AI Auto-Fill untuk menuliskan sinopsis dan genre dalam hitungan detik).
                  Lalu uji bot Anda di tab <b>Live Bot Simulator</b> untuk merasakan pengalaman pengguna yang realistis.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'cloudflare' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-8">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Globe className="w-5 h-5 text-amber-400" />
              <span>Panduan Lengkap Unggah / Deploy ke Cloudflare</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Cara mengunggah aplikasi CineTele ke Cloudflare Pages secara gratis dengan proteksi HTTPS otomatis, CDN global tercepat, dan custom domain.
            </p>
          </div>

          <div className="space-y-6">
            {/* Cloudflare Step 1 */}
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                1
              </div>
              <div className="flex-1 space-y-2">
                <h4 className="text-sm font-bold text-slate-200">
                  Daftar & Masuk ke Dashboard Cloudflare
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Buka <b>dash.cloudflare.com</b> dan buat akun Cloudflare (gratis tanpa memerlukan kartu kredit).
                  Di menu sebelah kiri, pilih <b>Workers & Pages</b> &gt; lalu klik tombol <b>Create application</b> &gt; pilih tab <b>Pages</b>.
                </p>
              </div>
            </div>

            {/* Cloudflare Step 2 */}
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                2
              </div>
              <div className="flex-1 space-y-2">
                <h4 className="text-sm font-bold text-slate-200">
                  Metode A (Rekomendasi): Hubungkan Repository GitHub / GitLab
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Upload file project ini ke akun GitHub Anda. Pada Cloudflare Pages, klik <b>Connect to Git</b> dan pilih repository Anda. Masukkan konfigurasi build berikut:
                </p>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 font-mono text-xs">
                  <div className="flex justify-between border-b border-slate-900 pb-1">
                    <span className="text-slate-500">Framework preset:</span>
                    <span className="text-amber-400 font-bold">Vite</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-1">
                    <span className="text-slate-500">Build command:</span>
                    <span className="text-emerald-400">npm run build</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-1">
                    <span className="text-slate-500">Build output directory:</span>
                    <span className="text-blue-400 font-bold">dist</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Environment variable:</span>
                    <span className="text-slate-300">NODE_VERSION = 20</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cloudflare Step 3 */}
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                3
              </div>
              <div className="flex-1 space-y-2">
                <h4 className="text-sm font-bold text-slate-200">
                  Metode B (Langsung dari Terminal CLI Wrangler):
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Jika Anda tidak ingin lewat GitHub dan ingin langsung mengunggah file dari komputer/terminal:
                </p>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
                  <p className="text-slate-500"># 1. Install Cloudflare CLI</p>
                  <p className="text-emerald-400">npm install -g wrangler</p>
                  <p className="text-slate-500 mt-2"># 2. Login ke akun Cloudflare</p>
                  <p className="text-emerald-400">npx wrangler login</p>
                  <p className="text-slate-500 mt-2"># 3. Build project Vite</p>
                  <p className="text-emerald-400">npm run build</p>
                  <p className="text-slate-500 mt-2"># 4. Upload folder dist ke Cloudflare Pages</p>
                  <p className="text-amber-300">npx wrangler pages deploy dist --project-name=cinetele-bot</p>
                </div>
              </div>
            </div>

            {/* Cloudflare Step 4 */}
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                4
              </div>
              <div className="flex-1 space-y-2">
                <h4 className="text-sm font-bold text-slate-200">
                  Konfigurasi Webhook Telegram dengan Domain Cloudflare
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Setelah deploy selesai, Cloudflare akan memberikan domain HTTPS gratis (contoh: <code>https://cinetele-bot.pages.dev</code>).
                  Buka browser dan daftarkan webhook ke bot Telegram Anda dengan URL ini:
                </p>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-amber-300 break-all">
                  https://api.telegram.org/bot{config.botToken || '&lt;TOKEN_BOT_ANDA&gt;'}/setWebhook?url=https://cinetele-bot.pages.dev/api/bot/webhook
                </div>
                <p className="text-[11px] text-slate-500">
                  *File <code>public/_redirects</code> sudah otomatis disiapkan di dalam proyek ini sehingga fitur SPA (Single Page Application) dan routing tidak akan error 404 saat di-refresh di Cloudflare.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'node' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Source Code Node.js (Telegraf Framework)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Kode mandiri siap dideploy ke server VPS, Heroku, Railway, atau Render
              </p>
            </div>
            <button
              onClick={() => copyCode('node')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              {copiedNode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedNode ? 'Tersalin!' : 'Salin Kode'}</span>
            </button>
          </div>

          <pre className="p-4 bg-slate-950 rounded-xl overflow-x-auto text-xs font-mono text-slate-200 leading-relaxed border border-slate-800 max-h-[500px]">
            {standaloneNodeScript}
          </pre>
        </div>
      )}

      {activeTab === 'python' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                <span>Source Code Python (python-telegram-bot)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Script Python lengkap untuk pengguna yang terbiasa dengan backend Python
              </p>
            </div>
            <button
              onClick={() => copyCode('python')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              {copiedPython ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPython ? 'Tersalin!' : 'Salin Kode'}</span>
            </button>
          </div>

          <pre className="p-4 bg-slate-950 rounded-xl overflow-x-auto text-xs font-mono text-slate-200 leading-relaxed border border-slate-800 max-h-[500px]">
            {standalonePythonScript}
          </pre>
        </div>
      )}
    </div>
  );
};
