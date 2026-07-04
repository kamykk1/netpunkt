import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const NOTIFICATION_TYPES = {
  tournament_reminder: {
    icon: '🏆',
    title: 'Turniej',
  },
  tournament_result: {
    icon: '🎯',
    title: 'Wynik turnieju',
  },
  game_invite: {
    icon: '🎮',
    title: 'Zaproszenie do gry',
  },
  message_received: {
    icon: '💬',
    title: 'Nowa wiadomość',
  },
};

/**
 * Hook that requests browser notification permission and shows
 * real-time desktop notifications for new in-app notifications.
 * Subscribes to the Notification entity for the current user.
 */
export function useBrowserNotifications() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const seenIdsRef = useRef(new Set());

  // Request permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Subscribe to real-time notification creates
  useEffect(() => {
    if (!user?.id) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const unsub = base44.entities.Notification.subscribe((event) => {
      if (event.type !== 'create') return;
      const notif = event.data;
      if (!notif || notif.user_id !== user.id) return;
      if (seenIdsRef.current.has(notif.id)) return;
      seenIdsRef.current.add(notif.id);

      const cfg = NOTIFICATION_TYPES[notif.type] || { icon: '🔔', title: 'Powiadomienie' };

      try {
        const browserNotif = new Notification(`${cfg.icon} ${notif.title || cfg.title}`, {
          body: notif.message || '',
          tag: notif.id,
          icon: '/favicon.ico',
        });
        browserNotif.onclick = () => {
          window.focus();
          browserNotif.close();
        };
        // Auto-close after 8 seconds
        setTimeout(() => browserNotif.close(), 8000);
      } catch (e) {
        // Fallback — ignore if Notification API fails
      }
    });

    return unsub;
  }, [user?.id]);
}