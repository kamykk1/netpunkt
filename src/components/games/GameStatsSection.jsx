import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trophy, Gamepad2 } from 'lucide-react';

const GAME_LABELS = {
  battleship: { name: 'Okręty', icon: '⚓' },
  tictactoe: { name: 'Kółko i Krzyżyk', icon: '⭕' },
  connect4: { name: 'Cztery w rzędzie', icon: '🔴' },
  quiz: { name: 'Quiz', icon: '🧠' },
  memory: { name: 'Memory', icon: '🃏' },
  minesweeper: { name: 'Saper', icon: '💣' },
  snake: { name: 'Snake', icon: '🐍' },
  scratch: { name: 'Zdrapka', icon: '🎰' },
  wheel: { name: 'Koło fortuny', icon: '🎡' },
};

export default function GameStatsSection({ userId }) {
  const { data: finishedRooms = [] } = useQuery({
    queryKey: ['statsGameRooms', userId],
    queryFn: () => base44.entities.GameRoom.filter({ status: 'finished' }, '-created_date', 100),
    enabled: !!userId,
  });

  const { data: gameScores = [] } = useQuery({
    queryKey: ['statsGameScores', userId],
    queryFn: () => base44.entities.GameScore.filter({ user_id: userId }, '-created_date', 100),
    enabled: !!userId,
  });

  const myRooms = finishedRooms.filter(r => r.player1_id === userId || r.player2_id === userId);

  // Per-game multiplayer stats
  const multiStats = {};
  myRooms.forEach(r => {
    const gt = r.game_type;
    if (!multiStats[gt]) multiStats[gt] = { played: 0, won: 0, draw: 0 };
    multiStats[gt].played++;
    if (r.winner_id === userId) multiStats[gt].won++;
    else if (!r.winner_id) multiStats[gt].draw++;
  });

  const multiChartData = Object.entries(multiStats).map(([key, s]) => ({
    name: GAME_LABELS[key]?.icon + ' ' + (GAME_LABELS[key]?.name || key),
    Wygrane: s.won,
    Remisy: s.draw,
    Przegrane: s.played - s.won - s.draw,
  }));

  // Per-game solo stats (best score)
  const soloStats = {};
  gameScores.forEach(gs => {
    const key = gs.game_type;
    if (!soloStats[key]) soloStats[key] = { count: 0, best: 0, total: 0 };
    soloStats[key].count++;
    soloStats[key].total += gs.score || 0;
    if (gs.score > soloStats[key].best) soloStats[key].best = gs.score;
  });

  const totalMulti = myRooms.length;
  const totalWon = myRooms.filter(r => r.winner_id === userId).length;

  return (
    <div className="space-y-4">
      {/* Overall */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Gry multi', value: totalMulti, icon: '🎮' },
          { label: 'Wygrane', value: totalWon, icon: '🏆' },
          { label: 'Win Rate', value: totalMulti ? `${Math.round(totalWon / totalMulti * 100)}%` : '—', icon: '📊' },
        ].map((s, i) => (
          <Card key={i} className="bg-[#1a1a2e]/50 border-purple-500/20 text-center">
            <CardContent className="p-3">
              <p className="text-2xl mb-1">{s.icon}</p>
              <p className="text-white font-bold text-lg">{s.value}</p>
              <p className="text-slate-400 text-xs">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Multiplayer per-game */}
      {multiChartData.length > 0 && (
        <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-purple-400" /> Statystyki multiplayer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(multiStats).map(([key, s]) => {
                const label = GAME_LABELS[key];
                const wr = s.played ? Math.round(s.won / s.played * 100) : 0;
                return (
                  <div key={key} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{label?.icon}</span>
                        <span className="text-white text-sm font-medium">{label?.name || key}</span>
                      </div>
                      <Badge className={wr >= 50 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-600 text-slate-300'}>
                        {wr}% WR
                      </Badge>
                    </div>
                    <div className="flex gap-3 text-xs">
                      <span className="text-slate-400">Rozegrane: <span className="text-white">{s.played}</span></span>
                      <span className="text-emerald-400">Wygrane: {s.won}</span>
                      {s.draw > 0 && <span className="text-yellow-400">Remisy: {s.draw}</span>}
                      <span className="text-red-400">Przegrane: {s.played - s.won - s.draw}</span>
                    </div>
                    <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full" style={{ width: `${wr}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Solo per-game */}
      {Object.keys(soloStats).length > 0 && (
        <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" /> Statystyki gier solo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(soloStats).map(([key, s]) => {
                const label = GAME_LABELS[key];
                return (
                  <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{label?.icon}</span>
                      <div>
                        <p className="text-white text-sm font-medium">{label?.name || key}</p>
                        <p className="text-slate-500 text-xs">{s.count} rozegranych</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-yellow-400 font-bold text-sm">{s.best} pkt</p>
                      <p className="text-slate-500 text-xs">najlepszy wynik</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {totalMulti === 0 && Object.keys(soloStats).length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <Gamepad2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>Brak danych statystycznych. Zagraj kilka gier!</p>
        </div>
      )}
    </div>
  );
}