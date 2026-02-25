import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const EMOJIS = ['🐶','🐱','🦊','🐸','🦋','🌸','🍕','⚽','🎸','🚀','💎','🔥'];
const PAIRS_COUNT = 8;
const POINTS_REWARD = 25;

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

export default function MemoryGame({ user, onClose }) {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [phase, setPhase] = useState('intro');
  const [time, setTime] = useState(0);
  const [saving, setSaving] = useState(false);
  const lockRef = useRef(false);

  useEffect(() => {
    if (phase !== 'playing') return;
    const t = setInterval(() => setTime(p => p + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (matched.length === PAIRS_COUNT * 2 && phase === 'playing') {
      finishGame();
    }
  }, [matched]);

  const startGame = () => {
    const emojis = shuffle(EMOJIS).slice(0, PAIRS_COUNT);
    const deck = shuffle([...emojis, ...emojis].map((e, i) => ({ id: i, emoji: e })));
    setCards(deck);
    setFlipped([]); setMatched([]); setMoves(0); setTime(0);
    lockRef.current = false;
    setPhase('playing');
  };

  const flip = (card) => {
    if (lockRef.current || flipped.includes(card.id) || matched.includes(card.id)) return;
    const newFlipped = [...flipped, card.id];
    setFlipped(newFlipped);
    if (newFlipped.length === 2) {
      setMoves(p => p + 1);
      lockRef.current = true;
      const [a, b] = newFlipped.map(id => cards.find(c => c.id === id));
      if (a.emoji === b.emoji) {
        setMatched(p => [...p, a.id, b.id]);
        setFlipped([]);
        lockRef.current = false;
      } else {
        setTimeout(() => { setFlipped([]); lockRef.current = false; }, 900);
      }
    }
  };

  const finishGame = async () => {
    setPhase('result');
    setSaving(true);
    await base44.auth.updateMe({ points_balance: (user.points_balance || 0) + POINTS_REWARD });
    toast.success(`+${POINTS_REWARD} punktów za Memory!`);
    setSaving(false);
  };

  const fmtTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  if (phase === 'intro') return (
    <div className="text-center py-8 space-y-6">
      <div className="text-6xl">🃏</div>
      <div>
        <h3 className="text-2xl font-bold text-white mb-2">Memory — Pary kart</h3>
        <p className="text-slate-400">{PAIRS_COUNT} par • Nagroda: {POINTS_REWARD} pkt za ukończenie</p>
      </div>
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={onClose} className="border-slate-600 text-slate-300 bg-transparent">Wróć</Button>
        <Button onClick={startGame} className="bg-gradient-to-r from-purple-600 to-cyan-600 px-8">Graj!</Button>
      </div>
    </div>
  );

  if (phase === 'result') return (
    <div className="text-center py-8 space-y-6">
      <div className="text-6xl">🎉</div>
      <div>
        <h3 className="text-2xl font-bold text-white mb-2">Gratulacje!</h3>
        <p className="text-slate-400">Czas: <span className="text-cyan-400 font-bold">{fmtTime(time)}</span> • Ruchy: <span className="text-purple-400 font-bold">{moves}</span></p>
        <p className="text-yellow-400 font-bold mt-1">+{POINTS_REWARD} punktów!</p>
      </div>
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={onClose} className="border-slate-600 text-slate-300 bg-transparent">Wróć</Button>
        <Button onClick={startGame} className="bg-gradient-to-r from-purple-600 to-cyan-600">
          <RefreshCw className="w-4 h-4 mr-2" /> Jeszcze raz
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge className="bg-purple-500/20 text-purple-400">Pary: {matched.length / 2}/{PAIRS_COUNT}</Badge>
        <span className="text-slate-400 font-mono text-sm">{fmtTime(time)}</span>
        <Badge className="bg-cyan-500/20 text-cyan-400">Ruchy: {moves}</Badge>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {cards.map(card => {
          const isFlipped = flipped.includes(card.id) || matched.includes(card.id);
          const isMatched = matched.includes(card.id);
          return (
            <motion.button key={card.id}
              onClick={() => flip(card)}
              whileHover={{ scale: isFlipped ? 1 : 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`h-14 sm:h-16 rounded-xl border text-2xl transition-all ${
                isMatched ? 'border-emerald-500/50 bg-emerald-500/10 cursor-default' :
                isFlipped ? 'border-purple-500/50 bg-purple-500/20' :
                'border-slate-600 bg-slate-800/60 hover:border-purple-500/40 cursor-pointer'
              }`}>
              <AnimatePresence mode="wait">
                {isFlipped ? (
                  <motion.span key="emoji" initial={{ rotateY: 90 }} animate={{ rotateY: 0 }} className="text-xl">
                    {card.emoji}
                  </motion.span>
                ) : (
                  <motion.span key="back" className="text-slate-600 text-lg">?</motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}