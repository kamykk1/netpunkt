import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const COLS = 20, ROWS = 15, CELL = 20;
const DIR = { ArrowUp: [0,-1], ArrowDown: [0,1], ArrowLeft: [-1,0], ArrowRight: [1,0] };
const SPEED = 120;

function rnd(arr) { return arr[Math.floor(Math.random()*arr.length)]; }
function freeCell(snake) {
  while(true) {
    const c = { x: Math.floor(Math.random()*COLS), y: Math.floor(Math.random()*ROWS) };
    if (!snake.some(s => s.x===c.x && s.y===c.y)) return c;
  }
}

export default function SnakeGame({ user, onClose }) {
  const qc = useQueryClient();
  const [phase, setPhase] = useState('intro');
  const [snake, setSnake] = useState([{x:10,y:7}]);
  const [food, setFood] = useState({x:15,y:7});
  const [dir, setDir] = useState([1,0]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const dirRef = useRef([1,0]);
  const phaseRef = useRef('intro');
  const snakeRef = useRef([{x:10,y:7}]);
  const foodRef = useRef({x:15,y:7});
  const scoreRef = useRef(0);

  useEffect(() => { phaseRef.current = phase; }, [phase]);

  useEffect(() => {
    const handler = (e) => {
      if (!DIR[e.key]) return;
      e.preventDefault();
      const [dx, dy] = DIR[e.key];
      const [cx, cy] = dirRef.current;
      if (dx === -cx && dy === -cy) return; // no reverse
      dirRef.current = [dx, dy];
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (phase !== 'playing') return;
    const interval = setInterval(() => {
      const newSnake = [...snakeRef.current];
      const head = newSnake[0];
      const [dx, dy] = dirRef.current;
      const next = { x: head.x + dx, y: head.y + dy };
      if (next.x < 0 || next.x >= COLS || next.y < 0 || next.y >= ROWS || newSnake.some(s=>s.x===next.x&&s.y===next.y)) {
        phaseRef.current = 'lost';
        setPhase('lost');
        const finalScore = scoreRef.current;
        const pts = Math.floor(finalScore / 5);
        Promise.all([
          pts > 0 ? base44.auth.updateMe({ points_balance: (user.points_balance || 0) + pts, snake_best_score: Math.max(user.snake_best_score || 0, finalScore) }) : base44.auth.updateMe({ snake_best_score: Math.max(user.snake_best_score || 0, finalScore) }),
          base44.entities.GameScore.create({ user_id: user.id, user_email: user.email, user_name: user.full_name || user.email?.split('@')[0], game_type: 'snake', score: finalScore })
        ]).then(() => { qc.invalidateQueries({ queryKey: ['gameScores'] }); qc.invalidateQueries({ queryKey: ['currentUser'] }); });
        if (pts > 0) toast.success(`+${pts} punktów za Snake!`);
        return;
      }
      newSnake.unshift(next);
      if (next.x === foodRef.current.x && next.y === foodRef.current.y) {
        const newFood = freeCell(newSnake);
        foodRef.current = newFood;
        setFood(newFood);
        scoreRef.current += 10;
        setScore(p => p + 10);
      } else {
        newSnake.pop();
      }
      snakeRef.current = newSnake;
      setSnake([...newSnake]);
    }, SPEED);
    return () => clearInterval(interval);
  }, [phase]);

  const startGame = () => {
    const initSnake = [{x:10,y:7}];
    const initFood = freeCell(initSnake);
    snakeRef.current = initSnake;
    foodRef.current = initFood;
    dirRef.current = [1,0];
    scoreRef.current = 0;
    setSnake(initSnake); setFood(initFood); setDir([1,0]); setScore(0);
    setPhase('playing');
  };

  const handleSwipe = useCallback((dx, dy) => {
    const [cx, cy] = dirRef.current;
    if (dx === -cx && dy === -cy) return;
    dirRef.current = [dx, dy];
  }, []);

  if (phase === 'intro') return (
    <div className="text-center py-8 space-y-6">
      <div className="text-6xl">🐍</div>
      <div>
        <h3 className="text-2xl font-bold text-white mb-2">Snake</h3>
        <p className="text-slate-400">Użyj strzałek • 10 pkt za jedzenie • nagroda punktowa = wynik÷5</p>
      </div>
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={onClose} className="border-slate-600 text-slate-300 bg-transparent">Wróć</Button>
        <Button onClick={startGame} className="bg-gradient-to-r from-purple-600 to-cyan-600 px-8">Graj!</Button>
      </div>
    </div>
  );

  const won = phase === 'lost';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge className="bg-emerald-500/20 text-emerald-400">🍎 {score}</Badge>
        {phase === 'lost' && <span className="text-red-400 font-bold text-sm">Koniec! +{Math.floor(score/5)} pkt</span>}
        <Badge className="bg-purple-500/20 text-purple-400">Długość: {snake.length}</Badge>
      </div>
      <div className="overflow-x-auto flex justify-center">
        <div className="relative bg-slate-900 border border-slate-700 rounded-lg"
          style={{ width: COLS*CELL, height: ROWS*CELL }}>
          {/* Food */}
          <div className="absolute text-base flex items-center justify-center"
            style={{ left: food.x*CELL, top: food.y*CELL, width: CELL, height: CELL }}>🍎</div>
          {/* Snake */}
          {snake.map((s, i) => (
            <div key={i} className={`absolute rounded-sm ${i===0?'bg-emerald-400':'bg-emerald-600'}`}
              style={{ left: s.x*CELL+1, top: s.y*CELL+1, width: CELL-2, height: CELL-2 }} />
          ))}
          {phase === 'lost' && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
              <p className="text-white font-bold text-xl">💀 Game Over</p>
            </div>
          )}
        </div>
      </div>
      {/* Mobile controls */}
      <div className="grid grid-cols-3 gap-1 w-32 mx-auto">
        <div/><button className="bg-slate-700 rounded p-2 text-white text-xs" onClick={()=>handleSwipe(0,-1)}>▲</button><div/>
        <button className="bg-slate-700 rounded p-2 text-white text-xs" onClick={()=>handleSwipe(-1,0)}>◀</button>
        <button className="bg-slate-700 rounded p-2 text-white text-xs" onClick={()=>handleSwipe(0,1)}>▼</button>
        <button className="bg-slate-700 rounded p-2 text-white text-xs" onClick={()=>handleSwipe(1,0)}>▶</button>
      </div>
      <div className="flex gap-3 justify-center">
        <Button size="sm" onClick={startGame} className="bg-gradient-to-r from-purple-600 to-cyan-600">
          <RefreshCw className="w-3 h-3 mr-1" /> {phase==='lost'?'Zagraj ponownie':'Restart'}
        </Button>
        <Button size="sm" variant="outline" onClick={onClose} className="border-slate-600 text-slate-400 bg-transparent">Wróć</Button>
      </div>
    </div>
  );
}