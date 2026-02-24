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
      prompt: `Jesteś ekspertem analitycznym AI specjalizującym się w reklamach cyfrowych i wykrywaniu fraudów. Przeprowadź SZCZEGÓŁOWĄ analizę predykcyjną kreacji reklamowej.

DANE KREACJI:
- Nagłówek: ${creativeData.headline || 'brak'}
- Opis: ${creativeData.description || 'brak'}
- CTA: ${creativeData.cta || 'brak'}
- Typ kampanii: ${creativeData.campaignType || 'PTC'}
- Kategoria: ${creativeData.category || 'ogólna'}
- Ma obrazek: ${creativeData.hasImage ? 'tak' : 'nie'}

WYMAGANE OCENY (0-100):
1. headline_score - siła nagłówka
2. description_score - jakość opisu
3. cta_score - skuteczność CTA
4. coherence_score - spójność przekazu
5. viral_score - potencjał viralowy
6. trust_score - wiarygodność

ANALIZA FRAUDU (SZCZEGÓŁOWA):
- fraud_risk_score: 0-100 (ryzyko clickfraud i bot traffic)
- fraud_indicators: lista konkretnych sygnałów ryzyka fraudu dla tej kreacji
- anti_fraud_tips: konkretne sposoby minimalizacji ryzyka

PROGNOZY WYDAJNOŚCI:
- predicted_ctr: % CTR
- predicted_conversion_rate: % współczynnik konwersji  
- predicted_roi: % zwrot z inwestycji
- performance_forecast: "słaby" | "przeciętny" | "dobry" | "świetny"
- best_time_to_run: najlepsze pory emisji (string np. "9-11, 18-21")

PROBLEMY I ULEPSZENIA:
- issues: lista 3-5 problemów z uzasadnieniem
- improvements: lista 5 konkretnych ulepszeń z przykładami zmian
- ab_test_suggestion: co przetestować A/B (string)
- overall_rating: 1-10
- summary: 3-zdaniowe podsumowanie z prognozą`,
      response_json_schema: {
        type: "object",
        properties: {
          headline_score: { type: "number" },
          description_score: { type: "number" },
          cta_score: { type: "number" },
          coherence_score: { type: "number" },
          viral_score: { type: "number" },
          trust_score: { type: "number" },
          fraud_risk_score: { type: "number" },
          fraud_indicators: { type: "array", items: { type: "string" } },
          anti_fraud_tips: { type: "array", items: { type: "string" } },
          predicted_ctr: { type: "number" },
          predicted_conversion_rate: { type: "number" },
          predicted_roi: { type: "number" },
          performance_forecast: { type: "string" },
          best_time_to_run: { type: "string" },
          issues: { type: "array", items: { type: "string" } },
          improvements: { type: "array", items: { type: "string" } },
          ab_test_suggestion: { type: "string" },
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
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <p className="text-slate-400 text-sm">Ogólna ocena kreacji</p>
                  <div className="flex items-center gap-3">
                    <p className="text-5xl font-bold text-white">{analysis.overall_rating}</p>
                    <div>
                      <span className="text-2xl text-slate-400">/10</span>
                      {analysis.performance_forecast && (
                        <Badge className="ml-2 bg-purple-500/30 text-purple-300">{analysis.performance_forecast}</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-slate-300 mt-2 text-sm">{analysis.summary}</p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-slate-400 text-xs">CTR</p>
                    <p className={`text-2xl font-bold ${getScoreColor(analysis.predicted_ctr * 10)}`}>
                      {analysis.predicted_ctr?.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Konwersje</p>
                    <p className="text-2xl font-bold text-cyan-400">
                      {analysis.predicted_conversion_rate?.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">ROI</p>
                    <p className={`text-2xl font-bold ${(analysis.predicted_roi || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {(analysis.predicted_roi || 0) >= 0 ? '+' : ''}{analysis.predicted_roi?.toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
              {analysis.best_time_to_run && (
                <div className="mt-4 p-2 bg-slate-800/50 rounded-lg flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-300 text-sm">Najlepsze godziny emisji: <strong className="text-white">{analysis.best_time_to_run}</strong></span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fraud Risk */}
          {analysis.fraud_risk_score !== undefined && (
            <Card className={`border ${
              analysis.fraud_risk_score >= 70 ? 'border-red-500/50 bg-red-500/10' :
              analysis.fraud_risk_score >= 40 ? 'border-amber-500/50 bg-amber-500/10' :
              'border-emerald-500/30 bg-emerald-500/5'
            }`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center gap-2 text-base">
                  <AlertTriangle className={`w-5 h-5 ${
                    analysis.fraud_risk_score >= 70 ? 'text-red-400' :
                    analysis.fraud_risk_score >= 40 ? 'text-amber-400' : 'text-emerald-400'
                  }`} />
                  Analiza ryzyka fraudu
                  <Badge className={
                    analysis.fraud_risk_score >= 70 ? 'bg-red-500' :
                    analysis.fraud_risk_score >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
                  }>
                    Ryzyko: {analysis.fraud_risk_score}/100
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={analysis.fraud_risk_score} className="h-2 mb-4" />
                {analysis.fraud_indicators?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-slate-400 text-xs mb-2">Sygnały ryzyka:</p>
                    <div className="space-y-1">
                      {analysis.fraud_indicators.map((ind, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <XCircle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />
                          <span className="text-slate-300">{ind}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {analysis.anti_fraud_tips?.length > 0 && (
                  <div>
                    <p className="text-slate-400 text-xs mb-2">Jak minimalizować ryzyko:</p>
                    <div className="space-y-1">
                      {analysis.anti_fraud_tips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                          <span className="text-slate-300">{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* A/B Test Suggestion */}
          {analysis.ab_test_suggestion && (
            <Card className="bg-purple-500/10 border-purple-500/30">
              <CardContent className="p-4 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-purple-300 font-medium text-sm">💡 Sugestia A/B testu</p>
                  <p className="text-slate-300 text-sm mt-1">{analysis.ab_test_suggestion}</p>
                </div>
              </CardContent>
            </Card>
          )}

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