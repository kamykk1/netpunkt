import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ship, Target, Waves } from 'lucide-react';
import UserAvatar from '@/components/profile/UserAvatar.jsx';

const GRID = 10;
const SHIPS = [5, 4, 3, 3, 2]; // lengths

const createEmptyGrid = () => Array(GRID).fill(null).map(() => Array(GRID).fill(null));

const placeShipsRandomly = () => {
  const grid = createEmptyGrid();
  SHIPS.forEach(len => {
    let placed = false;
    while (!placed) {
      const horiz = Math.random() < 0.5;
      const r = Math.floor(Math.random() * (GRID - (horiz ? 0 : len)));
      const c = Math.floor(Math.random() * (GRID - (horiz ? len : 0)));
      let ok = true;
      for (let i = 0; i < len; i++) {
        const nr = horiz ? r : r + i;
        const nc = horiz ? c + i : c;
        if (grid[nr][nc] !== null) { ok = false; break; }
      }
      if (ok) {
        for (let i = 0; i < len; i++) {
          const nr = horiz ? r : r + i;
          const nc = horiz ? c + i : c;
          grid[nr][nc] = 'ship';
        }
        placed = true;
      }
    }
  });
  return grid;
};

const countShipsLeft = (grid) => grid.flat().filter(c => c === 'ship').length;

export default function BattleshipGame({ room, currentUser, opponent, onGameEnd }) {
  const isPlayer1 = room?.player1_id === currentUser?.id;
  const [myGrid, setMyGrid] = useState(null);
  const [oppGrid, setOppGrid] = useState(null);
  const [myTurn, setMyTurn] = useState(isPlayer1);
  const [phase, setPhase] = useState('setup'); // setup | playing | finished

  useEffect(() => {
    if (phase === 'setup') {
      setMyGrid(placeShipsRandomly());
      setOppGrid(createEmptyGrid());
    }
  }, []);

  useEffect(() => {
    if (!room?.id) return;
    const unsub = base44.entities.GameRoom.subscribe((ev) => {
      if (ev.id === room.id && ev.type === 'update') {
        let state = null; try { state = ev.data?.game_state ? JSON.parse(ev.data.game_state) : null; } catch {}
        if (!state) return;
        const myKey = isPlayer1 ? 'grid1' : 'grid2';
        const oppKey = isPlayer1 ? 'grid2' : 'grid1';
        if (state[myKey]) setMyGrid(state[myKey]);
        if (state[oppKey]) {
          // Only show hits/misses on opponent grid
          setOppGrid(prev => {
            if (!prev) return prev;
            const updated = prev.map(row => [...row]);
            state[oppKey].forEach((row, r) => row.forEach((cell, c) => {
              if (cell === 'hit' || cell === 'miss') updated[r][c] = cell;
            }));
            return updated;
          });
        }
        setMyTurn(ev.data.current_turn === currentUser?.id);
        if (ev.data.status === 'finished') { setPhase('finished'); onGameEnd?.(ev.data.winner_id === currentUser?.id); }
      }
    });
    return unsub;
  }, [room?.id]);

  const startGame = async () => {
    const state = {
      grid1: isPlayer1 ? myGrid : createEmptyGrid(),
      grid2: !isPlayer1 ? myGrid : createEmptyGrid(),
    };
    await base44.entities.GameRoom.update(room.id, {
      status: 'active',
      current_turn: room.player1_id,
      game_state: JSON.stringify(state)
    });
    setPhase('playing');
  };

  const handleShot = async (r, c) => {
    if (!myTurn || phase !== 'playing') return;
    if (oppGrid[r][c] === 'hit' || oppGrid[r][c] === 'miss') return;

    let state = {}; try { state = room.game_state ? JSON.parse(room.game_state) : {}; } catch {}
    const oppKey = isPlayer1 ? 'grid2' : 'grid1';
    const oppRealGrid = state[oppKey] || createEmptyGrid();

    const isHit = oppRealGrid[r][c] === 'ship';
    oppRealGrid[r][c] = isHit ? 'hit' : 'miss';

    const newOppGrid = oppGrid.map(row => [...row]);
    newOppGrid[r][c] = isHit ? 'hit' : 'miss';
    setOppGrid(newOppGrid);

    const newState = { ...state, [oppKey]: oppRealGrid };
    const shipsLeft = countShipsLeft(oppRealGrid);
    const nextTurn = isPlayer1 ? room.player2_id : room.player1_id;

    if (shipsLeft === 0) {
      await base44.entities.GameRoom.update(room.id, {
        game_state: JSON.stringify(newState),
        status: 'finished',
        winner_id: currentUser.id
      });
      setPhase('finished');
      onGameEnd?.(true);
      toast.success('🏆 Wygrałeś!');
    } else {
      await base44.entities.GameRoom.update(room.id, {
        game_state: JSON.stringify(newState),
        current_turn: nextTurn
      });
      setMyTurn(false);
      toast(isHit ? '💥 Trafiony!' : '💧 Pudło!');
    }
  };

  const cellColor = (cell, isMyGrid) => {
    if (isMyGrid) {
      if (cell === 'ship') return 'bg-cyan-600/80 border-cyan-400/50';
      if (cell === 'hit') return 'bg-red-600 border-red-400';
      return 'bg-slate-800/70 border-slate-700/50';
    }
    if (cell === 'hit') return 'bg-red-600 border-red-400 cursor-default';
    if (cell === 'miss') return 'bg-blue-900/50 border-blue-700/50 cursor-default';
    return 'bg-slate-800/70 border-slate-700/50 hover:bg-purple-500/20 cursor-crosshair';
  };

  const renderGrid = (grid, isMyGrid) => (
    <div className="inline-block">
      {grid?.map((row, r) => (
        <div key={r} className="flex">
          {row.map((cell, c) => (
            <div key={c}
              onClick={() => !isMyGrid && handleShot(r, c)}
              className={`w-7 h-7 border text-xs flex items-center justify-center transition-all ${cellColor(cell, isMyGrid)}`}>
              {cell === 'hit' ? '💥' : cell === 'miss' ? '·' : ''}
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  if (!myGrid) return <div className="text-center text-slate-400 py-8">Ładowanie...</div>;

  return (
    <div className="space-y-4">
      {/* Players */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <UserAvatar user={currentUser} size="sm" />
          <div>
            <p className="text-white text-sm font-medium">{currentUser?.display_name || currentUser?.full_name}</p>
            <p className="text-slate-400 text-xs">Ty</p>
          </div>
          {phase === 'playing' && !myTurn && <Badge className="bg-slate-700 text-slate-300 text-xs">czeka</Badge>}
          {phase === 'playing' && myTurn && <Badge className="bg-purple-500 text-white text-xs animate-pulse">Twój ruch</Badge>}
        </div>
        <div className="text-slate-400 font-bold">VS</div>
        <div className="flex items-center gap-2 flex-row-reverse">
          <UserAvatar user={opponent} size="sm" />
          <div className="text-right">
            <p className="text-white text-sm font-medium">{opponent?.display_name || opponent?.full_name || 'Przeciwnik'}</p>
            <p className="text-slate-400 text-xs">Przeciwnik</p>
          </div>
          {phase === 'playing' && myTurn && <Badge className="bg-slate-700 text-slate-300 text-xs">czeka</Badge>}
          {phase === 'playing' && !myTurn && <Badge className="bg-cyan-500 text-white text-xs animate-pulse">Ruch</Badge>}
        </div>
      </div>

      {phase === 'setup' && (
        <div className="text-center space-y-3">
          <p className="text-slate-300 text-sm">Twoje statki zostały ustawione losowo.</p>
          <div className="flex justify-center">{renderGrid(myGrid, true)}</div>
          <Button onClick={startGame} className="bg-gradient-to-r from-purple-600 to-cyan-600">
            <Ship className="w-4 h-4 mr-2" /> Zacznij grę!
          </Button>
        </div>
      )}

      {phase === 'playing' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-slate-400 text-xs mb-1 text-center">Twoja plansza</p>
            <div className="flex justify-center">{renderGrid(myGrid, true)}</div>
          </div>
          <div>
            <p className="text-slate-400 text-xs mb-1 text-center">Plansza przeciwnika {myTurn ? '🎯' : ''}</p>
            <div className="flex justify-center">{renderGrid(oppGrid, false)}</div>
          </div>
        </div>
      )}

      {phase === 'finished' && (
        <div className="text-center py-4">
          <p className="text-2xl font-bold text-white mb-2">
            {room?.winner_id === currentUser?.id ? '🏆 Wygrałeś!' : '💀 Przegrałeś'}
          </p>
          <p className="text-slate-400 text-sm">Gra zakończona</p>
        </div>
      )}
    </div>
  );
}