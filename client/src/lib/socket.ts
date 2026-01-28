import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

const SOCKET_URL =  'http://localhost:4003';

let socket: Socket | null = null;

export const connectSocket = () => {
  const token = useAuthStore.getState().token;
  
  if (!token) {
    console.error('No token available for socket connection');
    return null;
  }

  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('Connected to Socket.io');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from Socket.io');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export default {
  connectSocket,
  disconnectSocket,
  getSocket,
};