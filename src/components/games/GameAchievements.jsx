import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Star, Zap, Shield, Target, Flame } from 'lucide-react';

const ACHIEVEMENTS = [
  { id: 'first_win', icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', label: 'Pierwsza wygrana', desc: 'Wygraj swoją pierwszą partię', req: (u) => (u.games_won || 0) >= 1 },
  { id: 'wins_5', icon: Star, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30', label: 'Pięć wygranych', desc: 'Wygraj 5 partii', req: (u) => (u.games_won || 0) >= 5 },
  { id: 'wins_25', icon: Flame, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', label: 'Weteran', desc: 'Wygraj 25 partii', req: (u) => (u.games_won || 0) >= 25 },
  { id: 'wins_100', icon: Shield, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30', label: 'Legenda', desc: 'Wygraj 100 partii', req: (u) => (u.games_won || 0) >= 100 },
  { id: 'played_10', icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', label: 'Aktywny gracz', desc: 'Rozegraj 10 partii', req: (u) => (u.games_played || 0) >= 10 },
  { id: 'points_1000', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', label: 'Zbieracz punktów', desc: 'Zdobądź 1000 pkt z gier', req: (u) => (u.points_balance || 0) >= 1000 },
];

export default function GameAchievements({ user }) {
  if (!user) return null;

  const unlocked = ACHIEVEMENTS.filter(a => a.req(user));
  const locked = ACHIEVEMENTS.filter(a => !a.req(user));

  return (
    <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-purple-400" /> Osiągnięcia
          <Badge className="bg-purple-500/20 text-purple-400 ml-auto">{unlocked.length}/{ACHIEVEMENTS.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[...unlocked, ...locked].map(a => {
            const isUnlocked = a.req(user);
            const Icon = a.icon;
            return (
              <div key={a.id} className={`p-3 rounded-xl border text-center transition-all ${isUnlocked ? a.bg : 'bg-slate-800/20 border-slate-700/30 opacity-40'}`}>
                <Icon className={`w-6 h-6 mx-auto mb-1.5 ${isUnlocked ? a.color : 'text-slate-500'}`} />
                <p className={`text-xs font-medium ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>{a.label}</p>
                <p className="text-slate-500 text-xs mt-0.5 leading-tight">{a.desc}</p>
                {isUnlocked && <Badge className="bg-emerald-500/20 text-emerald-400 text-xs mt-1.5 px-1.5">✓ Odblokowano</Badge>}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}