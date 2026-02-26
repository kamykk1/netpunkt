import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Flag } from 'lucide-react';
import { toast } from 'sonner';

const ROWS = 9, COLS = 9, MINES = 10;
const POINTS_WIN = 40;

function createBoard() {
  let board = Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => ({ r, c, mine: false, revealed: false, flagged: false, count: 0 }))
  );
  let placed = 0;
  while (placed < MINES) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);
    if (!board[r][c].mine) { board[r][c].mine = true; placed++; }
  }
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (board[r][c].mine) continue;
    let cnt = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const nr = r+dr, nc = c+dc;
      if (nr>=0&&nr<ROWS&&nc>=0&&nc<COLS&&board[nr][nc].mine) cnt++;
    }
    board[r][c].count = cnt;
  }
  return board;
}

function reveal(board, r, c) {
  if (r<0||r>=ROWS||c<0||c>=COLS||board[r][c].revealed||board[r][c].flagged) return;
  board[r][c].revealed = true;
  if (board[r][c].count === 0 && !board[r][c].mine) {
    for (let dr=-1;dr<=1;dr++) for (let dc=-1;dc<=1;dc++) reveal(board, r+dr, c+dc);
  }
}

const NUM_COLORS = ['','text-blue-400','text-emerald-400','text-red-400','text-purple-400','text-amber-400','text-cyan-400','text-pink-400','text-slate-300'];

export default function MinesweeperGame({ user, onClose }) {
  const [board, setBoard] = useState(null);
  const [phase, setPhase] = useState('intro'); // intro playing won lost
  const [time, setTime] = useState(0);
  const [flagCount, setFlagCount] = useState(0);

  useEffect(() => {
    if (phase !== 'playing') return;
    const t = setInterval(() => setTime(p => p + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const startGame = () => {
    setBoard(createBoard());
    setTime(0); setFlagCount(0);
    setPhase('playing');
  };

  const handleClick = (r, c) => {
    if (phase !== 'playing') return;
    const b = board.map(row => row.map(cell => ({ ...cell })));
    if (b[r][c].flagged || b[r][c].revealed) return;
    if (b[r][c].mine) {
      b.forEach(row => row.forEach(cell => { if (cell.mine) cell.revealed = true; }));
      setBoard(b); setPhase('lost');
      toast.error('💥 Trafiłeś na minę!');
      return;
    }
    reveal(b, r, c);
    setBoard(b);
    const unrevealed = b.flat().filter(cell => !cell.revealed && !cell.mine);
    if (unrevealed.length === 0) {
      setPhase('won');
      base44.auth.updateMe({ points_balance: (user.points_balance || 0) + POINTS_WIN });
      toast.success(`+${POINTS_WIN} punktów za wygranie sapera!`);
    }
  };

  const handleRightClick = (e, r, c) => {
    e.preventDefault();
    if (phase !== 'playing' || board[r][c].revealed) return;
    const b = board.map(row => row.map(cell => ({ ...cell })));
    b[r][c].flagged = !b[r][c].flagged;
    setFlagCount(p => b[r][c].flagged ? p+1 : p-1);
    setBoard(b);
  };

  const fmtTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  if (phase === 'intro') return (
    <div className="text-center py-8 space-y-6">
      <div className="text-6xl">💣</div>
      <div>
        <h3 className="text-2xl font-bold text-white mb-2">Saper (Minesweeper)</h3>
        <p className="text-slate-400">{ROWS}x{COLS} • {MINES} min • Nagroda: {POINTS_WIN} pkt</p>
        <p className="text-slate-500 text-sm mt-1">Kliknij prawym przyciskiem aby postawić flagę</p>
      </div>
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={onClose} className="border-slate-600 text-slate-300 bg-transparent">Wróć</Button>
        <Button onClick={startGame} className="bg-gradient-to-r from-purple-600 to-cyan-600 px-8">Graj!</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge className="bg-red-500/20 text-red-400">💣 {MINES - flagCount}</Badge>
        <div className="flex items-center gap-2">
          {phase === 'won' && <span className="text-emerald-400 font-bold">🏆 Wygrałeś! +{POINTS_WIN} pkt</span>}
          {phase === 'lost' && <span className="text-red-400 font-bold">💥 Koniec gry</span>}
        </div>
        <span className="text-slate-400 font-mono text-sm">⏱ {fmtTime(time)}</span>
      </div>
      <div className="overflow-x-auto">
        <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
          {board?.map(row => row.map(cell => {
            let bg = 'bg-slate-700 hover:bg-slate-600';
            if (cell.revealed) bg = cell.mine ? 'bg-red-800' : 'bg-slate-900';
            if (cell.flagged) bg = 'bg-amber-900/50';
            return (
              <button key={`${cell.r}-${cell.c}`}
                onClick={() => handleClick(cell.r, cell.c)}
                onContextMenu={(e) => handleRightClick(e, cell.r, cell.c)}
                className={`w-8 h-8 text-xs font-bold rounded transition-colors border border-slate-600/30 ${bg} ${cell.revealed ? NUM_COLORS[cell.count] || '' : ''}`}>
                {cell.flagged && !cell.revealed ? '🚩' :
                 cell.revealed && cell.mine ? '💣' :
                 cell.revealed && cell.count > 0 ? cell.count : ''}
              </button>
            );
          }))}
        </div>
      </div>
      <div className="flex gap-3 justify-center">
        <Button size="sm" variant="outline" onClick={startGame} className="border-purple-500/30 text-purple-400 bg-transparent">
          <RefreshCw className="w-3 h-3 mr-1" /> Nowa gra
        </Button>
        <Button size="sm" variant="outline" onClick={onClose} className="border-slate-600 text-slate-400 bg-transparent">Wróć</Button>
      </div>
    </div>
  );
}