import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo | undefined;
  }
}

window.Pusher = Pusher;

let echoInstance: Echo | null = null;

/**
 * Get or create the Laravel Echo instance for real-time communication
 */
export function getEcho(): Echo {
  if (echoInstance) {
    return echoInstance;
  }

  const token = localStorage.getItem('auth_token');
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  
  // Extract the base URL without /api/v1
  const baseUrl = apiUrl.replace(/\/api\/v1\/?$/, '');

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY || 'your-app-key',
    wsHost: import.meta.env.VITE_REVERB_HOST || 'localhost',
    wsPort: import.meta.env.VITE_REVERB_PORT ? parseInt(import.meta.env.VITE_REVERB_PORT) : 8080,
    wssPort: import.meta.env.VITE_REVERB_PORT ? parseInt(import.meta.env.VITE_REVERB_PORT) : 8080,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME || 'http') === 'https',
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
    authEndpoint: `${baseUrl}/broadcasting/auth`,
  });

  window.Echo = echoInstance;

  return echoInstance;
}

/**
 * Disconnect the Echo instance
 */
export function disconnectEcho(): void {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
    window.Echo = undefined;
  }
}

/**
 * Reconnect Echo (useful after token refresh)
 */
export function reconnectEcho(): Echo {
  disconnectEcho();
  return getEcho();
}
