import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { tournament_id, winner_id, runner_up_id } = body;

    if (!tournament_id || !winner_id) {
      return Response.json({ error: 'tournament_id and winner_id are required' }, { status: 400 });
    }

    const tournament = await base44.asServiceRole.entities.Tournament.get(tournament_id);
    if (!tournament) return Response.json({ error: 'Tournament not found' }, { status: 404 });

    // Get winner and runner-up participant records
    const participants = await base44.asServiceRole.entities.TournamentParticipant.filter({ tournament_id });

    const winner = participants.find(p => p.user_id === winner_id);
    const runnerUp = runner_up_id ? participants.find(p => p.user_id === runner_up_id) : null;

    // Prize distribution: 70% winner, 30% runner-up (if exists), else 100% winner
    const totalPool = tournament.prize_pool || 0;
    let winnerPrize = totalPool;
    let runnerUpPrize = 0;

    if (runnerUp) {
      winnerPrize = Math.floor(totalPool * 0.7);
      runnerUpPrize = totalPool - winnerPrize;
    }

    // Award winner
    if (winner) {
      const winnerUser = (await base44.asServiceRole.entities.User.filter({ id: winner_id }))[0];
      if (winnerUser) {
        const newBalance = (winnerUser.points_balance || 0) + winnerPrize;
        await base44.asServiceRole.entities.User.update(winner_id, {
          points_balance: newBalance,
          total_points_earned: (winnerUser.total_points_earned || 0) + winnerPrize
        });

        await base44.asServiceRole.entities.PointsHistory.create({
          user_id: winner_id,
          user_email: winnerUser.email,
          amount: winnerPrize,
          balance_after: newBalance,
          type: 'tournament_prize',
          description: `Wygrana w turnieju: ${tournament.name}`,
          reference_id: tournament_id
        });

        await base44.asServiceRole.entities.Notification.create({
          user_id: winner_id,
          user_email: winnerUser.email,
          type: 'tournament_result',
          title: '🏆 Wygrałeś turniej!',
          message: `Gratulacje! Wygrałeś turniej "${tournament.name}" i otrzymujesz ${winnerPrize} punktów nagrody!`,
          reference_id: tournament_id,
          reference_type: 'tournament',
          is_read: false,
          priority: 'high'
        });

        await base44.asServiceRole.entities.TournamentParticipant.update(winner.id, {
          eliminated: false,
          final_position: 1,
          prize_awarded: winnerPrize
        });
      }
    }

    // Award runner-up
    if (runnerUp && runnerUpPrize > 0) {
      const ruUser = (await base44.asServiceRole.entities.User.filter({ id: runner_up_id }))[0];
      if (ruUser) {
        const newBalance = (ruUser.points_balance || 0) + runnerUpPrize;
        await base44.asServiceRole.entities.User.update(runner_up_id, {
          points_balance: newBalance,
          total_points_earned: (ruUser.total_points_earned || 0) + runnerUpPrize
        });

        await base44.asServiceRole.entities.PointsHistory.create({
          user_id: runner_up_id,
          user_email: ruUser.email,
          amount: runnerUpPrize,
          balance_after: newBalance,
          type: 'tournament_prize',
          description: `II miejsce w turnieju: ${tournament.name}`,
          reference_id: tournament_id
        });

        await base44.asServiceRole.entities.Notification.create({
          user_id: runner_up_id,
          user_email: ruUser.email,
          type: 'tournament_result',
          title: '🥈 II miejsce w turnieju!',
          message: `Gratulacje! Zająłeś II miejsce w turnieju "${tournament.name}" i otrzymujesz ${runnerUpPrize} punktów!`,
          reference_id: tournament_id,
          reference_type: 'tournament',
          is_read: false,
          priority: 'medium'
        });

        await base44.asServiceRole.entities.TournamentParticipant.update(runnerUp.id, {
          eliminated: false,
          final_position: 2,
          prize_awarded: runnerUpPrize
        });
      }
    }

    // Update tournament status
    const winnerUser = winner ? (await base44.asServiceRole.entities.User.filter({ id: winner_id }))[0] : null;
    const ruUser = runnerUp ? (await base44.asServiceRole.entities.User.filter({ id: runner_up_id }))[0] : null;

    await base44.asServiceRole.entities.Tournament.update(tournament_id, {
      status: 'finished',
      winner_id: winner_id,
      winner_name: winnerUser?.full_name || winnerUser?.email || winner?.user_name,
      runner_up_id: runner_up_id || null,
      runner_up_name: ruUser?.full_name || ruUser?.email || runnerUp?.user_name || null
    });

    // Try sending Slack notification (optional — only if connector is connected)
    try {
      const slackConn = await base44.asServiceRole.connectors.getConnection('slack');
      if (slackConn?.accessToken && tournament.slack_channel) {
        await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${slackConn.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            channel: tournament.slack_channel,
            text: `🏆 Turniej "${tournament.name}" zakończony!\nZwycięzca: ${winnerUser?.full_name || winner?.user_name} (${winnerPrize} pkt)\n${runnerUp ? `II miejsce: ${ruUser?.full_name || runnerUp.user_name} (${runnerUpPrize} pkt)` : ''}`
          })
        });
      }
    } catch (slackErr) {
      // Slack not connected — skip silently
    }

    return Response.json({
      success: true,
      winner_prize: winnerPrize,
      runner_up_prize: runnerUpPrize,
      winner_name: winnerUser?.full_name || winner?.user_name
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});