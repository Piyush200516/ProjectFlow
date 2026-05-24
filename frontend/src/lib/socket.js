import { io } from 'socket.io-client';
import { queryClient } from './queryClient';
import { queryKeys } from './queryKeys';

let socket;

const getSocketURL = () => {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  return (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
};

export const getSocket = () => {
  if (socket) return socket;

  socket = io(getSocketURL(), {
    autoConnect: false,
    transports: ['websocket', 'polling'],
    auth: {
      token: localStorage.getItem('token'),
    },
  });

  socket.on('notification:new', () => {
    queryClient.invalidateQueries({ queryKey: ['studentNotifications'] });
  });
  socket.on('hod:form-published', () => {
    queryClient.invalidateQueries({ queryKey: ['registrationForms'] });
  });
  socket.on('timeline:updated', () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.timelines });
    queryClient.invalidateQueries({ queryKey: queryKeys.milestones });
  });
  socket.on('mentor:feedback', () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.projects });
  });
  socket.on('submission:status', () => {
    queryClient.invalidateQueries({ queryKey: ['hodSubmissions'] });
    queryClient.invalidateQueries({ queryKey: queryKeys.projects });
  });

  return socket;
};

export const connectSocket = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  const activeSocket = getSocket();
  activeSocket.auth = { token };
  if (!activeSocket.connected) activeSocket.connect();
  return activeSocket;
};

export const disconnectSocket = () => {
  if (socket?.connected) socket.disconnect();
};
