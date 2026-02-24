import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Crown, Medal, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

function RankBadge({ rank }) {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-slate-300" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
  return <span className="text-slate-400 font-bold w-5 text-center text-sm">{rank}</span>;
}

function RankingList({ users }) {
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
          <div className="w-6 flex justify-center">
            <RankBadge rank={i + 1} />
          </div>
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

export default function GameRankings() {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['gameRankingUsers'],
    queryFn: () => base44.entities.User.list('-games_won', 50)
  });

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).toISOString();

  const ranked = users.filter(u => (u.games_played || 0) > 0);

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
          <Tabs defaultValue="all">
            <TabsList className="bg-slate-800/60 w-full mb-4">
              <TabsTrigger value="all" className="flex-1 text-xs">Ogólny</TabsTrigger>
              <TabsTrigger value="weekly" className="flex-1 text-xs">Tygodniowy</TabsTrigger>
              <TabsTrigger value="daily" className="flex-1 text-xs">Dzienny</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <RankingList users={ranked.sort((a, b) => (b.games_won || 0) - (a.games_won || 0)).slice(0, 10)} />
            </TabsContent>
            <TabsContent value="weekly">
              <p className="text-slate-500 text-xs text-center mb-3">Top graczy tego tygodnia</p>
              <RankingList users={ranked.sort((a, b) => (b.games_won || 0) - (a.games_won || 0)).slice(0, 10)} />
            </TabsContent>
            <TabsContent value="daily">
              <p className="text-slate-500 text-xs text-center mb-3">Top graczy dzisiaj</p>
              <RankingList users={ranked.sort((a, b) => (b.games_won || 0) - (a.games_won || 0)).slice(0, 5)} />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}