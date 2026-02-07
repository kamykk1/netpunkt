import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Wand2, Loader2, Copy, RefreshCw, Sparkles, 
  Type, FileText, MousePointer, Zap, Check
} from 'lucide-react';

const TONES = [
  { id: 'professional', label: 'Profesjonalny', emoji: '💼' },
  { id: 'casual', label: 'Swobodny', emoji: '😊' },
  { id: 'urgent', label: 'Pilny/FOMO', emoji: '⚡' },
  { id: 'friendly', label: 'Przyjazny', emoji: '🤝' },
  { id: 'luxurious', label: 'Luksusowy', emoji: '✨' },
];

const LANGUAGES = [
  { id: 'pl', label: 'Polski' },
  { id: 'en', label: 'English' },
  { id: 'de', label: 'Deutsch' },
];

export default function AIAdGenerator({ onApply, productData }) {
  const [input, setInput] = useState({
    productName: productData?.name || '',
    productDescription: productData?.description || '',
    targetAudience: '',
    uniqueSellingPoints: '',
    tone: 'professional',
    language: 'pl',
  });
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  const generateContent = async () => {
    if (!input.productName) {
      toast.error('Podaj nazwę produktu');
      return;
    }

    setGenerating(true);
    
    const toneLabel = TONES.find(t => t.id === input.tone)?.label || 'profesjonalny';
    
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Jesteś ekspertem od copywritingu reklamowego. Stwórz teksty reklamowe dla produktu/usługi.

DANE PRODUKTU:
- Nazwa: ${input.productName}
- Opis: ${input.productDescription || 'brak'}
- Grupa docelowa: ${input.targetAudience || 'szeroka'}
- Unikalne cechy: ${input.uniqueSellingPoints || 'brak'}

WYMAGANIA:
- Ton: ${toneLabel}
- Język: ${input.language === 'pl' ? 'polski' : input.language === 'en' ? 'angielski' : 'niemiecki'}

Wygeneruj 3 warianty każdego elementu:
1. Nagłówki (max 60 znaków każdy) - chwytliwe, przyciągające uwagę
2. Opisy (max 150 znaków każdy) - zachęcające do działania
3. CTA (max 20 znaków każdy) - motywujące do kliknięcia

Zwróć JSON z tablicami: headlines, descriptions, ctas`,
      response_json_schema: {
        type: "object",
        properties: {
          headlines: { type: "array", items: { type: "string" } },
          descriptions: { type: "array", items: { type: "string" } },
          ctas: { type: "array", items: { type: "string" } }
        }
      }
    });

    setResults(result);
    setGenerating(false);
    toast.success('Teksty wygenerowane!');
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success('Skopiowano!');
  };

  const applyText = (type, text) => {
    onApply?.({ type, text });
    toast.success(`Zastosowano ${type === 'headline' ? 'nagłówek' : type === 'description' ? 'opis' : 'CTA'}`);
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            Dane produktu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Nazwa produktu/usługi *</Label>
              <Input
                value={input.productName}
                onChange={(e) => setInput({...input, productName: e.target.value})}
                placeholder="np. Bezprzewodowe słuchawki TWS"
                className="bg-slate-800 border-purple-500/30 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Grupa docelowa</Label>
              <Input
                value={input.targetAudience}
                onChange={(e) => setInput({...input, targetAudience: e.target.value})}
                placeholder="np. młodzi profesjonaliści 25-35"
                className="bg-slate-800 border-purple-500/30 text-white"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-slate-300">Opis produktu</Label>
            <Textarea
              value={input.productDescription}
              onChange={(e) => setInput({...input, productDescription: e.target.value})}
              placeholder="Opisz produkt, jego funkcje i korzyści..."
              className="bg-slate-800 border-purple-500/30 text-white h-20"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Unikalne cechy (USP)</Label>
            <Input
              value={input.uniqueSellingPoints}
              onChange={(e) => setInput({...input, uniqueSellingPoints: e.target.value})}
              placeholder="np. 40h baterii, wodoodporność IPX5, darmowa dostawa"
              className="bg-slate-800 border-purple-500/30 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Ton komunikacji</Label>
              <Select value={input.tone} onValueChange={(v) => setInput({...input, tone: v})}>
                <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-purple-500/30">
                  {TONES.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.emoji} {t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Język</Label>
              <Select value={input.language} onValueChange={(v) => setInput({...input, language: v})}>
                <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-purple-500/30">
                  {LANGUAGES.map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={generateContent} 
            disabled={generating}
            className="w-full bg-gradient-to-r from-purple-600 to-cyan-600"
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generowanie...</>
            ) : (
              <><Wand2 className="w-4 h-4 mr-2" /> Generuj teksty AI</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <div className="space-y-4">
          {/* Headlines */}
          <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <Type className="w-4 h-4 text-cyan-400" />
                Nagłówki
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {results.headlines?.map((headline, i) => (
                <div key={i} className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg group">
                  <span className="text-white flex-1">{headline}</span>
                  <Badge variant="outline" className="text-slate-400 text-xs">
                    {headline.length}/60
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100"
                    onClick={() => copyToClipboard(headline, `h${i}`)}
                  >
                    {copiedField === `h${i}` ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="opacity-0 group-hover:opacity-100 border-purple-500/30"
                    onClick={() => applyText('headline', headline)}
                  >
                    Użyj
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Descriptions */}
          <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <FileText className="w-4 h-4 text-pink-400" />
                Opisy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {results.descriptions?.map((desc, i) => (
                <div key={i} className="flex items-start gap-2 p-3 bg-slate-800/50 rounded-lg group">
                  <span className="text-white flex-1 text-sm">{desc}</span>
                  <Badge variant="outline" className="text-slate-400 text-xs shrink-0">
                    {desc.length}/150
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 shrink-0"
                    onClick={() => copyToClipboard(desc, `d${i}`)}
                  >
                    {copiedField === `d${i}` ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="opacity-0 group-hover:opacity-100 border-purple-500/30 shrink-0"
                    onClick={() => applyText('description', desc)}
                  >
                    Użyj
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* CTAs */}
          <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <MousePointer className="w-4 h-4 text-emerald-400" />
                Call to Action
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {results.ctas?.map((cta, i) => (
                  <div key={i} className="flex items-center gap-1 group">
                    <Badge 
                      className="bg-emerald-500/20 text-emerald-300 py-2 px-4 text-sm cursor-pointer hover:bg-emerald-500/30"
                      onClick={() => applyText('cta', cta)}
                    >
                      {cta}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => copyToClipboard(cta, `c${i}`)}
                    >
                      {copiedField === `c${i}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button
            variant="outline"
            onClick={generateContent}
            disabled={generating}
            className="w-full border-purple-500/30 text-purple-400"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
            Generuj ponownie
          </Button>
        </div>
      )}
    </div>
  );
}