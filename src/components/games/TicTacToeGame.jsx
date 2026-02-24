import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Badge } from "@/components/ui/badge";
import UserAvatar from '@/components/profile/UserAvatar.jsx';

const WIN_LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

const checkWinner = (board) => {
  for (const [a,b,c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  if (board.every(c => c)) return 'draw';
  return null;
};

export default function TicTacToeGame({ room, currentUser, opponent, onGameEnd }) {
  const isPlayer1 = room?.player1_id === currentUser?.id;
  const mySymbol = isPlayer1 ? 'X' : 'O';
  const oppSymbol = isPlayer1 ? 'O' : 'X';
  const [board, setBoard] = useState(Array(9).fill(null));
  const [myTurn, setMyTurn] = useState(isPlayer1);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    if (!room?.id) return;
    const initState = room.game_state ? JSON.parse(room.game_state) : null;
    if (initState?.board) { setBoard(initState.board); setMyTurn(room.current_turn === currentUser?.id); }
    const unsub = base44.entities.GameRoom.subscribe((ev) => {
      if (ev.id !== room.id || ev.type !== 'update') return;
      const state = ev.data?.game_state ? JSON.parse(ev.data.game_state) : null;
      if (state?.board) setBoard(state.board);
      setMyTurn(ev.data.current_turn === currentUser?.id);
      const w = checkWinner(state?.board || []);
      if (w) { setWinner(w); onGameEnd?.(w === mySymbol); }
    });
    return unsub;
  }, [room?.id]);

  const handleClick = async (idx) => {
    if (!myTurn || board[idx] || winner) return;
    const newBoard = [...board];
    newBoard[idx] = mySymbol;
    const w = checkWinner(newBoard);
    const nextTurn = isPlayer1 ? room.player2_id : room.player1_id;

    if (w) {
      await base44.entities.GameRoom.update(room.id, {
        game_state: JSON.stringify({ board: newBoard }),
        status: 'finished',
        winner_id: w === 'draw' ? null : currentUser.id,
        current_turn: null
      });
      setBoard(newBoard);
      setWinner(w);
      onGameEnd?.(w === mySymbol);
    } else {
      await base44.entities.GameRoom.update(room.id, {
        game_state: JSON.stringify({ board: newBoard }),
        current_turn: nextTurn
      });
      setBoard(newBoard);
      setMyTurn(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <UserAvatar user={currentUser} size="sm" />
          <div>
            <p className="text-white text-sm font-medium">{currentUser?.display_name || currentUser?.full_name}</p>
            <p className="text-purple-400 text-xs font-bold">{mySymbol}</p>
          </div>
          {myTurn && !winner && <Badge className="bg-purple-500 text-white text-xs animate-pulse">Twój ruch</Badge>}
        </div>
        <div className="text-slate-400 font-bold">VS</div>
        <div className="flex items-center gap-2 flex-row-reverse">
          <UserAvatar user={opponent} size="sm" />
          <div className="text-right">
            <p className="text-white text-sm font-medium">{opponent?.display_name || opponent?.full_name || 'Przeciwnik'}</p>
            <p className="text-cyan-400 text-xs font-bold">{oppSymbol}</p>
          </div>
          {!myTurn && !winner && <Badge className="bg-cyan-500 text-white text-xs animate-pulse">Ruch</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
        {board.map((cell, idx) => (
          <button key={idx}
            onClick={() => handleClick(idx)}
            className={`w-[72px] h-[72px] text-3xl font-bold rounded-xl border-2 transition-all
              ${!cell && myTurn && !winner ? 'hover:bg-purple-500/20 border-purple-500/30 cursor-pointer' : 'border-slate-700/50 cursor-default'}
              ${cell === 'X' ? 'text-purple-400 bg-purple-500/10' : ''}
              ${cell === 'O' ? 'text-cyan-400 bg-cyan-500/10' : ''}
              ${!cell ? 'bg-slate-800/60' : ''}
            `}>
            {cell}
          </button>
        ))}
      </div>

      {winner && (
        <div className="text-center py-2">
          <p className="text-xl font-bold text-white">
            {winner === 'draw' ? '🤝 Remis!' : winner === mySymbol ? '🏆 Wygrałeś!' : '💀 Przegrałeś!'}
          </p>
        </div>
      )}
    </div>
  );
}