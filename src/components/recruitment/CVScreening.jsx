import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from 'sonner';
import { Sparkles, Loader2, Star, TrendingUp, AlertCircle } from 'lucide-react';

export default function CVScreening({ offer, applications, onUpdate }) {
  const [screening, setScreening] = useState(false);
  const [results, setResults] = useState({});
  const queryClient = useQueryClient();

  const runScreening = async () => {
    if (!offer || applications.length === 0) return;
    setScreening(true);

    const offerContext = `Stanowisko: ${offer.title}, Dział: ${offer.department}, Wymagania: ${offer.requirements || 'brak'}, Opis: ${offer.description || 'brak'}`;

    const newResults = {};
    for (const app of applications) {
      const cvContent = [app.cv_text, app.cover_letter, app.keywords].filter(Boolean).join(' ');
      if (!cvContent) {
        newResults[app.id] = { score: 0, summary: 'Brak treści CV do analizy.', flags: [] };
        continue;
      }
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Jako rekruter, oceń dopasowanie kandydata do oferty pracy.
Oferta: ${offerContext}
CV kandydata: ${cvContent.slice(0, 1500)}

Zwróć ocenę w formacie JSON. Bądź zwięzły.`,
        response_json_schema: {
          type: 'object',
          properties: {
            score: { type: 'number', description: 'Ocena dopasowania 0-100' },
            summary: { type: 'string', description: 'Krótkie uzasadnienie (max 2 zdania)' },
            strengths: { type: 'array', items: { type: 'string' }, description: 'Mocne strony (max 3)' },
            flags: { type: 'array', items: { type: 'string' }, description: 'Brakujące wymagania (max 3)' },
          }
        }
      });
      newResults[app.id] = res;
      // Zapisz wynik w bazie jako rating i notatkę
      const rating = Math.max(1, Math.min(5, Math.round(res.score / 20)));
      await base44.entities.JobApplication.update(app.id, {
        rating,
        recruiter_notes: `[AI] ${res.summary} Mocne strony: ${res.strengths?.join(', ')}. Braki: ${res.flags?.join(', ')}`
      });
    }

    setResults(newResults);
    queryClient.invalidateQueries({ queryKey: ['jobApplications'] });
    toast.success(`Przeanalizowano ${applications.length} kandydatów`);
    setScreening(false);
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-emerald-400';
    if (score >= 40) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreBg = (score) => {
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const hasResults = Object.keys(results).length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-white text-sm font-medium">Analiza AI kandydatów</span>
          <span className="text-slate-500 text-xs">({applications.length} kandydatów)</span>
        </div>
        <Button
          size="sm"
          onClick={runScreening}
          disabled={screening || applications.length === 0}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-xs"
        >
          {screening ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Analizuję...</> : <><Sparkles className="w-3 h-3 mr-1" />Uruchom AI Screening</>}
        </Button>
      </div>

      {screening && (
        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 text-center text-purple-300 text-xs">
          <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
          Analizuję CV kandydatów przy użyciu AI...
        </div>
      )}

      {hasResults && (
        <div className="space-y-2">
          <p className="text-slate-400 text-xs">Wyniki dopasowania – posortowane wg wyniku:</p>
          {applications
            .filter(a => results[a.id])
            .sort((a, b) => (results[b.id]?.score || 0) - (results[a.id]?.score || 0))
            .map((app, idx) => {
              const r = results[app.id];
              return (
                <div key={app.id} className={`p-3 rounded-lg border ${idx === 0 ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-700/50 bg-slate-800/30'}`}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {idx === 0 && <Star className="w-3.5 h-3.5 text-yellow-400" />}
                      <span className="text-white text-sm font-medium">{app.candidate_name}</span>
                      {idx === 0 && <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">Top kandydat</Badge>}
                    </div>
                    <span className={`font-bold text-lg ${getScoreColor(r.score)}`}>{r.score}%</span>
                  </div>
                  <Progress value={r.score} className={`h-1.5 mb-2 [&>div]:${getScoreBg(r.score)}`} />
                  <p className="text-slate-400 text-xs mb-1">{r.summary}</p>
                  <div className="flex flex-wrap gap-1">
                    {r.strengths?.map((s, i) => <span key={i} className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs">{s}</span>)}
                    {r.flags?.map((f, i) => <span key={i} className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-xs flex items-center gap-0.5"><AlertCircle className="w-2.5 h-2.5" />{f}</span>)}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}