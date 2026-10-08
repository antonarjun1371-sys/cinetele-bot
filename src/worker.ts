/**
 * Cloudflare Worker entrypoint for CineTele Bot Studio
 * Serves static assets from ./dist and handles edge requests.
 */

export interface Env {
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>;
  };
  NODE_ENV?: string;
}

export default {
  async fetch(request: Request, env: Env, _ctx?: unknown): Promise<Response> {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === '/api/health') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          service: 'cinetele-bot-studio',
          timestamp: new Date().toISOString()
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
          }
        }
      );
    }

    // Serve static assets from the ASSETS binding (e.g., ./dist directory)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('CineTele Bot Studio Worker Active', {
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};
