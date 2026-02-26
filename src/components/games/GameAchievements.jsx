import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Star, Zap, Shield, Target, Flame, Brain, Puzzle, Sword, Gift, Dices } from 'lucide-react';

const ACHIEVEMENTS = [
  // General
  { id: 'first_game', icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', label: 'Pierwszy krok', desc: 'Rozegraj pierwszą partię', req: (u) => (u.games_played || 0) >= 1, pts: 10 },
  { id: 'first_win', icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', label: 'Pierwsza wygrana', desc: 'Wygraj swoją pierwszą partię', req: (u) => (u.games_won || 0) >= 1, pts: 20 },
  { id: 'wins_5', icon: Star, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30', label: 'Pięć wygranych', desc: 'Wygraj 5 partii łącznie', req: (u) => (u.games_won || 0) >= 5, pts: 30 },
  { id: 'wins_25', icon: Flame, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', label: 'Weteran', desc: 'Wygraj 25 partii łącznie', req: (u) => (u.games_won || 0) >= 25, pts: 75 },
  { id: 'wins_100', icon: Shield, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30', label: 'Legenda', desc: 'Wygraj 100 partii łącznie', req: (u) => (u.games_won || 0) >= 100, pts: 200 },
  { id: 'played_10', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', label: 'Aktywny gracz', desc: 'Rozegraj 10 partii', req: (u) => (u.games_played || 0) >= 10, pts: 25 },
  { id: 'played_50', icon: Dices, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/30', label: 'Zapalony gracz', desc: 'Rozegraj 50 partii', req: (u) => (u.games_played || 0) >= 50, pts: 100 },
  // Quiz
  { id: 'quiz_perfect', icon: Brain, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/30', label: 'Geniusz', desc: 'Zdobądź 50 pkt w quizie (5/5)', req: (u) => (u.quiz_best_score || 0) >= 50, pts: 50 },
  { id: 'quiz_played_5', icon: Brain, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', label: 'Miłośnik quizów', desc: 'Zagraj w quiz 5 razy', req: (u) => (u.quiz_games_played || 0) >= 5, pts: 20 },
  // Memory
  { id: 'memory_quick', icon: Puzzle, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', label: 'Błyskawiczna pamięć', desc: 'Ukończ Memory w mniej niż 20 ruchach', req: (u) => (u.memory_best_moves || 999) <= 20, pts: 50 },
  // Snake
  { id: 'snake_100', icon: Zap, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30', label: 'Wąż tytus', desc: 'Zdobądź 100 pkt w Snake', req: (u) => (u.snake_best_score || 0) >= 100, pts: 60 },
  // Wheel
  { id: 'wheel_jackpot', icon: Gift, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/30', label: 'Szczęściarz!', desc: 'Traf jackpot na kole fortuny', req: (u) => (u.wheel_jackpot_hits || 0) >= 1, pts: 100 },
  // Multiplayer
  { id: 'multi_win_5', icon: Sword, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30', label: 'Challenger', desc: 'Wygraj 5 partii multiplayer', req: (u) => (u.games_won || 0) >= 5 && (u.games_played || 0) >= 5, pts: 50 },
];

export default function GameAchievements({ user }) {
  if (!user) return null;

  const unlocked = ACHIEVEMENTS.filter(a => a.req(user));
  const locked = ACHIEVEMENTS.filter(a => !a.req(user));
  const totalPts = unlocked.reduce((s, a) => s + a.pts, 0);

  return (
    <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-purple-400" /> Osiągnięcia
          <div className="ml-auto flex items-center gap-2">
            <Badge className="bg-purple-500/20 text-purple-400">{unlocked.length}/{ACHIEVEMENTS.length}</Badge>
            <Badge className="bg-yellow-500/20 text-yellow-400">+{totalPts} pkt</Badge>
          </div>
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
                {isUnlocked
                  ? <Badge className="bg-emerald-500/20 text-emerald-400 text-xs mt-1.5 px-1.5">✓ +{a.pts} pkt</Badge>
                  : <span className="text-slate-600 text-xs mt-1.5 block">+{a.pts} pkt</span>
                }
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}