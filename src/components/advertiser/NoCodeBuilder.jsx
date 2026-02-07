import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { 
  Palette, Type, Image, Layout, Eye, Save, Wand2,
  Square, Circle, Hexagon, Sparkles, Loader2
} from 'lucide-react';

const TEMPLATES = [
  { id: 'minimal', name: 'Minimalistyczny', preview: 'bg-gradient-to-r from-slate-900 to-slate-800' },
  { id: 'neon', name: 'Neon Glow', preview: 'bg-gradient-to-r from-purple-900 to-cyan-900' },
  { id: 'corporate', name: 'Korporacyjny', preview: 'bg-gradient-to-r from-blue-900 to-indigo-900' },
  { id: 'vibrant', name: 'Żywy', preview: 'bg-gradient-to-r from-pink-600 to-orange-500' },
  { id: 'dark', name: 'Ciemny', preview: 'bg-gradient-to-r from-gray-900 to-black' },
  { id: 'custom', name: 'Własny', preview: 'bg-gradient-to-r from-purple-600 to-cyan-600' },
];

const FONTS = [
  { id: 'inter', name: 'Inter', style: 'font-sans' },
  { id: 'poppins', name: 'Poppins', style: 'font-sans' },
  { id: 'playfair', name: 'Playfair', style: 'font-serif' },
  { id: 'roboto', name: 'Roboto', style: 'font-sans' },
  { id: 'montserrat', name: 'Montserrat', style: 'font-sans' },
];

const BUTTON_STYLES = [
  { id: 'rounded', name: 'Zaokrąglony', class: 'rounded-full' },
  { id: 'square', name: 'Kwadratowy', class: 'rounded-none' },
  { id: 'soft', name: 'Miękki', class: 'rounded-xl' },
  { id: 'pill', name: 'Pigułka', class: 'rounded-3xl px-8' },
];

export default function NoCodeBuilder({ onSave, initialConfig }) {
  const [config, setConfig] = useState(initialConfig || {
    template: 'neon',
    primaryColor: '#8b5cf6',
    secondaryColor: '#06b6d4',
    backgroundColor: '#0a0a0f',
    textColor: '#ffffff',
    font: 'inter',
    buttonStyle: 'soft',
    logoUrl: '',
    headerText: 'Zarabiaj z nami!',
    subheaderText: 'Oglądaj reklamy i zbieraj punkty',
    ctaText: 'Rozpocznij',
    showTimer: true,
    timerPosition: 'top',
    showProgress: true,
    borderRadius: 16,
    padding: 24,
    animation: 'fade',
    customCss: '',
  });
  const [previewMode, setPreviewMode] = useState('desktop');
  const [generating, setGenerating] = useState(false);

  const updateConfig = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const generateWithAI = async () => {
    setGenerating(true);
    // Symulacja generowania AI
    setTimeout(() => {
      setConfig(prev => ({
        ...prev,
        headerText: 'Odkryj niesamowite oferty!',
        subheaderText: 'Zarabiaj punkty za każde kliknięcie',
        ctaText: 'Zacznij zarabiać',
        primaryColor: '#ec4899',
        secondaryColor: '#8b5cf6',
      }));
      setGenerating(false);
      toast.success('Kreacja wygenerowana przez AI!');
    }, 2000);
  };

  const handleSave = () => {
    onSave?.(config);
    toast.success('Konfiguracja zapisana!');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Editor Panel */}
      <div className="space-y-4">
        <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <Layout className="w-5 h-5 text-purple-400" />
              Szablon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => updateConfig('template', tpl.id)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    config.template === tpl.id
                      ? 'border-purple-500 ring-2 ring-purple-500/50'
                      : 'border-transparent hover:border-purple-500/30'
                  }`}
                >
                  <div className={`h-12 rounded-md ${tpl.preview} mb-2`} />
                  <p className="text-white text-xs text-center">{tpl.name}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <Palette className="w-5 h-5 text-cyan-400" />
              Kolory
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs">Główny</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) => updateConfig('primaryColor', e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={config.primaryColor}
                    onChange={(e) => updateConfig('primaryColor', e.target.value)}
                    className="bg-slate-800 border-purple-500/30 text-white text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs">Akcentowy</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config.secondaryColor}
                    onChange={(e) => updateConfig('secondaryColor', e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={config.secondaryColor}
                    onChange={(e) => updateConfig('secondaryColor', e.target.value)}
                    className="bg-slate-800 border-purple-500/30 text-white text-sm"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <Type className="w-5 h-5 text-pink-400" />
              Treść
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={generateWithAI}
                disabled={generating}
                className="border-purple-500/30 text-purple-400"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Wand2 className="w-4 h-4 mr-1" />}
                Generuj AI
              </Button>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">Nagłówek</Label>
              <Input
                value={config.headerText}
                onChange={(e) => updateConfig('headerText', e.target.value)}
                className="bg-slate-800 border-purple-500/30 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">Podtytuł</Label>
              <Input
                value={config.subheaderText}
                onChange={(e) => updateConfig('subheaderText', e.target.value)}
                className="bg-slate-800 border-purple-500/30 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs">Tekst przycisku</Label>
                <Input
                  value={config.ctaText}
                  onChange={(e) => updateConfig('ctaText', e.target.value)}
                  className="bg-slate-800 border-purple-500/30 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs">Styl przycisku</Label>
                <Select value={config.buttonStyle} onValueChange={(v) => updateConfig('buttonStyle', v)}>
                  <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-purple-500/30">
                    {BUTTON_STYLES.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              Opcje
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-slate-300">Pokaż timer</Label>
              <Switch
                checked={config.showTimer}
                onCheckedChange={(v) => updateConfig('showTimer', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-slate-300">Pasek postępu</Label>
              <Switch
                checked={config.showProgress}
                onCheckedChange={(v) => updateConfig('showProgress', v)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">Zaokrąglenie: {config.borderRadius}px</Label>
              <Slider
                value={[config.borderRadius]}
                onValueChange={([v]) => updateConfig('borderRadius', v)}
                max={32}
                step={2}
                className="py-2"
              />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} className="w-full bg-gradient-to-r from-purple-600 to-cyan-600">
          <Save className="w-4 h-4 mr-2" />
          Zapisz konfigurację
        </Button>
      </div>

      {/* Preview Panel */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Eye className="w-5 h-5 text-cyan-400" />
            Podgląd na żywo
          </h3>
          <div className="flex gap-1 bg-slate-800 rounded-lg p-1">
            {['desktop', 'mobile'].map((mode) => (
              <button
                key={mode}
                onClick={() => setPreviewMode(mode)}
                className={`px-3 py-1 rounded text-xs ${
                  previewMode === mode ? 'bg-purple-500 text-white' : 'text-slate-400'
                }`}
              >
                {mode === 'desktop' ? '🖥️ Desktop' : '📱 Mobile'}
              </button>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`mx-auto transition-all ${previewMode === 'mobile' ? 'max-w-sm' : 'w-full'}`}
        >
          <div
            className="rounded-2xl overflow-hidden border border-purple-500/30"
            style={{
              backgroundColor: config.backgroundColor,
              borderRadius: `${config.borderRadius}px`,
              padding: `${config.padding}px`,
            }}
          >
            {config.showTimer && (
              <div
                className="text-center mb-4 py-2 rounded-lg"
                style={{ backgroundColor: `${config.primaryColor}20` }}
              >
                <span className="text-white text-sm">⏱️ Pozostało: <strong>30s</strong></span>
              </div>
            )}

            {config.logoUrl && (
              <img src={config.logoUrl} alt="Logo" className="h-10 mx-auto mb-4" />
            )}

            <h2
              className="text-2xl font-bold text-center mb-2"
              style={{
                background: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {config.headerText}
            </h2>

            <p className="text-center mb-6" style={{ color: `${config.textColor}99` }}>
              {config.subheaderText}
            </p>

            <div className="aspect-video bg-slate-800/50 rounded-lg mb-6 flex items-center justify-center">
              <Image className="w-12 h-12 text-slate-600" />
            </div>

            {config.showProgress && (
              <div className="mb-4">
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full w-1/2 rounded-full"
                    style={{
                      background: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`,
                    }}
                  />
                </div>
              </div>
            )}

            <button
              className={`w-full py-3 font-semibold text-white ${
                BUTTON_STYLES.find(s => s.id === config.buttonStyle)?.class || 'rounded-xl'
              }`}
              style={{
                background: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`,
              }}
            >
              {config.ctaText}
            </button>
          </div>
        </motion.div>

        <p className="text-slate-500 text-xs text-center">
          Ta kreacja będzie wyświetlana użytkownikom podczas oglądania reklamy
        </p>
      </div>
    </div>
  );
}