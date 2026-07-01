import { base44 } from '@/api/base44Client';

/**
 * Śledzi zdarzenia gier do Google Analytics (przez base44.analytics)
 * oraz lokalnie do encji GameScore dla statystyk admina.
 */
export async function trackGameEvent(eventName, properties = {}) {
  try {
    base44.analytics.track({ eventName, properties });
  } catch {}
}

/**
 * Zapisuje statystyki rozgrywki multiplayer do encji GameScore.
 * Używane przez panel admina do analizy popularności gier.
 */
export async function recordGameSession({ gameType, gameMode, roomId, durationSeconds, isPrivate, result, userId, userEmail, userName }) {
  try {
    await base44.entities.GameScore.create({
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
      game_type: gameType,
      score: durationSeconds,
      extra: JSON.stringify({ mode: gameMode, room_id: roomId, is_private: isPrivate, result, duration_seconds: durationSeconds, timestamp: new Date().toISOString() }),
    });
  } catch {}
}