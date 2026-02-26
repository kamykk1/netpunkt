import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Coins, Lock, Plus, Loader2, Swords, Trophy, Gamepad2 } from 'lucide-react';

const MULTIPLAYER_TYPES = {
  battleship: { name: 'Okręty' },
  tictactoe: { name: 'Kółko i Krzyżyk' },
  connect4: { name: 'Cztery w rzędzie' },
};

const GAME_MODES = [
  {
    key: 'classic',
    name: 'Klasyczny',
    icon: Gamepad2,
    desc: 'Standardowa gra — wygrywa najlepszy gracz',
    color: 'border-purple-500/50 bg-purple-500/10',
  },
  {
    key: 'point_duel',
    name: 'Pojedynek na punkty',
    icon: Swords,
    desc: 'Gra do limitu punktów — stawka jest równa dla obu graczy',
    color: 'border-yellow-500/50 bg-yellow-500/10',
  },
  {
    key: 'ranked',
    name: 'Bitwa rankingowa',
    icon: Trophy,
    desc: 'Wpływa na ranking ELO — rywalizuj o pozycję w rankingu',
    color: 'border-cyan-500/50 bg-cyan-500/10',
  },
];

export default function CreateRoomDialog({ open, onClose, user, onCreate, isPending }) {
  const [form, setForm] = useState({
    game_type: 'tictactoe',
    game_mode: 'classic',
    bet_points: 0,
    is_private: false,
    time_per_move: 60,
    point_limit: 100,
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const selectedMode = GAME_MODES.find(m => m.key === form.game_mode);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a2e] border-purple-500/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Utwórz nową grę</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">

          {/* Typ gry */}
          <div className="space-y-2">
            <Label className="text-slate-300">Wybierz grę</Label>
            <Select value={form.game_type} onValueChange={v => set('game_type', v)}>
              <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-purple-500/30 text-white">
                {Object.entries(MULTIPLAYER_TYPES).map(([k, g]) => (
                  <SelectItem key={k} value={k} className="text-white">{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tryb gry */}
          <div className="space-y-2">
            <Label className="text-slate-300">Tryb gry</Label>
            <div className="grid grid-cols-1 gap-2">
              {GAME_MODES.map(mode => {
                const Icon = mode.icon;
                const active = form.game_mode === mode.key;
                return (
                  <button
                    key={mode.key}
                    onClick={() => set('game_mode', mode.key)}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all text-left ${active ? mode.color : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'}`}
                  >
                    <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                    <div>
                      <p className={`font-medium text-sm ${active ? 'text-white' : 'text-slate-300'}`}>{mode.name}</p>
                      <p className="text-slate-400 text-xs">{mode.desc}</p>
                    </div>
                    {active && <Badge className="ml-auto bg-white/20 text-white text-xs">Wybrany</Badge>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Opcje specyficzne dla trybu */}
          {form.game_mode === 'point_duel' && (
            <div className="space-y-2 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
              <Label className="text-yellow-300 text-sm">⚔️ Opcje Pojedynku na punkty</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-400 text-xs">Stawka (pkt)</Label>
                  <Input type="number" min="0" step="10" value={form.bet_points}
                    onChange={e => set('bet_points', parseInt(e.target.value) || 0)}
                    className="bg-slate-800 border-yellow-500/30 text-white mt-1" />
                </div>
                <div>
                  <Label className="text-slate-400 text-xs">Cel punktowy</Label>
                  <Input type="number" min="10" step="10" value={form.point_limit}
                    onChange={e => set('point_limit', parseInt(e.target.value) || 100)}
                    className="bg-slate-800 border-yellow-500/30 text-white mt-1" />
                </div>
              </div>
              <p className="text-slate-500 text-xs">Twoje saldo: {(user?.points_balance || 0).toLocaleString()} pkt • Przy remisie stawka wraca do obu graczy</p>
            </div>
          )}

          {form.game_mode === 'classic' && (
            <div className="space-y-2">
              <Label className="text-slate-300">Stawka (punkty)</Label>
              <Input type="number" min="0" step="10" value={form.bet_points}
                onChange={e => set('bet_points', parseInt(e.target.value) || 0)}
                className="bg-slate-800 border-purple-500/30 text-white" placeholder="0 = bez stawki" />
              <p className="text-slate-500 text-xs">Twoje saldo: {(user?.points_balance || 0).toLocaleString()} pkt</p>
            </div>
          )}

          {form.game_mode === 'ranked' && (
            <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
              <p className="text-cyan-300 text-sm font-medium mb-1">🏆 Tryb rankingowy ELO</p>
              <p className="text-slate-400 text-xs">Wynik tej gry wpłynie na Twój ranking ELO. Twoje aktualne ELO: <span className="text-white font-bold">{user?.elo_rating || 1000}</span></p>
            </div>
          )}

          {/* Czas na ruch */}
          <div className="space-y-2">
            <Label className="text-slate-300">Czas na ruch</Label>
            <Select value={String(form.time_per_move)} onValueChange={v => set('time_per_move', parseInt(v))}>
              <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-purple-500/30 text-white">
                <SelectItem value="0" className="text-white">Bez limitu</SelectItem>
                <SelectItem value="30" className="text-white">30 sekund</SelectItem>
                <SelectItem value="60" className="text-white">1 minuta</SelectItem>
                <SelectItem value="120" className="text-white">2 minuty</SelectItem>
                <SelectItem value="300" className="text-white">5 minut</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Prywatny pokój */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
            <Lock className="w-4 h-4 text-slate-400" />
            <div className="flex-1">
              <p className="text-white text-sm">Prywatny pokój</p>
              <p className="text-slate-500 text-xs">Tylko osoby z linkiem mogą dołączyć</p>
            </div>
            <button
              onClick={() => set('is_private', !form.is_private)}
              className={`w-10 h-5 rounded-full transition-colors relative ${form.is_private ? 'bg-purple-600' : 'bg-slate-600'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${form.is_private ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 border-slate-600 text-slate-300 bg-transparent">Anuluj</Button>
            <Button onClick={() => onCreate(form)} disabled={isPending} className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />} Utwórz
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}