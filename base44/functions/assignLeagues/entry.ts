import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const LEAGUES = [
  { key: 'bronze',   minElo: 0,    maxElo: 1199, reward: 0,    name: 'Brązowa',   icon: '🥉' },
  { key: 'silver',   minElo: 1200, maxElo: 1399, reward: 100,  name: 'Srebrna',   icon: '🥈' },
  { key: 'gold',     minElo: 1400, maxElo: 1599, reward: 250,  name: 'Złota',     icon: '🥇' },
  { key: 'platinum', minElo: 1600, maxElo: 1799, reward: 500,  name: 'Platynowa', icon: '💠' },
  { key: 'diamond',  minElo: 1800, maxElo: 99999, reward: 1000, name: 'Diamentowa', icon: '💎' },
];

function getLeagueForElo(elo) {
  return LEAGUES.find(l => elo >= l.minElo && elo <= l.maxElo) || LEAGUES[0];
}

function getLeagueIndex(key) {
  return LEAGUES.findIndex(l => l.key === key);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    let processed = 0;
    let promoted = 0;
    let hasMore = true;

    while (hasMore) {
      const users = await base44.asServiceRole.entities.User.list('-created_date', 100);
      hasMore = users.length === 100;

      for (const u of users) {
        const elo = u.elo_rating || 1000;
        const targetLeague = getLeagueForElo(elo);
        const currentLeague = u.current_league || 'bronze';
        const lastLeague = u.last_league || 'bronze';

        const targetIdx = getLeagueIndex(targetLeague.key);
        const currentIdx = getLeagueIndex(currentLeague);

        if (targetLeague.key !== currentLeague) {
          // League changed — promotion or demotion
          const isPromotion = targetIdx > currentIdx;

          const update = {
            current_league: targetLeague.key,
            last_league: currentLeague,
            season_peak_elo: Math.max(u.season_peak_elo || elo, elo),
          };

          await base44.asServiceRole.entities.User.update(u.id, update);

          if (isPromotion && targetLeague.reward > 0) {
            const newBalance = (u.points_balance || 0) + targetLeague.reward;
            await base44.asServiceRole.entities.User.update(u.id, { points_balance: newBalance });

            await base44.asServiceRole.entities.PointsHistory.create({
              user_id: u.id,
              user_email: u.email,
              amount: targetLeague.reward,
              balance_after: newBalance,
              type: 'event_bonus',
              description: `Nagroda za awans do ligi ${targetLeague.name}`,
            });

            await base44.asServiceRole.entities.Notification.create({
              user_id: u.id,
              user_email: u.email,
              type: 'status_update',
              title: `${targetLeague.icon} Awans do ligi ${targetLeague.name}!`,
              message: `Gratulacje! Awansowałeś do ligi ${targetLeague.name} na podstawie ELO ${elo}. Otrzymujesz ${targetLeague.reward} pkt nagrody!`,
              reference_type: 'other',
              is_read: false,
              priority: 'high',
            });

            promoted++;
          } else if (!isPromotion) {
            await base44.asServiceRole.entities.Notification.create({
              user_id: u.id,
              user_email: u.email,
              type: 'status_update',
              title: `Spadek do ligi ${targetLeague.name}`,
              message: `Twój ranking ELO (${elo}) spadł do ligi ${targetLeague.name}. Walcz o powrót!`,
              reference_type: 'other',
              is_read: false,
              priority: 'medium',
            });
          }
        } else {
          // Same league — just update peak ELO if needed
          if (elo > (u.season_peak_elo || elo)) {
            await base44.asServiceRole.entities.User.update(u.id, { season_peak_elo: elo });
          }
        }

        processed++;
      }
    }

    return Response.json({
      success: true,
      processed,
      promoted,
      league_config: LEAGUES.map(l => ({ key: l.key, name: l.name, min_elo: l.minElo, max_elo: l.maxElo, reward: l.reward })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});