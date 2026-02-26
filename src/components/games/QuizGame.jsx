import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Trophy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const QUESTIONS = [
  { q: 'Jaka jest stolica Francji?', a: ['Paryż', 'Londyn', 'Berlin', 'Madryt'], correct: 0 },
  { q: 'Ile wynosi pierwiastek kwadratowy z 144?', a: ['10', '11', '12', '13'], correct: 2 },
  { q: 'Który pierwiastek ma symbol Au?', a: ['Srebro', 'Złoto', 'Miedź', 'Platyna'], correct: 1 },
  { q: 'W którym roku człowiek po raz pierwszy wylądował na Księżycu?', a: ['1965', '1967', '1969', '1971'], correct: 2 },
  { q: 'Ile kontynentów ma Ziemia?', a: ['5', '6', '7', '8'], correct: 2 },
  { q: 'Który ocean jest największy?', a: ['Atlantycki', 'Indyjski', 'Arktyczny', 'Spokojny'], correct: 3 },
  { q: 'Kto napisał "Pan Tadeusz"?', a: ['Słowacki', 'Mickiewicz', 'Norwid', 'Krasicki'], correct: 1 },
  { q: 'Ile nóg ma pająk?', a: ['6', '8', '10', '12'], correct: 1 },
  { q: 'Jaki gaz oddychamy?', a: ['CO2', 'N2', 'O2', 'H2'], correct: 2 },
  { q: 'Która planeta jest najbliżej Słońca?', a: ['Wenus', 'Ziemia', 'Mars', 'Merkury'], correct: 3 },
  { q: 'Ile cm ma 1 metr?', a: ['10', '100', '1000', '10000'], correct: 1 },
  { q: 'Jaki kolor uzyskamy mieszając niebieski i żółty?', a: ['Zielony', 'Pomarańczowy', 'Fioletowy', 'Brązowy'], correct: 0 },
  { q: 'Które zwierzę jest najszybsze na lądzie?', a: ['Lew', 'Gepard', 'Koń', 'Orzeł'], correct: 1 },
  { q: 'Ile minut ma godzina?', a: ['30', '60', '90', '120'], correct: 1 },
  { q: 'Kto napisał "Romeo i Julia"?', a: ['Szekspir', 'Dickens', 'Twain', 'Poe'], correct: 0 },
];

const TOTAL_QUESTIONS = 5;
const TIME_PER_QUESTION = 15;
const POINTS_PER_CORRECT = 10;

export default function QuizGame({ user, onClose }) {
  const [phase, setPhase] = useState('intro'); // intro | playing | result
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [answered, setAnswered] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (phase !== 'playing' || answered) return;
    if (timeLeft <= 0) { handleAnswer(-1); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, answered]);

  const startGame = () => {
    const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, TOTAL_QUESTIONS);
    setQuestions(shuffled);
    setCurrent(0); setScore(0); setSelected(null); setAnswered(false);
    setTimeLeft(TIME_PER_QUESTION);
    setPhase('playing');
  };

  const handleAnswer = async (idx) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const isCorrect = idx === questions[current].correct;
    if (isCorrect) setScore(p => p + 1);
    await new Promise(r => setTimeout(r, 1200));
    if (current + 1 < TOTAL_QUESTIONS) {
      setCurrent(p => p + 1);
      setSelected(null); setAnswered(false); setTimeLeft(TIME_PER_QUESTION);
    } else {
      finishGame(isCorrect ? score + 1 : score);
    }
  };

  const finishGame = async (finalScore) => {
    setPhase('result');
    setSaving(true);
    const pts = finalScore * POINTS_PER_CORRECT;
    if (pts > 0) {
      await base44.auth.updateMe({ points_balance: (user.points_balance || 0) + pts });
      toast.success(`+${pts} punktów za quiz!`);
    }
    setSaving(false);
  };

  if (phase === 'intro') return (
    <div className="text-center py-8 space-y-6">
      <div className="text-6xl">🧠</div>
      <div>
        <h3 className="text-2xl font-bold text-white mb-2">Quiz wiedzy</h3>
        <p className="text-slate-400">{TOTAL_QUESTIONS} pytań • {TIME_PER_QUESTION}s na pytanie • {POINTS_PER_CORRECT} pkt za odpowiedź</p>
      </div>
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={onClose} className="border-slate-600 text-slate-300 bg-transparent">Wróć</Button>
        <Button onClick={startGame} className="bg-gradient-to-r from-purple-600 to-cyan-600 px-8">Rozpocznij!</Button>
      </div>
    </div>
  );

  if (phase === 'result') return (
    <div className="text-center py-8 space-y-6">
      <div className="text-6xl">{score >= 4 ? '🏆' : score >= 2 ? '😊' : '😅'}</div>
      <div>
        <h3 className="text-2xl font-bold text-white mb-2">Wynik: {score}/{TOTAL_QUESTIONS}</h3>
        <p className="text-slate-400">Zdobyłeś <span className="text-yellow-400 font-bold">{score * POINTS_PER_CORRECT}</span> punktów</p>
      </div>
      {saving && <Loader2 className="w-5 h-5 animate-spin text-purple-400 mx-auto" />}
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={onClose} className="border-slate-600 text-slate-300 bg-transparent">Wróć</Button>
        <Button onClick={startGame} className="bg-gradient-to-r from-purple-600 to-cyan-600">
          <RefreshCw className="w-4 h-4 mr-2" /> Zagraj ponownie
        </Button>
      </div>
    </div>
  );

  const q = questions[current];
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Badge className="bg-purple-500/20 text-purple-400">Pytanie {current + 1}/{TOTAL_QUESTIONS}</Badge>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full font-bold text-sm ${timeLeft <= 5 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-slate-700 text-white'}`}>
          ⏱ {timeLeft}s
        </div>
        <Badge className="bg-yellow-500/20 text-yellow-400">✓ {score}</Badge>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-1.5">
        <div className="bg-gradient-to-r from-purple-600 to-cyan-600 h-1.5 rounded-full transition-all"
          style={{ width: `${(timeLeft / TIME_PER_QUESTION) * 100}%` }} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={current} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
          <h3 className="text-white text-lg font-semibold mb-4 text-center">{q.q}</h3>
          <div className="grid grid-cols-2 gap-3">
            {q.a.map((ans, idx) => {
              let cls = 'border-slate-600 text-slate-300 bg-slate-800/50 hover:border-purple-500/60 hover:bg-purple-500/10';
              if (answered) {
                if (idx === q.correct) cls = 'border-emerald-500 bg-emerald-500/20 text-emerald-300';
                else if (idx === selected) cls = 'border-red-500 bg-red-500/20 text-red-300';
                else cls = 'border-slate-700 text-slate-500 bg-slate-800/30';
              }
              return (
                <button key={idx} disabled={answered}
                  onClick={() => handleAnswer(idx)}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all text-left ${cls}`}>
                  <span className="mr-2 font-bold text-xs opacity-60">{String.fromCharCode(65 + idx)}.</span>
                  {ans}
                  {answered && idx === q.correct && <CheckCircle className="w-4 h-4 inline ml-2 text-emerald-400" />}
                  {answered && idx === selected && idx !== q.correct && <XCircle className="w-4 h-4 inline ml-2 text-red-400" />}
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}