export interface Movie {
  id: string;
  title: string;
  genre: string[];
  year: number;
  rating: number;
  duration: string;
  quality: '1080p FHD' | '720p HD' | '4K UHD';
  language: string;
  synopsis: string;
  posterUrl: string;
  trailerUrl?: string;
  streamUrl: string;
  telegramFileId?: string;
  downloadUrl?: string;
  isTrending?: boolean;
  isVip?: boolean;
  views?: number;
  addedAt?: string;
}

export interface BotConfig {
  botToken: string;
  botUsername: string;
  botName: string;
  isConnected: boolean;
  pollingActive: boolean;
  webhookUrl: string;
  welcomeMessage: string;
  forceSubEnabled: boolean;
  channelUsername: string;
  channelInviteLink: string;
  vipEnabled: boolean;
  vipFeeInfo: string;
  allowRequestFilm: boolean;
}

export interface InlineButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export interface TelegramMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  photoUrl?: string;
  replyMarkup?: {
    inline_keyboard: InlineButton[][];
  };
  timestamp: string;
  metadata?: {
    movieId?: string;
    action?: string;
    category?: string;
    type?: string;
  };
}

export interface FilmRequest {
  id: string;
  user: string;
  title: string;
  status: 'pending' | 'approved' | 'available';
  createdAt: string;
}

export type AdPlacement = 'movie_footer' | 'start_menu' | 'preroll_stream' | 'inline_button';

export interface TelegramAd {
  id: string;
  title: string;
  sponsorName: string;
  text: string;
  buttonText: string;
  targetUrl: string;
  imageUrl?: string;
  placement: AdPlacement;
  isActive: boolean;
  impressions: number;
  clicks: number;
  createdAt?: string;
}
