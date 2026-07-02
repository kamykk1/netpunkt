import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Badge } from "@/components/ui/badge";
import UserAvatar from '@/components/profile/UserAvatar.jsx';

const ROWS = 6, COLS = 7;
const createBoard = () => Array(ROWS).fill(null).map(() => Array(COLS).fill(null));

const checkWin = (board, player) => {
  // horizontal
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c <= COLS - 4; c++)
      if ([0,1,2,3].every(i => board[r][c+i] === player)) return true;
  // vertical
  for (let r = 0; r <= ROWS - 4; r++)
    for (let c = 0; c < COLS; c++)
      if ([0,1,2,3].every(i => board[r+i][c] === player)) return true;
  // diagonal
  for (let r = 0; r <= ROWS - 4; r++)
    for (let c = 0; c <= COLS - 4; c++)
      if ([0,1,2,3].every(i => board[r+i][c+i] === player)) return true;
  for (let r = 3; r < ROWS; r++)
    for (let c = 0; c <= COLS - 4; c++)
      if ([0,1,2,3].every(i => board[r-i][c+i] === player)) return true;
  return false;
};

const dropPiece = (board, col, player) => {
  const newBoard = board.map(r => [...r]);
  for (let r = ROWS - 1; r >= 0; r--) {
    if (!newBoard[r][col]) { newBoard[r][col] = player; break; }
  }
  return newBoard;
};

export default function Connect4Game({ room, currentUser, opponent, onGameEnd }) {
  const isPlayer1 = room?.player1_id === currentUser?.id;
  const myColor = isPlayer1 ? 'red' : 'yellow';
  const [board, setBoard] = useState(createBoard());
  const [myTurn, setMyTurn] = useState(isPlayer1);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    if (!room?.id) return;
    let s = null; try { s = room.game_state ? JSON.parse(room.game_state) : null; } catch {}
    if (s?.board) { setBoard(s.board); setMyTurn(room.current_turn === currentUser?.id); }
    const unsub = base44.entities.GameRoom.subscribe((ev) => {
      if (ev.id !== room.id || ev.type !== 'update') return;
      let state = null; try { state = ev.data?.game_state ? JSON.parse(ev.data.game_state) : null; } catch {}
      if (state?.board) setBoard(state.board);
      setMyTurn(ev.data.current_turn === currentUser?.id);
      if (ev.data.status === 'finished') { setWinner(ev.data.winner_id === currentUser?.id ? myColor : 'other'); onGameEnd?.(ev.data.winner_id === currentUser?.id); }
    });
    return unsub;
  }, [room?.id]);

  const handleDrop = async (col) => {
    if (!myTurn || winner) return;
    const newBoard = dropPiece(board, col, myColor);
    if (checkWin(newBoard, myColor)) {
      await base44.entities.GameRoom.update(room.id, { game_state: JSON.stringify({ board: newBoard }), status: 'finished', winner_id: currentUser.id });
      setBoard(newBoard); setWinner(myColor); onGameEnd?.(true);
    } else {
      const nextTurn = isPlayer1 ? room.player2_id : room.player1_id;
      await base44.entities.GameRoom.update(room.id, { game_state: JSON.stringify({ board: newBoard }), current_turn: nextTurn });
      setBoard(newBoard); setMyTurn(false);
    }
  };

  const cellStyle = (cell) => {
    if (cell === 'red') return 'bg-red-500 border-red-700';
    if (cell === 'yellow') return 'bg-yellow-400 border-yellow-600';
    return 'bg-slate-800 border-slate-700/60';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <UserAvatar user={currentUser} size="sm" />
          <div>
            <p className="text-white text-sm font-medium">{currentUser?.display_name || currentUser?.full_name}</p>
            <div className="w-4 h-4 rounded-full bg-red-500 mt-0.5" />
          </div>
          {myTurn && !winner && <Badge className="bg-purple-500 text-white text-xs animate-pulse">Twój ruch</Badge>}
        </div>
        <div className="text-slate-400 font-bold">VS</div>
        <div className="flex items-center gap-2 flex-row-reverse">
          <UserAvatar user={opponent} size="sm" />
          <div className="text-right">
            <p className="text-white text-sm font-medium">{opponent?.display_name || opponent?.full_name || 'Przeciwnik'}</p>
            <div className="w-4 h-4 rounded-full bg-yellow-400 ml-auto mt-0.5" />
          </div>
          {!myTurn && !winner && <Badge className="bg-cyan-500 text-white text-xs animate-pulse">Ruch</Badge>}
        </div>
      </div>

      <div className="bg-blue-900/40 rounded-xl p-2 inline-block mx-auto block">
        {/* Column buttons */}
        <div className="flex gap-1 mb-1">
          {Array(COLS).fill(null).map((_, c) => (
            <button key={c} onClick={() => handleDrop(c)}
              className={`w-9 h-5 rounded text-xs ${myTurn && !winner ? 'hover:bg-purple-500/40 cursor-pointer text-purple-300' : 'cursor-default text-transparent'}`}>
              ▼
            </button>
          ))}
        </div>
        {board.map((row, r) => (
          <div key={r} className="flex gap-1 mb-1">
            {row.map((cell, c) => (
              <div key={c} className={`w-9 h-9 rounded-full border-2 transition-all ${cellStyle(cell)}`} />
            ))}
          </div>
        ))}
      </div>

      {winner && (
        <div className="text-center py-2">
          <p className="text-xl font-bold text-white">
            {winner === myColor ? '🏆 Wygrałeś!' : '💀 Przegrałeś!'}
          </p>
        </div>
      )}
    </div>
  );
}