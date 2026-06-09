import { io, Socket } from 'socket.io-client';
import { getToken } from './auth';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(WS_URL, {
      auth: { token: `Bearer ${getToken()}` },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      reconnectionAttempts: Infinity,
      autoConnect: false,
    });
  }
  return socket;
}

export function connectSocket(): void {
  const token = getToken();
  if (!token) {
    // Don't connect without a valid token — avoids the "closed before established" warning
    return;
  }
  const s = getSocket();
  if (!s.connected) {
    s.auth = { token: `Bearer ${token}` };
    s.connect();
  }
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
