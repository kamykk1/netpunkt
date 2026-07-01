import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, Trophy, Users, Clock, CheckCircle, Loader2 } from 'lucide-react';

const GAME_LABELS = {
  battleship: 'Okręty',
  tictactoe: 'Kółko i Krzyżyk',
  connect4: 'Cztery w rzędzie',
};

const STATUS_CONFIG = {
  upcoming: { label: 'Nadchodzący', cls: 'bg-slate-500/20 text-slate-300' },
  registration: { label: 'Zapisy otwarte', cls: 'bg-emerald-500/20 text-emerald-400' },
  active: { label: 'W trakcie', cls: 'bg-cyan-500/20 text-cyan-400' },
  finished: { label: 'Zakończony', cls: 'bg-purple-500/20 text-purple-400' },
  cancelled: { label: 'Anulowany', cls: 'bg-red-500/20 text-red-400' },
};

export default function TournamentCard({ tournament, user, isJoined, onJoin, onLeave, isPending }) {
  const statusCfg = STATUS_CONFIG[tournament.status] || STATUS_CONFIG.upcoming;
  const isFull = tournament.current_participants >= tournament.max_participants;
  const isFinished = tournament.status === 'finished';
  const isWinner = tournament.winner_id === user?.id;

  const startDate = tournament.start_date ? new Date(tournament.start_date) : null;
  const regDeadline = tournament.registration_deadline ? new Date(tournament.registration_deadline) : null;

  return (
    <Card className={`bg-[#1a1a2e]/50 border-purple-500/20 overflow-hidden ${isJoined ? 'ring-1 ring-cyan-500/50' : ''}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-bold text-white text-lg">{tournament.name}</h3>
            {tournament.description && <p className="text-slate-400 text-sm mt-1">{tournament.description}</p>}
          </div>
          <Badge className={statusCfg.cls}>{statusCfg.label}</Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50">
            <Trophy className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-slate-400 text-xs">Gra</p>
              <p className="text-white text-sm font-medium">{GAME_LABELS[tournament.game_type] || tournament.game_type}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50">
            <Coins className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-slate-400 text-xs">Wpisowe</p>
              <p className="text-white text-sm font-medium">{tournament.entry_fee} pkt</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50">
            <Trophy className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-slate-400 text-xs">Pula nagród</p>
              <p className="text-yellow-400 text-sm font-bold">{tournament.prize_pool.toLocaleString()} pkt</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50">
            <Users className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <div>
              <p className="text-slate-400 text-xs">Gracze</p>
              <p className="text-white text-sm font-medium">{tournament.current_participants}/{tournament.max_participants}</p>
            </div>
          </div>
        </div>

        {startDate && (
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
            <Clock className="w-4 h-4" />
            <span>Start: {startDate.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}

        {isFinished && tournament.winner_name && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${isWinner ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-slate-800/50'} mb-3`}>
            <Trophy className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-slate-400 text-xs">Zwycięzca</p>
              <p className="text-white font-bold">{tournament.winner_name}{isWinner ? ' (Ty!) 🎉' : ''}</p>
            </div>
          </div>
        )}

        {isFinished && !tournament.winner_name && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-800/50 mb-3">
            <Loader2 className="w-4 h-4 text-slate-400" />
            <p className="text-slate-400 text-sm">Turniej zakończony — przyznawanie nagród...</p>
          </div>
        )}

        {/* Actions */}
        {!isFinished && tournament.status === 'registration' && (
          isJoined ? (
            <Button variant="outline" onClick={onLeave} disabled={isPending} className="w-full border-red-500/30 text-red-400 bg-transparent">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Wycofaj się
            </Button>
          ) : (
            <Button onClick={onJoin} disabled={isPending || isFull || (user?.points_balance || 0) < tournament.entry_fee} className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isFull ? 'Brak miejsc' : (user?.points_balance || 0) < tournament.entry_fee ? 'Niewystarczające punkty' : 'Dołącz do turnieju'}
            </Button>
          )
        )}

        {isJoined && tournament.status !== 'finished' && (
          <div className="flex items-center justify-center gap-2 mt-2 text-cyan-400 text-sm">
            <CheckCircle className="w-4 h-4" /> Jesteś zapisany!
          </div>
        )}
      </CardContent>
    </Card>
  );
}