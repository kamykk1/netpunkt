import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    // Get all tournaments in registration or upcoming status
    const tournaments = await base44.asServiceRole.entities.Tournament.filter({
      status: 'registration'
    });

    let notificationsSent = 0;

    for (const tournament of tournaments) {
      if (!tournament.start_date) continue;
      const startDate = new Date(tournament.start_date);

      // Only remind about tournaments starting within the next hour
      if (startDate < now || startDate > oneHourLater) continue;

      // Get all participants of this tournament
      const participants = await base44.asServiceRole.entities.TournamentParticipant.filter({
        tournament_id: tournament.id
      });

      for (const participant of participants) {
        if (!participant.user_id) continue;

        // Check if we already sent a reminder for this tournament
        const existing = await base44.asServiceRole.entities.Notification.filter({
          user_id: participant.user_id,
          type: 'tournament_reminder',
          reference_id: tournament.id
        });

        if (existing.length > 0) continue;

        await base44.asServiceRole.entities.Notification.create({
          user_id: participant.user_id,
          user_email: participant.user_email,
          type: 'tournament_reminder',
          title: `🏆 Turniej „${tournament.name}" startuje wkrótce!`,
          message: `Turniej rozpoczyna się ${startDate.toLocaleString('pl-PL')}. Przygotuj się na rywalizację! Pula nagród: ${tournament.prize_pool} pkt.`,
          reference_id: tournament.id,
          reference_type: 'tournament',
          is_read: false,
          priority: 'high',
        });
        notificationsSent++;
      }
    }

    return Response.json({ success: true, notificationsSent, checkedTournaments: tournaments.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});