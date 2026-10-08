import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_MOVIES, INITIAL_REQUESTS } from './src/data/initialMovies.js';
import { INITIAL_ADS } from './src/data/initialAds.js';
import { Movie, BotConfig, FilmRequest, TelegramAd } from './src/types/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory application state
let movies: Movie[] = [...INITIAL_MOVIES];
let requests: FilmRequest[] = [...INITIAL_REQUESTS];
let ads: TelegramAd[] = [...INITIAL_ADS];

let botConfig: BotConfig = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || '8685263385:AAHWYLnNeSmFGah00X-a7FM4UCGT-iQ3T_Y',
  botUsername: 'Nontonfilm1_bot',
  botName: 'Nonton Film HD',
  isConnected: true,
  pollingActive: true,
  webhookUrl: '',
  welcomeMessage: '🎬 Selamat datang di CineTele Bot!\nTempat nonton streaming film & series terlengkap dengan subtitle Indonesia kualitas HD & 4K.\n\nSilakan pilih menu di bawah ini untuk mulai menjelajahi film kesukaanmu!',
  forceSubEnabled: false,
  channelUsername: '@Nontonfilm1_channel',
  channelInviteLink: 'https://t.me/Nontonfilm1_bot',
  vipEnabled: true,
  vipFeeInfo: 'Rp 15.000 / Bulan (Akses Server VIP Super Cepat & Tanpa Iklan)',
  allowRequestFilm: true
};

let pollingTimer: NodeJS.Timeout | null = null;
let lastUpdateId = 0;

// Gemini client initialization if API key exists
let genAI: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenAI();
  } catch (err) {
    console.error('Failed to initialize Google Gen AI:', err);
  }
}

// Helper: send Telegram API request
async function callTelegramApi(token: string, method: string, body: Record<string, any>) {
  if (!token) throw new Error('Token bot Telegram belum diisi');
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return await res.json();
}

// Telegram Message Formatter & Dispatcher
function buildStartKeyboard() {
  const keyboard: any[][] = [
    [
      { text: '🎬 Jelajahi Katalog', callback_data: 'catalog_all' },
      { text: '🔥 Trending & Populer', callback_data: 'catalog_trending' }
    ],
    [
      { text: '🔍 Cari Film', callback_data: 'help_search' },
      { text: '📂 Genre Film', callback_data: 'genre_menu' }
    ],
    [
      { text: '⭐ Akses VIP', callback_data: 'vip_info' },
      { text: '📝 Request Judul', callback_data: 'req_guide' }
    ]
  ];

  // Attach sponsored button if active
  const startAd = ads.find(a => a.isActive && (a.placement === 'start_menu' || a.placement === 'inline_button'));
  if (startAd) {
    keyboard.push([{ text: `📢 ${startAd.buttonText}`, url: startAd.targetUrl }]);
    startAd.impressions += 1;
  }

  return { inline_keyboard: keyboard };
}

function buildMovieCardMarkup(movie: Movie, appUrl: string) {
  const watchUrl = `${appUrl}/#watch=${movie.id}`;
  const keyboard: any[][] = [
    [
      { text: '▶️ Tonton Streaming', url: watchUrl },
      { text: '🎞️ Trailer', callback_data: `trailer_${movie.id}` }
    ],
    [
      { text: '📥 Download 1080p', callback_data: `download_${movie.id}` },
      { text: '⭐ Simpan Favorit', callback_data: `fav_${movie.id}` }
    ]
  ];

  // Attach sponsor button on movie card if active
  const movieAd = ads.find(a => a.isActive && (a.placement === 'movie_footer' || a.placement === 'inline_button'));
  if (movieAd) {
    keyboard.push([{ text: `🎁 ${movieAd.buttonText}`, url: movieAd.targetUrl }]);
    movieAd.impressions += 1;
  }

  keyboard.push([{ text: '🔙 Kembali ke Menu', callback_data: 'start_menu' }]);

  return { inline_keyboard: keyboard };
}

// Process an incoming update from Telegram
async function handleTelegramUpdate(update: any, appUrl: string) {
  const token = botConfig.botToken;
  if (!token) return;

  try {
    // 1. Text Message
    if (update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text.trim();
      const userName = update.message.from.first_name || 'Penonton';

      if (text.startsWith('/start')) {
        await callTelegramApi(token, 'sendMessage', {
          chat_id: chatId,
          text: `Halo ${userName}! 👋\n\n${botConfig.welcomeMessage}`,
          parse_mode: 'HTML',
          reply_markup: buildStartKeyboard()
        });
        return;
      }

      if (text.startsWith('/trending') || text.startsWith('/populer')) {
        const trending = movies.filter(m => m.isTrending);
        const topTrending = trending[0] || movies[0];
        const buttons = trending.map((m, idx) => ([
          { text: `🔥 #${idx + 1} ${m.title} (Poster HD)`, callback_data: `view_${m.id}` }
        ]));
        buttons.push([{ text: '🔙 Menu Utama', callback_data: 'start_menu' }]);

        const caption = `🔥 <b>FILM TRENDING & PALING BANYAK DITONTON</b>\n\n` +
          `🏆 <b>Top #1: ${topTrending?.title}</b> (${topTrending?.year})\n` +
          `⭐ Rating: ${topTrending?.rating}/10 | ⏱ Durasi: ${topTrending?.duration}\n` +
          `🏷 Genre: ${topTrending?.genre.join(', ')}\n\n` +
          `📖 <i>"${topTrending?.synopsis}"</i>\n\n` +
          `👇 <b>Setiap judul telah disiapkan lengkap dengan poster & link stream. Pilih film di bawah untuk membuka poster:</b>`;

        const photoUrl = topTrending?.posterUrl.startsWith('http')
          ? topTrending.posterUrl
          : `${appUrl}${topTrending?.posterUrl}`;

        try {
          const res = await callTelegramApi(token, 'sendPhoto', {
            chat_id: chatId,
            photo: photoUrl,
            caption: caption,
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: buttons }
          });
          if (res.ok) return;
        } catch {}

        await callTelegramApi(token, 'sendMessage', {
          chat_id: chatId,
          text: caption,
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: buttons }
        });
        return;
      }

      if (text.startsWith('/film') || text.startsWith('/cari')) {
        const query = text.replace(/^\/(film|cari)/, '').trim().toLowerCase();
        if (!query) {
          await callTelegramApi(token, 'sendMessage', {
            chat_id: chatId,
            text: '🔍 Silakan tuliskan judul film yang ingin kamu cari.\nContoh: <code>/film Jakarta Protocol</code> atau <code>/cari Horror</code>',
            parse_mode: 'HTML'
          });
          return;
        }

        const matched = movies.filter(m => 
          m.title.toLowerCase().includes(query) || 
          m.genre.some(g => g.toLowerCase().includes(query)) ||
          m.synopsis.toLowerCase().includes(query)
        );

        if (matched.length === 0) {
          await callTelegramApi(token, 'sendMessage', {
            chat_id: chatId,
            text: `😔 Maaf, film dengan judul <b>"${query}"</b> belum tersedia.\n\nKetik <code>/request ${query}</code> untuk meminta admin menambahkan film ini!`,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '📝 Ajukan Request Film', callback_data: `req_custom_${encodeURIComponent(query)}` }]
              ]
            }
          });
          return;
        }

        // Show the best match
        const movie = matched[0];
        const caption = `🎬 <b>${movie.title}</b> (${movie.year})\n` +
          `⭐ Rating: ${movie.rating} | ⏱ Durasi: ${movie.duration}\n` +
          `🏷 Genre: ${movie.genre.join(', ')}\n` +
          `📺 Kualitas: ${movie.quality} | Sub: ${movie.language}\n\n` +
          `📖 <b>Sinopsis:</b>\n${movie.synopsis}`;

        await callTelegramApi(token, 'sendMessage', {
          chat_id: chatId,
          text: caption,
          parse_mode: 'HTML',
          reply_markup: buildMovieCardMarkup(movie, appUrl)
        });
        return;
      }

      if (text.startsWith('/request')) {
        const reqTitle = text.replace(/^\/request/, '').trim();
        if (!reqTitle) {
          await callTelegramApi(token, 'sendMessage', {
            chat_id: chatId,
            text: 'Format request: <code>/request Judul Film (Tahun)</code>\nContoh: <code>/request Inception 2010</code>',
            parse_mode: 'HTML'
          });
          return;
        }

        const newReq: FilmRequest = {
          id: `req-${Date.now()}`,
          user: `@${update.message.from.username || update.message.from.first_name}`,
          title: reqTitle,
          status: 'pending',
          createdAt: 'Baru saja'
        };
        requests.unshift(newReq);

        await callTelegramApi(token, 'sendMessage', {
          chat_id: chatId,
          text: `✅ Request film <b>"${reqTitle}"</b> berhasil dikirim ke antrean admin!\nKami akan mengunggahnya secepat mungkin.`,
          parse_mode: 'HTML'
        });
        return;
      }

      // Default fallback
      await callTelegramApi(token, 'sendMessage', {
        chat_id: chatId,
        text: `Ketik <b>/film [judul]</b> untuk mencari film atau klik tombol di bawah untuk membuka menu utama.`,
        parse_mode: 'HTML',
        reply_markup: buildStartKeyboard()
      });
    }

    // 2. Callback Queries (Inline Button clicks)
    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message.chat.id;
      const data = cb.data;

      // Answer callback query first
      await callTelegramApi(token, 'answerCallbackQuery', {
        callback_query_id: cb.id
      });

      if (data === 'start_menu') {
        await callTelegramApi(token, 'sendMessage', {
          chat_id: chatId,
          text: botConfig.welcomeMessage,
          parse_mode: 'HTML',
          reply_markup: buildStartKeyboard()
        });
      } else if (data === 'catalog_trending') {
        const trending = movies.filter(m => m.isTrending);
        const topTrending = trending[0] || movies[0];
        const buttons = trending.map(m => ([
          { text: `🔥 ${m.title} (${m.rating}⭐)`, callback_data: `view_${m.id}` }
        ]));
        buttons.push([{ text: '🔙 Menu Utama', callback_data: 'start_menu' }]);

        const text = `🔥 <b>FILM TRENDING & PALING BANYAK DITONTON</b>\n\n` +
          `🏆 <b>Top #1: ${topTrending?.title}</b> (${topTrending?.year})\n` +
          `⭐ Rating: ${topTrending?.rating} | ⏱ Durasi: ${topTrending?.duration}\n` +
          `🏷 Genre: ${topTrending?.genre.join(', ')}\n\n` +
          `📖 <i>"${topTrending?.synopsis}"</i>\n\n` +
          `👇 Pilih judul di bawah untuk melihat detail poster & streaming:`;

        const photoUrl = topTrending?.posterUrl.startsWith('http')
          ? topTrending.posterUrl
          : `${appUrl}${topTrending?.posterUrl}`;

        try {
          const res = await callTelegramApi(token, 'sendPhoto', {
            chat_id: chatId,
            photo: photoUrl,
            caption: text,
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: buttons }
          });
          if (res.ok) return;
        } catch {}

        await callTelegramApi(token, 'sendMessage', {
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: buttons }
        });
      } else if (data === 'catalog_all') {
        const buttons = movies.slice(0, 8).map(m => ([
          { text: `🎬 ${m.title}`, callback_data: `view_${m.id}` }
        ]));
        buttons.push([{ text: '🔙 Menu Utama', callback_data: 'start_menu' }]);

        await callTelegramApi(token, 'sendMessage', {
          chat_id: chatId,
          text: '🎬 <b>Katalog Film Terbaru:</b>',
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: buttons }
        });
      } else if (data.startsWith('view_')) {
        const movieId = data.replace('view_', '');
        const movie = movies.find(m => m.id === movieId);
        if (movie) {
          const caption = `🎬 <b>${movie.title}</b> (${movie.year})\n` +
            `⭐ Rating: ${movie.rating} | ⏱ Durasi: ${movie.duration}\n` +
            `🏷 Genre: ${movie.genre.join(', ')}\n` +
            `📺 Kualitas: ${movie.quality} | Sub: ${movie.language}\n\n` +
            `📖 <b>Sinopsis:</b>\n${movie.synopsis}`;

          const photoUrl = movie.posterUrl.startsWith('http')
            ? movie.posterUrl
            : `${appUrl}${movie.posterUrl}`;

          try {
            const res = await callTelegramApi(token, 'sendPhoto', {
              chat_id: chatId,
              photo: photoUrl,
              caption: caption,
              parse_mode: 'HTML',
              reply_markup: buildMovieCardMarkup(movie, appUrl)
            });
            if (res.ok) return;
          } catch {}

          await callTelegramApi(token, 'sendMessage', {
            chat_id: chatId,
            text: caption,
            parse_mode: 'HTML',
            reply_markup: buildMovieCardMarkup(movie, appUrl)
          });
        }
      } else if (data.startsWith('download_')) {
        const movieId = data.replace('download_', '');
        const movie = movies.find(m => m.id === movieId);
        if (movie) {
          await callTelegramApi(token, 'sendMessage', {
            chat_id: chatId,
            text: `📥 <b>Link Download Film: ${movie.title}</b>\n\n` +
              `• Resolusi: ${movie.quality}\n` +
              `• Audio/Subtitle: ${movie.language}\n` +
              `• File ID: <code>${movie.telegramFileId || 'TLG-FL-STREAM-DIRECT'}</code>\n\n` +
              `Klik link streaming di bawah untuk download langsung:`,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '⬇️ Download via Web Fast Server', url: movie.streamUrl }],
                [{ text: '🔙 Kembali ke Film', callback_data: `view_${movie.id}` }]
              ]
            }
          });
        }
      } else if (data === 'genre_menu') {
        await callTelegramApi(token, 'sendMessage', {
          chat_id: chatId,
          text: '📂 <b>Pilih Kategori / Genre Film:</b>',
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '💥 Action', callback_data: 'g_Action' },
                { text: '🚀 Sci-Fi', callback_data: 'g_Sci-Fi' }
              ],
              [
                { text: '👻 Horror', callback_data: 'g_Horror' },
                { text: '🎭 Drama', callback_data: 'g_Drama' }
              ],
              [
                { text: '🔍 Thriller', callback_data: 'g_Thriller' },
                { text: '❤️ Romance', callback_data: 'g_Romance' }
              ],
              [{ text: '🔙 Menu Utama', callback_data: 'start_menu' }]
            ]
          }
        });
      } else if (data.startsWith('g_')) {
        const genre = data.replace('g_', '');
        const matched = movies.filter(m => m.genre.includes(genre));
        const buttons = matched.map(m => ([{ text: `🎬 ${m.title}`, callback_data: `view_${m.id}` }]));
        buttons.push([{ text: '🔙 Kategori Lain', callback_data: 'genre_menu' }]);

        await callTelegramApi(token, 'sendMessage', {
          chat_id: chatId,
          text: `📂 Film dengan genre <b>${genre}</b> (${matched.length} judul):`,
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: buttons }
        });
      } else if (data === 'vip_info') {
        await callTelegramApi(token, 'sendMessage', {
          chat_id: chatId,
          text: `⭐ <b>PAKET MEMBER VIP CINETELE</b> ⭐\n\n` +
            `Nikmati fitur premium:\n` +
            `✅ Akses rilis tercepat (Bioskop tayang perdana)\n` +
            `✅ Streaming 4K Ultra HD tanpa kompresi\n` +
            `✅ Server download direct unthrottled\n` +
            `✅ Prioritas request film 24 jam\n\n` +
            `💰 <b>Tarif:</b> ${botConfig.vipFeeInfo}\n\n` +
            `Hubungi Admin untuk aktivasi instan: @AdminCineTele`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '💬 Hubungi Admin VIP', url: 'https://t.me/telegram' }],
              [{ text: '🔙 Menu Utama', callback_data: 'start_menu' }]
            ]
          }
        });
      } else if (data === 'req_guide') {
        await callTelegramApi(token, 'sendMessage', {
          chat_id: chatId,
          text: '📝 <b>Cara Request Film Baru:</b>\n\nCukup kirim pesan dengan format:\n<code>/request Judul Film (Tahun)</code>\n\nContoh:\n<code>/request Dune Part Two 2024</code>',
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[{ text: '🔙 Menu Utama', callback_data: 'start_menu' }]]
          }
        });
      }
    }
  } catch (err: any) {
    console.error('Error handling Telegram update:', err);
  }
}

// REST API Endpoints

// 1. Get bot config & connection status
app.get('/api/bot/config', async (req: Request, res: Response) => {
  res.json({
    ...botConfig,
    botToken: botConfig.botToken ? `${botConfig.botToken.slice(0, 6)}...${botConfig.botToken.slice(-4)}` : ''
  });
});

// 2. Test bot token validity with Telegram getMe
app.post('/api/bot/test-token', async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ ok: false, error: 'Token tidak boleh kosong' });
  }

  try {
    const data = await callTelegramApi(token, 'getMe', {});
    if (data.ok) {
      return res.json({
        ok: true,
        bot: {
          id: data.result.id,
          name: data.result.first_name,
          username: data.result.username,
          can_join_groups: data.result.can_join_groups,
          can_read_all_group_messages: data.result.can_read_all_group_messages
        }
      });
    } else {
      return res.status(400).json({ ok: false, error: data.description || 'Token tidak valid' });
    }
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message || 'Gagal menghubungi Telegram API' });
  }
});

// 3. Save bot configuration
app.post('/api/bot/config', async (req: Request, res: Response) => {
  const updates = req.body;
  const tokenToTest = updates.botToken || botConfig.botToken;

  if (updates.botToken && updates.botToken.trim()) {
    botConfig.botToken = updates.botToken.trim();
    // Verify token with Telegram
    try {
      const getMe = await callTelegramApi(botConfig.botToken, 'getMe', {});
      if (getMe.ok) {
        botConfig.botUsername = getMe.result.username || botConfig.botUsername;
        botConfig.botName = getMe.result.first_name || botConfig.botName;
        botConfig.isConnected = true;
      }
    } catch {
      // keep token anyway
    }
  }

  if (updates.welcomeMessage !== undefined) botConfig.welcomeMessage = updates.welcomeMessage;
  if (updates.forceSubEnabled !== undefined) botConfig.forceSubEnabled = updates.forceSubEnabled;
  if (updates.channelUsername !== undefined) botConfig.channelUsername = updates.channelUsername;
  if (updates.channelInviteLink !== undefined) botConfig.channelInviteLink = updates.channelInviteLink;
  if (updates.vipEnabled !== undefined) botConfig.vipEnabled = updates.vipEnabled;
  if (updates.vipFeeInfo !== undefined) botConfig.vipFeeInfo = updates.vipFeeInfo;
  if (updates.allowRequestFilm !== undefined) botConfig.allowRequestFilm = updates.allowRequestFilm;

  res.json({
    ok: true,
    config: {
      ...botConfig,
      botToken: botConfig.botToken ? `${botConfig.botToken.slice(0, 6)}...${botConfig.botToken.slice(-4)}` : ''
    }
  });
});

// Helper to start real Telegram Bot polling engine
async function startPollingEngine() {
  if (!botConfig.botToken) return;
  try {
    // Delete any webhook first to enable getUpdates polling
    await callTelegramApi(botConfig.botToken, 'deleteWebhook', {});
    botConfig.pollingActive = true;
    const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;

    if (pollingTimer) clearInterval(pollingTimer);

    pollingTimer = setInterval(async () => {
      if (!botConfig.pollingActive || !botConfig.botToken) return;
      try {
        const res = await callTelegramApi(botConfig.botToken, 'getUpdates', {
          offset: lastUpdateId + 1,
          timeout: 5
        });
        if (res.ok && Array.isArray(res.result)) {
          for (const upd of res.result) {
            lastUpdateId = upd.update_id;
            await handleTelegramUpdate(upd, appUrl);
          }
        }
      } catch (e) {
        // network or polling timeout, ignore
      }
    }, 2500);

    console.log(`🤖 Telegram Bot Polling Live: @${botConfig.botUsername} is ready!`);
  } catch (err: any) {
    console.error('Failed to start Telegram polling:', err.message);
  }
}

// 4. Toggle polling mode
app.post('/api/bot/polling/toggle', async (req: Request, res: Response) => {
  if (!botConfig.botToken) {
    return res.status(400).json({ ok: false, error: 'Silakan isi Bot Token terlebih dahulu.' });
  }

  if (botConfig.pollingActive) {
    if (pollingTimer) {
      clearInterval(pollingTimer);
      pollingTimer = null;
    }
    botConfig.pollingActive = false;
    return res.json({ ok: true, pollingActive: false, message: 'Bot polling dinonaktifkan' });
  } else {
    try {
      await startPollingEngine();
      return res.json({ ok: true, pollingActive: true, message: 'Bot polling aktif! Bot Anda sekarang live di Telegram.' });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }
});

// 5. Telegram Webhook endpoint
app.post('/api/bot/webhook', async (req: Request, res: Response) => {
  const update = req.body;
  const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
  if (update) {
    handleTelegramUpdate(update, appUrl).catch(console.error);
  }
  res.json({ ok: true });
});

// 6. Set Webhook URL to Telegram
app.post('/api/bot/set-webhook', async (req: Request, res: Response) => {
  const appUrl = process.env.APP_URL;
  if (!botConfig.botToken) {
    return res.status(400).json({ ok: false, error: 'Bot token belum diatur.' });
  }
  if (!appUrl) {
    return res.status(400).json({ ok: false, error: 'APP_URL belum tersedia di environment.' });
  }

  const webhookUrl = `${appUrl}/api/bot/webhook`;
  try {
    const result = await callTelegramApi(botConfig.botToken, 'setWebhook', {
      url: webhookUrl
    });
    if (result.ok) {
      botConfig.webhookUrl = webhookUrl;
      return res.json({ ok: true, webhookUrl, description: result.description });
    } else {
      return res.status(400).json({ ok: false, error: result.description });
    }
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// 7. Movies CRUD
app.get('/api/bot/movies', (req: Request, res: Response) => {
  res.json(movies);
});

app.post('/api/bot/movies', (req: Request, res: Response) => {
  const body = req.body;
  if (!body.title) {
    return res.status(400).json({ error: 'Judul film wajib diisi' });
  }

  const newMovie: Movie = {
    id: `film-${Date.now()}`,
    title: body.title,
    genre: Array.isArray(body.genre) ? body.genre : (body.genre ? body.genre.split(',').map((g: string) => g.trim()) : ['Umum']),
    year: Number(body.year) || 2026,
    rating: Number(body.rating) || 8.0,
    duration: body.duration || '2j 00m',
    quality: body.quality || '1080p FHD',
    language: body.language || 'Sub Indo',
    synopsis: body.synopsis || 'Sinopsis belum tersedia.',
    posterUrl: body.posterUrl || '/src/assets/images/hero_cinema_backdrop_1791448461059.jpg',
    trailerUrl: body.trailerUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    streamUrl: body.streamUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    telegramFileId: body.telegramFileId || '',
    downloadUrl: body.downloadUrl || body.streamUrl,
    isTrending: Boolean(body.isTrending),
    isVip: Boolean(body.isVip),
    views: 120,
    addedAt: new Date().toISOString().split('T')[0]
  };

  movies.unshift(newMovie);
  res.status(201).json(newMovie);
});

app.put('/api/bot/movies/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = movies.findIndex(m => m.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Film tidak ditemukan' });
  }

  movies[idx] = {
    ...movies[idx],
    ...req.body,
    genre: Array.isArray(req.body.genre) ? req.body.genre : (typeof req.body.genre === 'string' ? req.body.genre.split(',').map((g: string) => g.trim()) : movies[idx].genre)
  };

  res.json(movies[idx]);
});

app.delete('/api/bot/movies/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  movies = movies.filter(m => m.id !== id);
  res.json({ ok: true });
});

// 8. Film Requests
app.get('/api/bot/requests', (req: Request, res: Response) => {
  res.json(requests);
});

app.patch('/api/bot/requests/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const reqItem = requests.find(r => r.id === id);
  if (reqItem && status) {
    reqItem.status = status;
    return res.json(reqItem);
  }
  res.status(404).json({ error: 'Request tidak ditemukan' });
});

// 9. Telegram Broadcast message
app.post('/api/bot/broadcast', async (req: Request, res: Response) => {
  const { channelOrChatId, text, photoUrl } = req.body;
  if (!botConfig.botToken) {
    return res.status(400).json({ ok: false, error: 'Bot Token belum diisi' });
  }
  const target = channelOrChatId || botConfig.channelUsername;
  if (!target) {
    return res.status(400).json({ ok: false, error: 'Target Channel / Chat ID wajib diisi' });
  }

  try {
    let result;
    if (photoUrl) {
      result = await callTelegramApi(botConfig.botToken, 'sendPhoto', {
        chat_id: target,
        photo: photoUrl,
        caption: text,
        parse_mode: 'HTML'
      });
    } else {
      result = await callTelegramApi(botConfig.botToken, 'sendMessage', {
        chat_id: target,
        text: text,
        parse_mode: 'HTML'
      });
    }

    if (result.ok) {
      return res.json({ ok: true, result });
    } else {
      return res.status(400).json({ ok: false, error: result.description });
    }
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// 10. AI Movie Synopsis & Metadata Generator
app.post('/api/bot/ai-recommend', async (req: Request, res: Response) => {
  const { prompt, type } = req.body;

  if (genAI && process.env.GEMINI_API_KEY) {
    try {
      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Anda adalah pakar kurator film dan asisten bot Telegram bioskop. 
        Tugas: ${type === 'synopsis' ? 'Buat sinopsis film Indonesia yang memikat, rating perkiraan, dan daftar tag/genre.' : 'Rekomendasikan 3 ide film atau sinopsis film seru untuk dimasukkan ke katalog bot.'}
        Input: "${prompt}".
        Balas dalam format JSON valid dengan field:
        {
          "title": "Judul Film",
          "synopsis": "Sinopsis memikat dalam bahasa Indonesia 2-3 kalimat",
          "genre": ["Genre1", "Genre2"],
          "rating": 8.5,
          "duration": "2j 10m"
        }`
      });

      const text = response.text || '';
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return res.json({ ok: true, data: parsed });
    } catch (e) {
      // Fallback to algorithmic generator
    }
  }

  // Fallback metadata generator
  const fallbackData = {
    title: prompt || 'Ekspedisi Nusantara',
    synopsis: `Kisah mendebarkan seputar petualangan menegangkan di pedalaman nusantara yang mengungkap konspirasi masa lalu dan ikatan persaudaraan yang tak tergoyahkan.`,
    genre: ['Petualangan', 'Action', 'Drama'],
    rating: 8.6,
    duration: '2j 05m'
  };

  return res.json({ ok: true, data: fallbackData });
});

// 11. Telegram Ads Management
app.get('/api/bot/ads', (req: Request, res: Response) => {
  res.json(ads);
});

app.post('/api/bot/ads', (req: Request, res: Response) => {
  const body = req.body;
  if (!body.title || !body.buttonText || !body.targetUrl) {
    return res.status(400).json({ error: 'Judul, Teks Tombol, dan Target URL iklan wajib diisi' });
  }

  const newAd: TelegramAd = {
    id: `ad-${Date.now()}`,
    title: body.title,
    sponsorName: body.sponsorName || 'Sponsor Resmi',
    text: body.text || '',
    buttonText: body.buttonText,
    targetUrl: body.targetUrl,
    imageUrl: body.imageUrl || '',
    placement: body.placement || 'movie_footer',
    isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    impressions: 0,
    clicks: 0,
    createdAt: new Date().toISOString().split('T')[0]
  };

  ads.unshift(newAd);
  res.status(201).json(newAd);
});

app.put('/api/bot/ads/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = ads.findIndex(a => a.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Iklan tidak ditemukan' });
  }

  ads[idx] = {
    ...ads[idx],
    ...req.body
  };
  res.json(ads[idx]);
});

app.delete('/api/bot/ads/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  ads = ads.filter(a => a.id !== id);
  res.json({ ok: true });
});

app.post('/api/bot/ads/:id/click', (req: Request, res: Response) => {
  const { id } = req.params;
  const ad = ads.find(a => a.id === id);
  if (ad) {
    ad.clicks = (ad.clicks || 0) + 1;
    return res.json({ ok: true, clicks: ad.clicks });
  }
  res.status(404).json({ error: 'Iklan tidak ditemukan' });
});

// Setup Vite Dev Middleware or Static Serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎬 CineTele Bot Studio Server running at http://0.0.0.0:${PORT}`);
    // Auto start polling for Telegram Bot
    startPollingEngine().catch(console.error);
  });
}

startServer();
