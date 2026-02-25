import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const PRIZES = [
  { label: '5 pkt', points: 5, prob: 0.35, color: 'from-slate-600 to-slate-700' },
  { label: '10 pkt', points: 10, prob: 0.30, color: 'from-blue-600 to-blue-700' },
  { label: '25 pkt', points: 25, prob: 0.18, color: 'from-purple-600 to-purple-700' },
  { label: '50 pkt', points: 50, prob: 0.10, color: 'from-amber-600 to-amber-700' },
  { label: '100 pkt', points: 100, prob: 0.05, color: 'from-emerald-600 to-emerald-700' },
  { label: '💎 JACKPOT 500', points: 500, prob: 0.02, color: 'from-pink-600 to-red-600' },
];

function pickPrize() {
  const r = Math.random();
  let acc = 0;
  for (const prize of PRIZES) { acc += prize.prob; if (r < acc) return prize; }
  return PRIZES[0];
}

function generateTicket() {
  const win = pickPrize();
  const others = PRIZES.filter(p => p !== win);
  const cells = [win, win, win, ...Array.from({length:6},()=>others[Math.floor(Math.random()*others.length)])];
  return cells.sort(() => Math.random() - 0.5);
}

export default function ScratchCard({ user, onClose }) {
  const [phase, setPhase] = useState('intro'); // intro scratch result
  const [cells, setCells] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [prize, setPrize] = useState(null);
  const [saving, setSaving] = useState(false);

  const start = () => {
    const ticket = generateTicket();
    setCells(ticket);
    setRevealed([]);
    setPrize(null);
    setPhase('scratch');
  };

  const scratch = async (idx) => {
    if (revealed.includes(idx)) return;
    const next = [...revealed, idx];
    setRevealed(next);
    if (next.length === 9) {
      // count matches to find prize
      const counts = {};
      cells.forEach(c => { counts[c.label] = (counts[c.label]||0)+1; });
      const won = Object.entries(counts).find(([,cnt])=>cnt>=3);
      const winPrize = won ? PRIZES.find(p=>p.label===won[0]) : null;
      setPrize(winPrize);
      setPhase('result');
      if (winPrize) {
        setSaving(true);
        await base44.auth.updateMe({ points_balance: (user.points_balance || 0) + winPrize.points });
        toast.success(`🎰 Wygrałeś ${winPrize.label}!`);
        setSaving(false);
      } else {
        toast('Tym razem bez wygranej. Spróbuj ponownie!');
      }
    }
  };

  if (phase === 'intro') return (
    <div className="text-center py-8 space-y-6">
      <div className="text-6xl">🎰</div>
      <div>
        <h3 className="text-2xl font-bold text-white mb-2">Zdrapka</h3>
        <p className="text-slate-400">Odkryj 9 pól — 3 takie same to wygrana!</p>
        <div className="mt-3 flex flex-wrap gap-2 justify-center">
          {PRIZES.map((p,i) => (
            <span key={i} className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${p.color} text-white`}>{p.label}</span>
          ))}
        </div>
      </div>
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={onClose} className="border-slate-600 text-slate-300 bg-transparent">Wróć</Button>
        <Button onClick={start} className="bg-gradient-to-r from-purple-600 to-cyan-600 px-8">Zdrap!</Button>
      </div>
    </div>
  );

  if (phase === 'result') return (
    <div className="text-center py-6 space-y-6">
      <div className="text-6xl">{prize ? '🎉' : '😔'}</div>
      <div>
        <h3 className="text-2xl font-bold text-white mb-2">{prize ? `Wygrałeś ${prize.label}!` : 'Brak wygranej'}</h3>
        {prize && <p className="text-yellow-400 font-bold">+{prize.points} punktów zostało dodane!</p>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {cells.map((c, i) => (
          <div key={i} className={`h-14 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center`}>
            <span className="text-white font-bold text-sm">{c.label}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={onClose} className="border-slate-600 text-slate-300 bg-transparent">Wróć</Button>
        <Button onClick={start} className="bg-gradient-to-r from-purple-600 to-cyan-600">
          <RefreshCw className="w-4 h-4 mr-2" /> Nowa zdrapka
        </Button>
      </div>
    </div>
  );

  // Scratch phase
  return (
    <div className="space-y-4">
      <p className="text-center text-slate-400 text-sm">Kliknij pola aby je odsłonić ({revealed.length}/9)</p>
      <div className="grid grid-cols-3 gap-2">
        {cells.map((c, i) => (
          <motion.button key={i} onClick={() => scratch(i)}
            whileHover={!revealed.includes(i) ? { scale: 1.05 } : {}}
            whileTap={!revealed.includes(i) ? { scale: 0.95 } : {}}
            className={`h-16 rounded-xl border transition-all overflow-hidden ${
              revealed.includes(i)
                ? `bg-gradient-to-br ${c.color} border-transparent`
                : 'bg-slate-700 border-slate-600 hover:border-purple-500/50 cursor-pointer'
            }`}>
            <AnimatePresence mode="wait">
              {revealed.includes(i) ? (
                <motion.span key="prize" initial={{opacity:0,scale:0.5}} animate={{opacity:1,scale:1}}
                  className="text-white font-bold text-sm block">
                  {c.label}
                </motion.span>
              ) : (
                <motion.span key="hidden" className="text-3xl block">🪙</motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>
    </div>
  );
}