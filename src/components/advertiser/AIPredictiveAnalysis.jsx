import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, Loader2, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle, XCircle, Eye, MousePointer, Clock, Sparkles,
  BarChart3, PieChart, Activity
} from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

export default function AIPredictiveAnalysis({ creativeData, onOptimize }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const analyzeCreative = async () => {
    if (!creativeData) {
      toast.error('Brak danych kreacji do analizy');
      return;
    }

    setAnalyzing(true);

    // Analiza AI kreacji
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Jako ekspert od reklam online, przeanalizuj kreację reklamową i przewidź jej skuteczność.

DANE KREACJI:
- Nagłówek: ${creativeData.headline || 'brak'}
- Opis: ${creativeData.description || 'brak'}
- CTA: ${creativeData.cta || 'brak'}
- Typ kampanii: ${creativeData.campaignType || 'PTC'}
- Kategoria: ${creativeData.category || 'ogólna'}
- Ma obrazek: ${creativeData.hasImage ? 'tak' : 'nie'}

Oceń następujące aspekty w skali 0-100:
1. Siła nagłówka (headline_score)
2. Przekonujący opis (description_score)
3. Skuteczność CTA (cta_score)
4. Spójność przekazu (coherence_score)
5. Potencjał wirusowy (viral_score)
6. Wiarygodność (trust_score)

Dodatkowo podaj:
- Przewidywany CTR (predicted_ctr) jako liczba %
- Główne problemy (issues) jako tablica stringów
- Sugestie ulepszeń (improvements) jako tablica stringów
- Ogólna ocena (overall_rating) jako liczba 1-10
- Krótkie podsumowanie (summary)`,
      response_json_schema: {
        type: "object",
        properties: {
          headline_score: { type: "number" },
          description_score: { type: "number" },
          cta_score: { type: "number" },
          coherence_score: { type: "number" },
          viral_score: { type: "number" },
          trust_score: { type: "number" },
          predicted_ctr: { type: "number" },
          issues: { type: "array", items: { type: "string" } },
          improvements: { type: "array", items: { type: "string" } },
          overall_rating: { type: "number" },
          summary: { type: "string" }
        }
      }
    });

    setAnalysis(result);
    setAnalyzing(false);
    toast.success('Analiza zakończona!');
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const radarData = analysis ? [
    { subject: 'Nagłówek', score: analysis.headline_score, fullMark: 100 },
    { subject: 'Opis', score: analysis.description_score, fullMark: 100 },
    { subject: 'CTA', score: analysis.cta_score, fullMark: 100 },
    { subject: 'Spójność', score: analysis.coherence_score, fullMark: 100 },
    { subject: 'Wirusowość', score: analysis.viral_score, fullMark: 100 },
    { subject: 'Zaufanie', score: analysis.trust_score, fullMark: 100 },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Creative Preview */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <Eye className="w-5 h-5 text-cyan-400" />
            Podgląd kreacji
          </CardTitle>
        </CardHeader>
        <CardContent>
          {creativeData ? (
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <h3 className="text-xl font-bold text-white mb-2">{creativeData.headline || 'Brak nagłówka'}</h3>
              <p className="text-slate-300 mb-3">{creativeData.description || 'Brak opisu'}</p>
              {creativeData.cta && (
                <Badge className="bg-purple-500">{creativeData.cta}</Badge>
              )}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-8">
              Uzupełnij dane kreacji w innych zakładkach, aby przeprowadzić analizę
            </p>
          )}
          
          <Button 
            onClick={analyzeCreative} 
            disabled={analyzing || !creativeData}
            className="w-full mt-4 bg-gradient-to-r from-purple-600 to-cyan-600"
          >
            {analyzing ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Analizowanie...</>
            ) : (
              <><Brain className="w-4 h-4 mr-2" /> Analizuj skuteczność AI</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <>
          {/* Overall Score */}
          <Card className={`border-2 ${
            analysis.overall_rating >= 7 ? 'border-emerald-500/50 bg-emerald-500/10' :
            analysis.overall_rating >= 5 ? 'border-yellow-500/50 bg-yellow-500/10' :
            'border-red-500/50 bg-red-500/10'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Ogólna ocena kreacji</p>
                  <div className="flex items-center gap-3">
                    <p className="text-5xl font-bold text-white">{analysis.overall_rating}</p>
                    <span className="text-2xl text-slate-400">/10</span>
                  </div>
                  <p className="text-slate-300 mt-2">{analysis.summary}</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-400 text-sm">Przewidywany CTR</p>
                  <p className={`text-3xl font-bold ${getScoreColor(analysis.predicted_ctr * 10)}`}>
                    {analysis.predicted_ctr.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Radar Chart */}
          <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
            <CardHeader className="pb-0">
              <CardTitle className="text-white flex items-center gap-2">
                <PieChart className="w-5 h-5 text-pink-400" />
                Analiza wielowymiarowa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#4a5568" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b' }} />
                    <Radar
                      name="Wynik"
                      dataKey="score"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.5}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Scores */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Nagłówek', score: analysis.headline_score, icon: Sparkles },
              { label: 'Opis', score: analysis.description_score, icon: BarChart3 },
              { label: 'CTA', score: analysis.cta_score, icon: MousePointer },
              { label: 'Spójność', score: analysis.coherence_score, icon: Activity },
              { label: 'Wirusowość', score: analysis.viral_score, icon: TrendingUp },
              { label: 'Zaufanie', score: analysis.trust_score, icon: CheckCircle },
            ].map((item, i) => (
              <Card key={i} className="bg-[#1a1a2e]/50 border-purple-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <item.icon className={`w-4 h-4 ${getScoreColor(item.score)}`} />
                    <span className="text-slate-400 text-sm">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${getScoreColor(item.score)}`}>{item.score}</span>
                    <span className="text-slate-500">/100</span>
                  </div>
                  <Progress value={item.score} className="mt-2 h-1.5" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Issues */}
          {analysis.issues?.length > 0 && (
            <Card className="bg-red-500/10 border-red-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-red-400 flex items-center gap-2 text-base">
                  <AlertTriangle className="w-5 h-5" />
                  Zidentyfikowane problemy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.issues.map((issue, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-red-500/10 rounded-lg">
                      <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                      <span className="text-red-300 text-sm">{issue}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Improvements */}
          {analysis.improvements?.length > 0 && (
            <Card className="bg-emerald-500/10 border-emerald-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-emerald-400 flex items-center gap-2 text-base">
                  <Sparkles className="w-5 h-5" />
                  Sugestie ulepszeń
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.improvements.map((improvement, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-emerald-500/10 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <span className="text-emerald-300 text-sm">{improvement}</span>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-4 border-emerald-500/30 text-emerald-400"
                  onClick={() => onOptimize?.(analysis.improvements)}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Zastosuj sugestie automatycznie
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}