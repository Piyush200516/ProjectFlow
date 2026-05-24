import { useEffect } from 'react';
import { connectSocket, disconnectSocket } from '../lib/socket';

export const useRealtime = (enabled = true) => {
  useEffect(() => {
    if (!enabled) return undefined;
    const socket = connectSocket();
    return () => {
      if (socket) disconnectSocket();
    };
  }, [enabled]);
};
