import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, TrendingDown, RotateCcw, Home } from 'lucide-react';
import EloHistoryChart from './EloHistoryChart.jsx';

const GAME_LABELS = {
  battleship: 'Okręty',
  tictactoe: 'Kółko i Krzyżyk',
  connect4: 'Cztery w rzędzie',
};

export default function PostGameSummary({ room, currentUser, opponent, result, eloChange, onPlayAgain, onLeave }) {
  const isWin = result === 'win';
  const isDraw = result === 'draw';
  const isRanked = room?.game_mode === 'ranked';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <Card className="bg-[#1a1a2e] border-purple-500/30 w-full max-w-md">
        <CardContent className="p-6 space-y-5">
          {/* Result header */}
          <div className="text-center">
            <div className="text-6xl mb-3">
              {isDraw ? '🤝' : isWin ? '🏆' : '💀'}
            </div>
            <h2 className={`text-2xl font-bold ${isDraw ? 'text-yellow-400' : isWin ? 'text-emerald-400' : 'text-red-400'}`}>
              {isDraw ? 'Remis!' : isWin ? 'Wygrałeś!' : 'Przegrałeś'}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {GAME_LABELS[room?.game_type] || room?.game_type} · vs {opponent?.full_name || opponent?.email?.split('@')[0] || 'Przeciwnik'}
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-lg bg-slate-800/50">
              <p className="text-slate-400 text-xs">Tryb</p>
              <p className="text-white text-sm font-medium mt-1">
                {room?.game_mode === 'ranked' ? '🏆 Rankingowy' : room?.game_mode === 'point_duel' ? '⚔️ Punktowy' : '🎮 Klasyczny'}
              </p>
            </div>
            {room?.bet_points > 0 && (
              <div className="p-3 rounded-lg bg-slate-800/50">
                <p className="text-slate-400 text-xs">Stawka</p>
                <p className={`text-sm font-bold mt-1 ${isWin ? 'text-emerald-400' : isDraw ? 'text-yellow-400' : 'text-red-400'}`}>
                  {isWin ? '+' : isDraw ? '±' : '-'}{room.bet_points} pkt
                </p>
              </div>
            )}
            <div className="p-3 rounded-lg bg-slate-800/50">
              <p className="text-slate-400 text-xs">Wygrane ogółem</p>
              <p className="text-white text-sm font-bold mt-1">{currentUser?.games_won || 0}</p>
            </div>
          </div>

          {/* ELO change */}
          {isRanked && eloChange !== undefined && (
            <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-300 text-sm font-medium">Zmiana ELO</p>
                  <p className="text-slate-400 text-xs">Aktualny ranking: {currentUser?.elo_rating || 1000}</p>
                </div>
                <div className="flex items-center gap-2">
                  {eloChange >= 0
                    ? <TrendingUp className="w-5 h-5 text-emerald-400" />
                    : <TrendingDown className="w-5 h-5 text-red-400" />}
                  <span className={`text-2xl font-bold ${eloChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {eloChange >= 0 ? '+' : ''}{eloChange}
                  </span>
                </div>
              </div>
              <div className="mt-3">
                <EloHistoryChart userId={currentUser?.id} compact />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onLeave} className="flex-1 border-slate-600 text-slate-300 bg-transparent">
              <Home className="w-4 h-4 mr-2" /> Lobby
            </Button>
            <Button onClick={onPlayAgain} className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600">
              <RotateCcw className="w-4 h-4 mr-2" /> Zagraj ponownie
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}