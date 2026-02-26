import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Crown, Medal, Trophy } from 'lucide-react';

const GAME_TYPES = [
  { key: 'battleship', label: '⚓ Okręty' },
  { key: 'tictactoe', label: '⭕ Kółko i Krzyżyk' },
  { key: 'connect4', label: '🔴 Cztery w rzędzie' },
];

function RankBadge({ rank }) {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-slate-300" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
  return <span className="text-slate-400 font-bold text-sm w-5 text-center">{rank}</span>;
}

function LeaderboardForGame({ gameType, currentUserId }) {
  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['leaderboardRooms', gameType],
    queryFn: () => base44.entities.GameRoom.filter({ game_type: gameType, status: 'finished' }, '-created_date', 200),
  });

  // Aggregate stats per player
  const statsMap = {};
  rooms.forEach(r => {
    [{ id: r.player1_id, name: r.player1_name || r.player1_email }, { id: r.player2_id, name: r.player2_name || r.player2_email }].forEach(p => {
      if (!p.id) return;
      if (!statsMap[p.id]) statsMap[p.id] = { id: p.id, name: p.name, played: 0, won: 0, draw: 0 };
      statsMap[p.id].played++;
      if (r.winner_id === p.id) statsMap[p.id].won++;
      else if (!r.winner_id) statsMap[p.id].draw++;
    });
  });

  const sorted = Object.values(statsMap)
    .sort((a, b) => b.won - a.won || (b.won / b.played) - (a.won / a.played))
    .slice(0, 15);

  if (isLoading) return <div className="py-8 text-center text-slate-400">Ładowanie...</div>;
  if (!sorted.length) return <div className="py-8 text-center text-slate-400">Brak rozegranych gier</div>;

  return (
    <div className="space-y-2">
      {sorted.map((p, i) => {
        const wr = p.played ? Math.round(p.won / p.played * 100) : 0;
        const isMe = p.id === currentUserId;
        return (
          <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
            i === 0 ? 'bg-yellow-500/10 border-yellow-500/30' :
            i === 1 ? 'bg-slate-400/10 border-slate-400/30' :
            i === 2 ? 'bg-amber-700/10 border-amber-700/30' :
            isMe ? 'bg-purple-500/10 border-purple-500/30' :
            'bg-slate-800/30 border-slate-700/30'
          }`}>
            <div className="w-6 flex justify-center"><RankBadge rank={i + 1} /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-white font-medium text-sm truncate">{p.name || 'Gracz'}</p>
                {isMe && <Badge className="bg-purple-500/30 text-purple-300 text-xs py-0">Ty</Badge>}
              </div>
              <p className="text-slate-400 text-xs">{p.played} partii · WR {wr}%</p>
            </div>
            <div className="text-right">
              <p className="text-emerald-400 font-bold text-sm">{p.won}W</p>
              <p className="text-slate-500 text-xs">{p.draw}R · {p.played - p.won - p.draw}P</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function MultiplayerLeaderboard({ currentUserId }) {
  return (
    <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-400" /> Tablica wyników multiplayer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="battleship">
          <TabsList className="bg-slate-800/60 mb-4 w-full">
            {GAME_TYPES.map(g => (
              <TabsTrigger key={g.key} value={g.key} className="flex-1 text-xs data-[state=active]:bg-purple-600">{g.label}</TabsTrigger>
            ))}
          </TabsList>
          {GAME_TYPES.map(g => (
            <TabsContent key={g.key} value={g.key}>
              <LeaderboardForGame gameType={g.key} currentUserId={currentUserId} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}