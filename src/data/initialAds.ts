import { TelegramAd } from '../types';

export const INITIAL_ADS: TelegramAd[] = [
  {
    id: 'ad-1',
    title: 'FastVPN Turbo - Nonton 4K Tanpa Buffering',
    sponsorName: 'FastVPN Asia',
    text: '🚀 Rasakan sensasi streaming film 4K lancar tanpa lemot! Dapatkan diskon 70% langganan khusus pengguna CineTele Bot.',
    buttonText: '⚡ Dapatkan FastVPN Diskon 70%',
    targetUrl: 'https://t.me/telegram',
    placement: 'preroll_stream',
    isActive: true,
    impressions: 1420,
    clicks: 312,
    createdAt: '2026-03-25'
  },
  {
    id: 'ad-2',
    title: 'Top-Up Voucher Game Murah & Instan',
    sponsorName: 'VoucherKilat ID',
    text: '🎮 Top-up Diamond MLBB, FF, PUBG Mobile kilat masuk 1 detik! Termurah & terpercaya legal 100%.',
    buttonText: '💎 Beli Voucher Termurah',
    targetUrl: 'https://t.me/telegram',
    placement: 'movie_footer',
    isActive: true,
    impressions: 3890,
    clicks: 580,
    createdAt: '2026-03-20'
  },
  {
    id: 'ad-3',
    title: 'Katalog Promo Diskon Belanja hingga 90%',
    sponsorName: 'RacunShopee & Tokopedia',
    text: '🛍️ Update voucher gratis ongkir dan diskon barang elektronik & fashion tersembunyi setiap hari!',
    buttonText: '🎁 Join Channel Diskon 90%',
    targetUrl: 'https://t.me/telegram',
    placement: 'start_menu',
    isActive: true,
    impressions: 2150,
    clicks: 440,
    createdAt: '2026-04-01'
  },
  {
    id: 'ad-4',
    title: 'Hadiah Saldo E-Wallet Penonton Setia',
    sponsorName: 'DanaKaget Community',
    text: '💰 Klaim saldo DANA / GoPay gratis untuk 100 penonton pertama hari ini!',
    buttonText: '🧧 Klaim Saldo DANA Gratis',
    targetUrl: 'https://t.me/telegram',
    placement: 'inline_button',
    isActive: false,
    impressions: 890,
    clicks: 175,
    createdAt: '2026-04-03'
  }
];
