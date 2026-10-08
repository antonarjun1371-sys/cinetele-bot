import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Check, CheckCheck, RefreshCw, Sparkles, Film, Play, ExternalLink, ShieldCheck, Flame, Search, Heart, Info, AlertCircle, ArrowLeft, Megaphone } from 'lucide-react';
import { Movie, BotConfig, TelegramMessage, InlineButton, TelegramAd } from '../types';

interface TelegramSimulatorProps {
  movies: Movie[];
  botConfig: BotConfig;
  ads: TelegramAd[];
  onWatchMovie: (movie: Movie) => void;
  onRequestFilm: (title: string, username?: string) => void;
  onAdClick?: (adId: string) => void;
}

export const TelegramSimulator: React.FC<TelegramSimulatorProps> = ({
  movies,
  botConfig,
  ads,
  onWatchMovie,
  onRequestFilm,
  onAdClick
}) => {
  const getStartKeyboard = () => {
    const kb: InlineButton[][] = [
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

    const activeAd = ads.find((a) => a.isActive && (a.placement === 'start_menu' || a.placement === 'inline_button'));
    if (activeAd) {
      kb.push([{ text: `📢 ${activeAd.buttonText}`, url: activeAd.targetUrl, callback_data: `ad_${activeAd.id}` }]);
    }
    return kb;
  };

  const [messages, setMessages] = useState<TelegramMessage[]>([
    {
      id: 'msg-init-1',
      sender: 'bot',
      text: `Halo Penonton! 👋\n\n${botConfig.welcomeMessage}`,
      timestamp: 'Baru saja',
      replyMarkup: {
        inline_keyboard: getStartKeyboard()
      }
    }
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasJoinedChannel, setHasJoinedChannel] = useState(!botConfig.forceSubEnabled);
  const [favorites, setFavorites] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const addMessage = (msg: Omit<TelegramMessage, 'id' | 'timestamp'>) => {
    const newMsg: TelegramMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  const simulateBotReply = (reply: () => void, delayMs = 600) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      reply();
    }, delayMs);
  };

  const handleSend = (textToSend?: string) => {
    const query = (textToSend !== undefined ? textToSend : inputVal).trim();
    if (!query) return;

    // Push user message
    addMessage({
      sender: 'user',
      text: query
    });
    if (textToSend === undefined) setInputVal('');

    // Process Bot Response
    const lower = query.toLowerCase();

    if (lower === '/start' || lower === 'start') {
      simulateBotReply(() => {
        addMessage({
          sender: 'bot',
          text: `Halo Penggemar Sinema! 👋\n\n${botConfig.welcomeMessage}`,
          replyMarkup: {
            inline_keyboard: [
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
            ]
          }
        });
      });
      return;
    }

    if (lower.startsWith('/request')) {
      const title = query.replace(/^\/request/, '').trim();
      if (!title) {
        simulateBotReply(() => {
          addMessage({
            sender: 'bot',
            text: 'Format request: <code>/request Judul Film (Tahun)</code>\nContoh: <code>/request Inception (2010)</code>'
          });
        });
        return;
      }

      onRequestFilm(title, '@penonton_telegram');
      simulateBotReply(() => {
        addMessage({
          sender: 'bot',
          text: `✅ Request film <b>"${title}"</b> telah dicatat dalam antrean admin!\n\nBot akan memberikan notifikasi setelah film berhasil diunggah ke server.`
        });
      });
      return;
    }

    if (lower === '/trending' || lower === 'trending' || lower === '/populer' || lower === 'populer') {
      sendTrendingShowcase();
      return;
    }

    if (lower === '/posters' || lower === '/poster') {
      sendAllTrendingPosters();
      return;
    }

    if (lower.startsWith('/film') || lower.startsWith('/cari')) {
      const searchTitle = query.replace(/^\/(film|cari)/, '').trim();
      executeSearch(searchTitle);
      return;
    }

    // Default: treat as film search query
    executeSearch(query);
  };

  const executeSearch = (searchTitle: string) => {
    if (!searchTitle) {
      simulateBotReply(() => {
        addMessage({
          sender: 'bot',
          text: '🔍 Ketik judul film atau sutradara yang ingin dicari.\nContoh: <code>/film Jakarta Protocol</code>'
        });
      });
      return;
    }

    const matched = movies.filter((m) =>
      m.title.toLowerCase().includes(searchTitle.toLowerCase()) ||
      m.genre.some((g) => g.toLowerCase().includes(searchTitle.toLowerCase())) ||
      m.synopsis.toLowerCase().includes(searchTitle.toLowerCase())
    );

    simulateBotReply(() => {
      if (matched.length === 0) {
        addMessage({
          sender: 'bot',
          text: `😔 Maaf, film dengan kata kunci <b>"${searchTitle}"</b> tidak ditemukan di basis data saat ini.\n\nKamu bisa request film ini dengan perintah:\n<code>/request ${searchTitle}</code>`,
          replyMarkup: {
            inline_keyboard: [
              [{ text: `📝 Request "${searchTitle}"`, callback_data: `req_custom_${encodeURIComponent(searchTitle)}` }],
              [{ text: '🔥 Lihat Film Trending Saja', callback_data: 'catalog_trending' }]
            ]
          }
        });
      } else {
        const movie = matched[0];
        sendMovieCard(movie);
      }
    });
  };

  const sendMovieCard = (movie: Movie) => {
    const isFav = favorites.includes(movie.id);

    // Check for active movie footer ad
    const movieAd = ads.find((a) => a.isActive && (a.placement === 'movie_footer' || a.placement === 'inline_button'));
    let adText = '';
    if (movieAd) {
      adText = `\n\n📢 <b>Sponsor: ${movieAd.sponsorName}</b>\n${movieAd.text}`;
      if (onAdClick) {
        // Track impression
        movieAd.impressions += 1;
      }
    }

    const inlineKeyboard: InlineButton[][] = [
      [
        { text: '▶️ Nonton Sekarang', callback_data: `watch_${movie.id}` },
        { text: '🎞️ Trailer', callback_data: `trailer_${movie.id}` }
      ],
      [
        { text: '📥 Download HD', callback_data: `dl_${movie.id}` },
        { text: isFav ? '❤️ Disimpan' : '🤍 Simpan Favorit', callback_data: `fav_${movie.id}` }
      ]
    ];

    if (movieAd) {
      inlineKeyboard.push([
        { text: `🎁 ${movieAd.buttonText}`, url: movieAd.targetUrl, callback_data: `ad_${movieAd.id}` }
      ]);
    }

    inlineKeyboard.push([
      { text: '🔙 Kembali ke Menu', callback_data: 'menu_start' }
    ]);

    addMessage({
      sender: 'bot',
      photoUrl: movie.posterUrl,
      text: `🎬 <b>${movie.title}</b> (${movie.year})\n\n` +
        `⭐ <b>Rating:</b> ${movie.rating}/10\n` +
        `⏱ <b>Durasi:</b> ${movie.duration}\n` +
        `🏷 <b>Genre:</b> ${movie.genre.join(', ')}\n` +
        `📺 <b>Kualitas:</b> ${movie.quality}\n` +
        `🇮🇩 <b>Bahasa:</b> ${movie.language}\n\n` +
        `📖 <b>Sinopsis:</b>\n${movie.synopsis}${adText}`,
      replyMarkup: {
        inline_keyboard: inlineKeyboard
      },
      metadata: { movieId: movie.id, type: 'movie_card' }
    });
  };

  const sendTrendingShowcase = () => {
    simulateBotReply(() => {
      const trending = movies.filter((m) => m.isTrending);
      const topTrending = trending[0] || movies[0];
      const buttons: InlineButton[][] = [
        [
          { text: '🖼️ Tampilkan Semua Poster Sekaligus', callback_data: 'trending_all_posters' }
        ]
      ];

      // Add individual trending titles with poster indicator
      trending.forEach((m, idx) => {
        buttons.push([
          { text: `🔥 #${idx + 1} ${m.title} (Buka Poster)`, callback_data: `view_${m.id}` }
        ]);
      });

      buttons.push([
        { text: '🎬 Katalog Lengkap', callback_data: 'catalog_all' },
        { text: '🔙 Menu Utama', callback_data: 'menu_start' }
      ]);

      addMessage({
        sender: 'bot',
        photoUrl: topTrending?.posterUrl,
        text: `🔥 <b>FILM TRENDING & PALING BANYAK DITONTON</b>\n\n` +
          `🏆 <b>Top #1 Trending:</b> ${topTrending?.title} (${topTrending?.year})\n` +
          `⭐ <b>Rating:</b> ${topTrending?.rating}/10 | ⏱ <b>Durasi:</b> ${topTrending?.duration}\n` +
          `🏷 <b>Genre:</b> ${topTrending?.genre.join(', ')} | 📺 <b>Kualitas:</b> ${topTrending?.quality}\n\n` +
          `📖 <b>Sinopsis:</b>\n${topTrending?.synopsis}\n\n` +
          `🖼️ <i>Setiap judul film di bawah telah disiapkan lengkap dengan poster resmi & link streaming HD. Klik judul film untuk membuka posternya atau klik tombol "Tampilkan Semua Poster Sekaligus" di atas!</i>`,
        replyMarkup: { inline_keyboard: buttons }
      });
    });
  };

  const sendAllTrendingPosters = () => {
    simulateBotReply(() => {
      const trending = movies.filter((m) => m.isTrending);
      addMessage({
        sender: 'bot',
        text: `🖼️ <b>MEMUAT POSTER LENGKAP ${trending.length} FILM TRENDING & POPULER...</b>\nBerikut adalah poster resmi dan tautan streaming langsung untuk setiap film populer:`
      });

      trending.forEach((m, idx) => {
        setTimeout(() => {
          sendMovieCard(m);
        }, (idx + 1) * 350);
      });
    });
  };

  const handleCallbackClick = (btn: InlineButton) => {
    // If external URL or ad button clicked
    if (btn.callback_data && btn.callback_data.startsWith('ad_')) {
      const adId = btn.callback_data.replace('ad_', '');
      if (onAdClick) onAdClick(adId);
      if (btn.url) window.open(btn.url, '_blank');
      return;
    }

    if (btn.url) {
      window.open(btn.url, '_blank');
      return;
    }

    const data = btn.callback_data;
    if (!data) return;

    if (data === 'menu_start' || data === 'start_menu') {
      simulateBotReply(() => {
        addMessage({
          sender: 'bot',
          text: botConfig.welcomeMessage,
          replyMarkup: {
            inline_keyboard: [
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
            ]
          }
        });
      });
      return;
    }

    if (data === 'catalog_trending') {
      sendTrendingShowcase();
      return;
    }

    if (data === 'trending_all_posters') {
      sendAllTrendingPosters();
      return;
    }

    if (data === 'catalog_all') {
      simulateBotReply(() => {
        const buttons = movies.slice(0, 6).map((m) => ([
          { text: `🎬 ${m.title} (${m.quality})`, callback_data: `view_${m.id}` }
        ]));
        buttons.push([{ text: '🔙 Menu Utama', callback_data: 'menu_start' }]);

        addMessage({
          sender: 'bot',
          text: `🎬 <b>Daftar Katalog Film (${movies.length} judul):</b>\nKlik judul untuk melihat detail dan link stream:`,
          replyMarkup: { inline_keyboard: buttons }
        });
      });
      return;
    }

    if (data === 'genre_menu') {
      simulateBotReply(() => {
        addMessage({
          sender: 'bot',
          text: '📂 <b>Pilih Kategori / Genre Film:</b>',
          replyMarkup: {
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
              [{ text: '🔙 Menu Utama', callback_data: 'menu_start' }]
            ]
          }
        });
      });
      return;
    }

    if (data.startsWith('g_')) {
      const genre = data.replace('g_', '');
      const filtered = movies.filter((m) => m.genre.includes(genre));
      simulateBotReply(() => {
        const buttons = filtered.map((m) => ([
          { text: `🎬 ${m.title}`, callback_data: `view_${m.id}` }
        ]));
        buttons.push([{ text: '🔙 Pilih Genre Lain', callback_data: 'genre_menu' }]);

        addMessage({
          sender: 'bot',
          text: `📂 Film dengan genre <b>${genre}</b> (${filtered.length} film):`,
          replyMarkup: { inline_keyboard: buttons }
        });
      });
      return;
    }

    if (data.startsWith('view_')) {
      const id = data.replace('view_', '');
      const movie = movies.find((m) => m.id === id);
      if (movie) {
        simulateBotReply(() => sendMovieCard(movie));
      }
      return;
    }

    if (data.startsWith('watch_')) {
      const id = data.replace('watch_', '');
      const movie = movies.find((m) => m.id === id);
      if (!movie) return;

      // Force Subscribe Check
      if (botConfig.forceSubEnabled && !hasJoinedChannel) {
        simulateBotReply(() => {
          addMessage({
            sender: 'bot',
            text: `⚠️ <b>PERINGATAN: WAJIB JOIN CHANNEL SPONSOR!</b>\n\nUntuk membuka link streaming <b>"${movie.title}"</b>, kamu harus bergabung ke channel resmi kami terlebih dahulu.\n\nChannel: <b>${botConfig.channelUsername}</b>`,
            replyMarkup: {
              inline_keyboard: [
                [{ text: `📢 Join Channel ${botConfig.channelUsername}`, callback_data: 'join_channel_sim' }],
                [{ text: '✅ Saya Sudah Join (Buka Link)', callback_data: `verify_fsub_${movie.id}` }]
              ]
            }
          });
        });
        return;
      }

      // If FSub is verified or disabled, launch player!
      onWatchMovie(movie);
      simulateBotReply(() => {
        addMessage({
          sender: 'bot',
          text: `🎉 <b>Menyiapkan Pemutar Streaming:</b>\nFilm <b>${movie.title}</b> sedang dimuat di Web Cinema Player!\n\nSelamat menikmati tontonan film kualitas ${movie.quality}.`
        });
      }, 300);
      return;
    }

    if (data === 'join_channel_sim') {
      setHasJoinedChannel(true);
      simulateBotReply(() => {
        addMessage({
          sender: 'bot',
          text: `✅ Kamu berhasil bergabung ke channel sponsor <b>${botConfig.channelUsername}</b>! Silakan klik tombol "Buka Link" pada pesan sebelumnya atau pilih nonton lagi.`
        });
      }, 300);
      return;
    }

    if (data.startsWith('verify_fsub_')) {
      const id = data.replace('verify_fsub_', '');
      const movie = movies.find((m) => m.id === id);
      if (!hasJoinedChannel) {
        setHasJoinedChannel(true);
      }
      simulateBotReply(() => {
        if (movie) {
          addMessage({
            sender: 'bot',
            text: `✅ <b>Status Terverifikasi!</b> Terima kasih telah bergabung ke channel ${botConfig.channelUsername}. Link film dibuka:`
          });
          onWatchMovie(movie);
        }
      }, 300);
      return;
    }

    if (data.startsWith('trailer_')) {
      const id = data.replace('trailer_', '');
      const movie = movies.find((m) => m.id === id);
      if (movie) {
        onWatchMovie(movie);
        simulateBotReply(() => {
          addMessage({
            sender: 'bot',
            text: `🎞️ <b>Trailer Resmi: ${movie.title}</b> dibuka di pemutar video.`
          });
        }, 300);
      }
      return;
    }

    if (data.startsWith('dl_')) {
      const id = data.replace('dl_', '');
      const movie = movies.find((m) => m.id === id);
      if (movie) {
        simulateBotReply(() => {
          addMessage({
            sender: 'bot',
            text: `📥 <b>Link Download Film ${movie.title}</b>\n\n` +
              `• Resolusi: ${movie.quality}\n` +
              `• Audio: ${movie.language}\n` +
              `• File ID: <code>${movie.telegramFileId || 'BAACAgUAAxkTlgStreamDirect'}</code>\n\n` +
              `Klik tombol di bawah untuk mendownload langsung:`,
            replyMarkup: {
              inline_keyboard: [
                [{ text: '⬇️ Download via Server Cepat', callback_data: `watch_${movie.id}` }],
                [{ text: '🔙 Kembali', callback_data: `view_${movie.id}` }]
              ]
            }
          });
        });
      }
      return;
    }

    if (data.startsWith('fav_')) {
      const id = data.replace('fav_', '');
      setFavorites((prev) => 
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
      simulateBotReply(() => {
        const isNow = !favorites.includes(id);
        addMessage({
          sender: 'bot',
          text: isNow ? '❤️ Film berhasil disimpan ke daftar favorit kamu!' : '🤍 Film dihapus dari daftar favorit.'
        });
      }, 200);
      return;
    }

    if (data === 'vip_info') {
      simulateBotReply(() => {
        addMessage({
          sender: 'bot',
          text: `⭐ <b>PAKET MEMBER VIP CINETELE</b> ⭐\n\n` +
            `Nikmati fasilitas eksklusif:\n` +
            `✅ Rilis film bioskop hari pertama\n` +
            `✅ Resolusi 4K Ultra HD tanpa kompresi\n` +
            `✅ Unduhan tanpa batas kecepatan\n` +
            `✅ Akses channel film VIP privat\n\n` +
            `💰 <b>Tarif Berlangganan:</b>\n${botConfig.vipFeeInfo}\n\n` +
            `Untuk berlangganan silakan hubungi admin bot.`,
          replyMarkup: {
            inline_keyboard: [
              [{ text: '💬 Hubungi Admin VIP', callback_data: 'help_search' }],
              [{ text: '🔙 Menu Utama', callback_data: 'menu_start' }]
            ]
          }
        });
      });
      return;
    }

    if (data === 'req_guide') {
      simulateBotReply(() => {
        addMessage({
          sender: 'bot',
          text: '📝 <b>Format Request Film:</b>\n\nKetik di chat:\n<code>/request Judul Film (Tahun)</code>\n\nContoh:\n<code>/request Oppenheimer (2023)</code>\n\nTim admin akan mengecek dan mengunggah film yang paling banyak diminta!'
        });
      });
      return;
    }

    if (data.startsWith('req_custom_')) {
      const reqTitle = decodeURIComponent(data.replace('req_custom_', ''));
      onRequestFilm(reqTitle, '@penonton_telegram');
      simulateBotReply(() => {
        addMessage({
          sender: 'bot',
          text: `✅ Request film <b>"${reqTitle}"</b> berhasil dikirimkan ke admin!`
        });
      });
      return;
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'bot',
        text: `Halo Penonton! 👋\n\n${botConfig.welcomeMessage}`,
        timestamp: 'Baru saja',
        replyMarkup: {
          inline_keyboard: [
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
          ]
        }
      }
    ]);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[760px] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Left Sidebar: Telegram Chats list */}
      <div className="w-full lg:w-72 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Telegram Web</h3>
              <p className="text-[11px] text-slate-400">Simulator Bot Nonton</p>
            </div>
          </div>
          <button
            onClick={handleResetChat}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            title="Reset Chat"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Chat List Items */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* Active Bot Chat */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-600/15 border border-blue-500/20 cursor-pointer">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-blue-600 flex items-center justify-center text-white shadow-md">
                <Film className="w-5 h-5 text-white" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-200 truncate">{botConfig.botName}</h4>
                <span className="text-[10px] text-slate-400 font-mono">Sekarang</span>
              </div>
              <p className="text-[11px] text-blue-400 truncate font-mono">@{botConfig.botUsername}</p>
              <p className="text-[11px] text-slate-400 truncate">Bot Streaming Aktif</p>
            </div>
          </div>

          {/* Official Channel Item */}
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/60 transition-colors cursor-pointer text-slate-400">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-300 truncate">Channel Update HD</h4>
                <span className="text-[10px] text-slate-500">12:30</span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">{botConfig.channelUsername}</p>
            </div>
          </div>
        </div>

        {/* Quick Testing Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <p className="text-[11px] font-semibold text-slate-400 mb-2">⚡ Perintah Cepat (Klik untuk Tes):</p>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => handleSend('/start')}
              className="text-left px-2.5 py-1.5 rounded bg-slate-800 text-[11px] text-slate-300 hover:bg-slate-700 hover:text-white transition-colors truncate font-mono"
            >
              /start
            </button>
            <button
              onClick={() => handleSend('/film Cyberpunk')}
              className="text-left px-2.5 py-1.5 rounded bg-slate-800 text-[11px] text-slate-300 hover:bg-slate-700 hover:text-white transition-colors truncate font-mono"
            >
              /film Cyberpunk
            </button>
            <button
              onClick={() => handleSend('/trending')}
              className="text-left px-2.5 py-1.5 rounded bg-slate-800 text-[11px] text-slate-300 hover:bg-slate-700 hover:text-white transition-colors truncate font-mono"
            >
              🔥 /trending
            </button>
            <button
              onClick={() => handleSend('/posters')}
              className="text-left px-2.5 py-1.5 rounded bg-slate-800 text-[11px] text-slate-300 hover:bg-slate-700 hover:text-white transition-colors truncate font-mono"
            >
              🖼️ /posters
            </button>
            <button
              onClick={() => handleCallbackClick({ text: '', callback_data: 'genre_menu' })}
              className="text-left px-2.5 py-1.5 rounded bg-slate-800 text-[11px] text-slate-300 hover:bg-slate-700 hover:text-white transition-colors truncate font-mono"
            >
              📂 Genre
            </button>
            <button
              onClick={() => handleCallbackClick({ text: '', callback_data: 'vip_info' })}
              className="text-left px-2.5 py-1.5 rounded bg-slate-800 text-[11px] text-slate-300 hover:bg-slate-700 hover:text-white transition-colors truncate font-mono"
            >
              ⭐ Info VIP
            </button>
            <button
              onClick={() => handleSend('/request Interstellar (2014)')}
              className="text-left px-2.5 py-1.5 rounded bg-slate-800 text-[11px] text-slate-300 hover:bg-slate-700 hover:text-white transition-colors truncate font-mono"
            >
              /request Film
            </button>
          </div>
        </div>
      </div>

      {/* Main Telegram Chat Viewport */}
      <div className="flex-1 flex flex-col bg-[#0b141a] relative">
        {/* Telegram Chat Header */}
        <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-blue-600 flex items-center justify-center text-white shadow">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">{botConfig.botName}</h3>
                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-mono">bot</span>
              </div>
              <p className="text-xs text-slate-400">
                {isTyping ? 'sedang mengetik...' : 'online · melayani streaming film'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {botConfig.forceSubEnabled && (
              <span className={`text-[11px] px-2 py-0.5 rounded flex items-center gap-1 ${
                hasJoinedChannel ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {hasJoinedChannel ? 'FSub: Lolos' : 'FSub: Terkunci'}
              </span>
            )}
            <button
              onClick={handleResetChat}
              className="text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Bersihkan
            </button>
          </div>
        </div>

        {/* Message History */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="text-center my-2">
            <span className="inline-block bg-slate-900/80 text-[11px] text-slate-400 px-3 py-1 rounded-full border border-slate-800">
              Hari ini · Enkripsi Telegram Bot API
            </span>
          </div>

          {messages.map((m) => {
            const isBot = m.sender === 'bot';
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isBot ? 'items-start' : 'items-end'} max-w-full`}
              >
                <div
                  className={`relative max-w-[90%] sm:max-w-[80%] rounded-2xl p-3.5 sm:p-4 shadow-sm ${
                    isBot
                      ? 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-sm'
                      : 'bg-blue-600 text-white rounded-tr-sm'
                  }`}
                >
                  {/* Photo attachment if available */}
                  {m.photoUrl && (
                    <div className="mb-3 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[3/4] max-h-72 w-full">
                      <img
                        src={m.photoUrl}
                        alt="Poster Film"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {/* Message Text with HTML/formatting emulation */}
                  <div
                    className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words"
                    dangerouslySetInnerHTML={{
                      __html: m.text
                        .replace(/<b>/g, '<strong class="font-bold text-white">')
                        .replace(/<\/b>/g, '</strong>')
                        .replace(/<code>/g, '<code class="bg-black/40 text-amber-300 px-1 py-0.5 rounded font-mono text-[11px]">')
                        .replace(/<\/code>/g, '</code>')
                    }}
                  />

                  {/* Inline Keyboards */}
                  {m.replyMarkup && m.replyMarkup.inline_keyboard && (
                    <div className="mt-3.5 pt-2 border-t border-slate-800/80 space-y-1.5 w-full">
                      {m.replyMarkup.inline_keyboard.map((row, rIdx) => (
                        <div key={rIdx} className="flex flex-wrap gap-1.5 w-full">
                          {row.map((btn, bIdx) => (
                            <button
                              key={bIdx}
                              onClick={() => handleCallbackClick(btn)}
                              className="flex-1 min-w-[110px] text-center px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-xs font-semibold text-blue-300 hover:text-white border border-slate-700/60 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <span>{btn.text}</span>
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Timestamp & status indicator */}
                  <div className={`mt-1.5 flex items-center justify-end gap-1 text-[10px] ${isBot ? 'text-slate-500 font-mono' : 'text-blue-200 font-mono'}`}>
                    <span>{m.timestamp}</span>
                    {!isBot && <CheckCheck className="w-3.5 h-3.5 text-blue-200" />}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Animation */}
          {isTyping && (
            <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-slate-900 border border-slate-800 w-fit text-slate-400 text-xs animate-pulse">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1 text-[11px] font-mono">bot mengetik...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Telegram Input Bar */}
        <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Tulis pesan atau ketik /film [judul]..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!inputVal.trim()}
              className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white flex items-center justify-center transition-colors shadow-md shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
