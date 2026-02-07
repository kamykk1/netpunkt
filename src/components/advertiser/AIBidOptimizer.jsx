import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, Loader2, Zap, Target, DollarSign,
  ArrowUp, ArrowDown, Minus, BarChart3, Lightbulb,
  CheckCircle, AlertTriangle
} from 'lucide-react';

const CAMPAIGN_TYPES = [
  { id: 'ptc', label: 'PTC (Pay-To-Click)', avgCpc: 0.05, avgCtr: 2.5 },
  { id: 'ptr', label: 'PTR (Pay-To-Read)', avgCpc: 0.08, avgCtr: 4.2 },
  { id: 'ptv', label: 'PTV (Pay-To-View)', avgCpv: 0.12, avgCtr: 6.8 },
  { id: 'banner', label: 'Banner', avgCpm: 2.50, avgCtr: 0.8 },
];

const CATEGORIES = [
  { id: 'tech', label: 'Technologia', modifier: 1.2 },
  { id: 'finance', label: 'Finanse', modifier: 1.5 },
  { id: 'shopping', label: 'Zakupy', modifier: 1.0 },
  { id: 'gaming', label: 'Gaming', modifier: 1.3 },
  { id: 'health', label: 'Zdrowie', modifier: 1.1 },
  { id: 'entertainment', label: 'Rozrywka', modifier: 0.9 },
];

export default function AIBidOptimizer({ onApplyBid, historicalData }) {
  const [input, setInput] = useState({
    campaignType: 'ptc',
    category: 'shopping',
    targetCtr: 3.0,
    dailyBudget: 100,
    targetCountry: 'PL',
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [recommendation, setRecommendation] = useState(null);

  const analyzeBid = async () => {
    setAnalyzing(true);

    // Symulacja analizy historycznych danych
    const campaignConfig = CAMPAIGN_TYPES.find(c => c.id === input.campaignType);
    const categoryConfig = CATEGORIES.find(c => c.id === input.category);
    
    // Bazowe stawki z modyfikatorami
    const baseRate = campaignConfig.avgCpc || campaignConfig.avgCpv || (campaignConfig.avgCpm / 1000);
    const categoryModifier = categoryConfig?.modifier || 1;
    const countryModifier = input.targetCountry === 'PL' ? 0.8 : input.targetCountry === 'DE' ? 1.3 : 1.0;
    
    // Oblicz optymalne stawki
    const optimalBid = baseRate * categoryModifier * countryModifier;
    const minBid = optimalBid * 0.7;
    const maxBid = optimalBid * 1.4;
    
    // Predykcje
    const estimatedCtr = (campaignConfig.avgCtr || 2.0) * (optimalBid / baseRate);
    const estimatedImpressions = Math.round(input.dailyBudget / optimalBid);
    const estimatedClicks = Math.round(estimatedImpressions * (estimatedCtr / 100));

    // Generuj rekomendacje AI
    const aiResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Jako ekspert od optymalizacji kampanii reklamowych, przeanalizuj dane i podaj rekomendacje:

DANE KAMPANII:
- Typ: ${campaignConfig.label}
- Kategoria: ${categoryConfig.label}
- Budżet dzienny: ${input.dailyBudget} PLN
- Kraj docelowy: ${input.targetCountry}
- Docelowy CTR: ${input.targetCtr}%

OBLICZONE WARTOŚCI:
- Optymalna stawka: ${optimalBid.toFixed(3)} PLN
- Szacowany CTR: ${estimatedCtr.toFixed(1)}%
- Szacowane wyświetlenia: ${estimatedImpressions}

Podaj 3-4 konkretne wskazówki optymalizacyjne i ocenę potencjału kampanii (1-10).`,
      response_json_schema: {
        type: "object",
        properties: {
          tips: { type: "array", items: { type: "string" } },
          potentialScore: { type: "number" },
          riskLevel: { type: "string" },
          summary: { type: "string" }
        }
      }
    });

    setRecommendation({
      optimalBid: optimalBid,
      minBid: minBid,
      maxBid: maxBid,
      estimatedCtr: estimatedCtr,
      estimatedImpressions: estimatedImpressions,
      estimatedClicks: estimatedClicks,
      estimatedCost: optimalBid * estimatedClicks,
      ...aiResult
    });

    setAnalyzing(false);
    toast.success('Analiza zakończona!');
  };

  const getBidTrend = () => {
    if (!recommendation) return null;
    const avgMarket = CAMPAIGN_TYPES.find(c => c.id === input.campaignType)?.avgCpc || 0.05;
    if (recommendation.optimalBid > avgMarket * 1.1) return { icon: ArrowUp, color: 'text-red-400', label: 'Powyżej średniej' };
    if (recommendation.optimalBid < avgMarket * 0.9) return { icon: ArrowDown, color: 'text-green-400', label: 'Poniżej średniej' };
    return { icon: Minus, color: 'text-yellow-400', label: 'W normie' };
  };

  const trend = getBidTrend();

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" />
            Parametry kampanii
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Typ kampanii</Label>
              <Select value={input.campaignType} onValueChange={(v) => setInput({...input, campaignType: v})}>
                <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-purple-500/30">
                  {CAMPAIGN_TYPES.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Kategoria</Label>
              <Select value={input.category} onValueChange={(v) => setInput({...input, category: v})}>
                <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-purple-500/30">
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Budżet dzienny (PLN)</Label>
              <Input
                type="number"
                value={input.dailyBudget}
                onChange={(e) => setInput({...input, dailyBudget: parseFloat(e.target.value) || 0})}
                className="bg-slate-800 border-purple-500/30 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Docelowy CTR (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={input.targetCtr}
                onChange={(e) => setInput({...input, targetCtr: parseFloat(e.target.value) || 0})}
                className="bg-slate-800 border-purple-500/30 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Kraj docelowy</Label>
              <Select value={input.targetCountry} onValueChange={(v) => setInput({...input, targetCountry: v})}>
                <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-purple-500/30">
                  <SelectItem value="PL">🇵🇱 Polska</SelectItem>
                  <SelectItem value="DE">🇩🇪 Niemcy</SelectItem>
                  <SelectItem value="GB">🇬🇧 UK</SelectItem>
                  <SelectItem value="US">🇺🇸 USA</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={analyzeBid} 
            disabled={analyzing}
            className="w-full bg-gradient-to-r from-purple-600 to-cyan-600"
          >
            {analyzing ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Analizowanie...</>
            ) : (
              <><Zap className="w-4 h-4 mr-2" /> Optymalizuj stawki AI</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendation && (
        <div className="space-y-4">
          {/* Optimal Bid Card */}
          <Card className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-emerald-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Optymalna stawka</p>
                  <p className="text-4xl font-bold text-white">
                    {recommendation.optimalBid.toFixed(3)} <span className="text-lg">PLN</span>
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {trend && (
                      <Badge className={`${trend.color} bg-transparent border border-current`}>
                        <trend.icon className="w-3 h-3 mr-1" />
                        {trend.label}
                      </Badge>
                    )}
                    <span className="text-slate-400 text-sm">
                      Zakres: {recommendation.minBid.toFixed(3)} - {recommendation.maxBid.toFixed(3)} PLN
                    </span>
                  </div>
                </div>
                <Button 
                  onClick={() => onApplyBid?.(recommendation.optimalBid)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Zastosuj
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Predictions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
              <CardContent className="p-4 text-center">
                <BarChart3 className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{recommendation.estimatedCtr.toFixed(1)}%</p>
                <p className="text-slate-400 text-xs">Szacowany CTR</p>
              </CardContent>
            </Card>
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
              <CardContent className="p-4 text-center">
                <Target className="w-6 h-6 text-pink-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{recommendation.estimatedImpressions.toLocaleString()}</p>
                <p className="text-slate-400 text-xs">Wyświetlenia/dzień</p>
              </CardContent>
            </Card>
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{recommendation.estimatedClicks.toLocaleString()}</p>
                <p className="text-slate-400 text-xs">Kliknięcia/dzień</p>
              </CardContent>
            </Card>
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
              <CardContent className="p-4 text-center">
                <DollarSign className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{recommendation.estimatedCost.toFixed(2)}</p>
                <p className="text-slate-400 text-xs">Koszt/dzień (PLN)</p>
              </CardContent>
            </Card>
          </div>

          {/* AI Tips */}
          <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-400" />
                  Rekomendacje AI
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm">Potencjał:</span>
                  <Badge className={`${
                    recommendation.potentialScore >= 7 ? 'bg-emerald-500' :
                    recommendation.potentialScore >= 5 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}>
                    {recommendation.potentialScore}/10
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 mb-4">{recommendation.summary}</p>
              <div className="space-y-2">
                {recommendation.tips?.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-slate-800/50 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-slate-300 text-sm">{tip}</span>
                  </div>
                ))}
              </div>
              {recommendation.riskLevel && (
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-300 text-sm">Poziom ryzyka: {recommendation.riskLevel}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}