import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Crown, Medal, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const GAME_LABELS = {
  quiz: '🧠 Quiz',
  memory: '🃏 Memory',
  minesweeper: '💣 Saper',
  snake: '🐍 Snake',
  scratch: '🎰 Zdrapka',
  wheel: '🎡 Koło',
  battleship: '🚢 Okręty',
  tictactoe: '⭕ Kółko',
  connect4: '🔴 Cztery',
};

const SCORE_LABELS = {
  quiz: (s) => `${s.score} pkt`,
  memory: (s) => { try { const e = JSON.parse(s.extra||'{}'); return `${s.score} par, ${e.moves||'?'} ruchów`; } catch { return `${s.score}`; } },
  minesweeper: (s) => { try { const e = JSON.parse(s.extra||'{}'); return `✓ ${e.time||'?'}s`; } catch { return `${s.score}`; } },
  snake: (s) => `${s.score} pkt`,
  scratch: (s) => `${s.score} pkt`,
  wheel: (s) => `${s.score} pkt`,
  battleship: (s) => `${s.score} wygranych`,
  tictactoe: (s) => `${s.score} wygranych`,
  connect4: (s) => `${s.score} wygranych`,
};

function RankBadge({ rank }) {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-slate-300" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
  return <span className="text-slate-400 font-bold w-5 text-center text-sm">{rank}</span>;
}

function RankingList({ scores }) {
  if (!scores.length) return <p className="text-center text-slate-500 py-8">Brak wyników</p>;
  return (
    <div className="space-y-2">
      {scores.map((s, i) => (
        <div key={s.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
          i === 0 ? 'bg-yellow-500/10 border-yellow-500/30' :
          i === 1 ? 'bg-slate-400/10 border-slate-400/30' :
          i === 2 ? 'bg-amber-700/10 border-amber-700/30' :
          'bg-slate-800/30 border-slate-700/30'
        }`}>
          <div className="w-6 flex justify-center"><RankBadge rank={i + 1} /></div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">{s.user_name || s.user_email?.split('@')[0]}</p>
            <p className="text-slate-400 text-xs">{new Date(s.created_date).toLocaleDateString('pl-PL')}</p>
          </div>
          <div className="text-right">
            <p className="text-purple-400 font-bold text-sm">{(SCORE_LABELS[s.game_type] || ((x)=>`${x.score}`))(s)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function GlobalRankingList({ users }) {
  if (!users.length) return <p className="text-center text-slate-500 py-8">Brak danych</p>;
  return (
    <div className="space-y-2">
      {users.map((u, i) => (
        <div key={u.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
          i === 0 ? 'bg-yellow-500/10 border-yellow-500/30' :
          i === 1 ? 'bg-slate-400/10 border-slate-400/30' :
          i === 2 ? 'bg-amber-700/10 border-amber-700/30' :
          'bg-slate-800/30 border-slate-700/30'
        }`}>
          <div className="w-6 flex justify-center"><RankBadge rank={i + 1} /></div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">{u.full_name || u.email?.split('@')[0]}</p>
            <p className="text-slate-400 text-xs">Win rate: {u.games_played ? Math.round((u.games_won || 0) / u.games_played * 100) : 0}%</p>
          </div>
          <div className="text-right">
            <p className="text-purple-400 font-bold text-sm">{(u.games_won || 0)} W</p>
            <p className="text-slate-500 text-xs">{u.games_played || 0} partii</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function EloRankingList({ users }) {
  if (!users.length) return <p className="text-center text-slate-500 py-8">Brak graczy rankingowych</p>;
  return (
    <div className="space-y-2">
      {users.map((u, i) => (
        <div key={u.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
          i === 0 ? 'bg-yellow-500/10 border-yellow-500/30' :
          i === 1 ? 'bg-slate-400/10 border-slate-400/30' :
          i === 2 ? 'bg-amber-700/10 border-amber-700/30' :
          'bg-slate-800/30 border-slate-700/30'
        }`}>
          <div className="w-6 flex justify-center"><RankBadge rank={i + 1} /></div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">{u.full_name || u.email?.split('@')[0]}</p>
            <p className="text-slate-400 text-xs">{u.games_played || 0} partii rankingowych</p>
          </div>
          <div className="text-right">
            <p className="text-cyan-400 font-bold text-sm">{u.elo_rating || 1000}</p>
            <p className="text-slate-500 text-xs">ELO</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function GameRankings() {
  const [activeGame, setActiveGame] = useState('all');

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['gameRankingUsers'],
    queryFn: () => base44.entities.User.list('-games_won', 20)
  });

  const { data: eloUsers = [], isLoading: eloLoading } = useQuery({
    queryKey: ['gameEloRanking'],
    queryFn: () => base44.entities.User.list('-elo_rating', 20),
    enabled: activeGame === 'elo',
  });

  const { data: scores = [], isLoading: scoresLoading } = useQuery({
    queryKey: ['gameScores', activeGame],
    queryFn: () => activeGame === 'all'
      ? base44.entities.GameScore.list('-score', 50)
      : base44.entities.GameScore.filter({ game_type: activeGame }, '-score', 20),
    enabled: activeGame !== 'global' && activeGame !== 'elo'
  });

  const isLoading = usersLoading || scoresLoading || eloLoading;
  const ranked = users.filter(u => (u.games_played || 0) > 0);
  const eloRanked = eloUsers.filter(u => u.elo_rating);

  return (
    <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" /> Rankingi graczy
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>
        ) : (
          <Tabs value={activeGame} onValueChange={setActiveGame}>
            <div className="overflow-x-auto pb-2">
              <TabsList className="bg-slate-800/60 mb-4 w-max min-w-full">
                <TabsTrigger value="all" className="text-xs">🏆 Ogólny</TabsTrigger>
                <TabsTrigger value="global" className="text-xs">👥 Gracze</TabsTrigger>
                <TabsTrigger value="elo" className="text-xs">⚡ ELO</TabsTrigger>
                {Object.entries(GAME_LABELS).map(([k, l]) => (
                  <TabsTrigger key={k} value={k} className="text-xs">{l}</TabsTrigger>
                ))}
              </TabsList>
            </div>
            <TabsContent value="all">
              <p className="text-slate-500 text-xs text-center mb-3">Top wyniki ze wszystkich gier</p>
              <RankingList scores={scores.slice(0, 15)} />
            </TabsContent>
            <TabsContent value="global">
              <p className="text-slate-500 text-xs text-center mb-3">Ranking po liczbie wygranych partii</p>
              <GlobalRankingList users={ranked.slice(0, 15)} />
            </TabsContent>
            <TabsContent value="elo">
              <p className="text-slate-500 text-xs text-center mb-3">Ranking graczy rankingowych (ELO)</p>
              <EloRankingList users={eloRanked.slice(0, 15)} />
            </TabsContent>
            {Object.keys(GAME_LABELS).map(gameKey => (
              <TabsContent key={gameKey} value={gameKey}>
                <RankingList scores={scores.filter(s => s.game_type === gameKey).slice(0, 15)} />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}