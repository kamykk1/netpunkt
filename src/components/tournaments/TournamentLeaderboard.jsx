import React, { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy, Crown, Medal, Coins, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const RANK_STYLES = [
  { icon: Crown, color: 'text-yellow-400', bg: 'from-yellow-500/20 to-amber-600/20', border: 'border-yellow-500/30' },
  { icon: Medal, color: 'text-slate-300', bg: 'from-slate-400/20 to-slate-500/20', border: 'border-slate-400/30' },
  { icon: Medal, color: 'text-amber-600', bg: 'from-amber-700/20 to-amber-800/20', border: 'border-amber-700/30' },
];

export default function TournamentLeaderboard({ limit = 5 }) {
  const [liveUpdate, setLiveUpdate] = useState(0);

  const { data: participants = [], isLoading } = useQuery({
    queryKey: ['tournamentLeaderboard', liveUpdate],
    queryFn: () => base44.entities.TournamentParticipant.filter({}, '-prize_awarded', 200),
  });

  // Real-time subscription — auto-refresh leaderboard when any participant record changes
  useEffect(() => {
    const unsub = base44.entities.TournamentParticipant.subscribe((event) => {
      setLiveUpdate(n => n + 1);
    });
    return unsub;
  }, []);

  // Aggregate: group by user_id, sum prize_awarded, count tournaments, track wins
  const leaderboard = useMemo(() => {
    const map = {};
    participants.forEach(p => {
      if (!p.user_id) return;
      if (!map[p.user_id]) {
        map[p.user_id] = {
          user_id: p.user_id,
          user_name: p.user_name || p.user_email || 'Gracz',
          total_prize: 0,
          tournaments: 0,
          wins: 0,
        };
      }
      map[p.user_id].total_prize += p.prize_awarded || 0;
      map[p.user_id].tournaments += 1;
      if (p.final_position === 1) map[p.user_id].wins += 1;
    });
    return Object.values(map)
      .sort((a, b) => b.total_prize - a.total_prize || b.wins - a.wins)
      .slice(0, limit);
  }, [participants, limit]);

  return (
    <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          Ranking turniejowy
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          </div>
        ) : leaderboard.length > 0 ? (
          <div className="space-y-2">
            {leaderboard.map((player, idx) => {
              const style = RANK_STYLES[idx] || null;
              const RankIcon = style?.icon || Trophy;
              return (
                <motion.div
                  key={player.user_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border ${style?.border || 'border-slate-700/50'}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${style?.bg || 'bg-slate-700/50'} ${style?.color || 'text-slate-400'}`}>
                    {idx < 3 ? <RankIcon className="w-4 h-4" /> : idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{player.user_name}</p>
                    <p className="text-slate-400 text-xs">
                      {player.tournaments} turniejów · {player.wins} wygranych
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-400 shrink-0">
                    <Coins className="w-4 h-4" />
                    <span className="font-bold text-sm">{player.total_prize.toLocaleString()}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400">
            <Trophy className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Brak wyników turniejowych</p>
            <p className="text-xs mt-1">Zapisz się na pierwszy turniej!</p>
          </div>
        )}
        <Link to={createPageUrl('Tournaments')} className="block mt-3">
          <button className="w-full text-center text-sm text-purple-400 hover:text-purple-300 transition-colors">
            Zobacz turnieje →
          </button>
        </Link>
      </CardContent>
    </Card>
  );
}