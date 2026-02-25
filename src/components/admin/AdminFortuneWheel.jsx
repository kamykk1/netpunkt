import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, RefreshCw, Gift } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_SEGMENTS = [
  { label: '10 pkt', points: 10, color: '#8b5cf6' },
  { label: '25 pkt', points: 25, color: '#06b6d4' },
  { label: '5 pkt', points: 5, color: '#ec4899' },
  { label: '50 pkt', points: 50, color: '#f59e0b' },
  { label: '0 pkt', points: 0, color: '#475569' },
  { label: '100 pkt', points: 100, color: '#10b981' },
  { label: '15 pkt', points: 15, color: '#3b82f6' },
  { label: '💎 500', points: 500, color: '#f43f5e' },
];

const COLORS = ['#8b5cf6','#06b6d4','#ec4899','#f59e0b','#10b981','#3b82f6','#f43f5e','#475569','#84cc16','#f97316'];

export default function AdminFortuneWheel({ settings }) {
  const queryClient = useQueryClient();
  const canvasRef = useRef(null);
  const [segments, setSegments] = useState(DEFAULT_SEGMENTS);
  const [cooldownHours, setCooldownHours] = useState(24);
  const [wheelEnabled, setWheelEnabled] = useState(true);
  const [newSeg, setNewSeg] = useState({ label: '', points: 0, color: '#8b5cf6' });

  useEffect(() => {
    const wSeg = settings.find(s => s.setting_key === 'wheel_segments');
    const wCd = settings.find(s => s.setting_key === 'wheel_cooldown_hours');
    const wEn = settings.find(s => s.setting_key === 'wheel_enabled');
    if (wSeg) { try { setSegments(JSON.parse(wSeg.setting_value)); } catch {} }
    if (wCd) setCooldownHours(parseInt(wCd.setting_value) || 24);
    if (wEn) setWheelEnabled(wEn.setting_value !== 'false');
  }, [settings]);

  useEffect(() => { drawPreview(); }, [segments]);

  const drawPreview = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W/2, cy = H/2, R = Math.min(W,H)/2 - 8;
    const n = segments.length;
    const arc = (2*Math.PI)/n;
    ctx.clearRect(0,0,W,H);
    segments.forEach((seg, i) => {
      const start = i*arc - Math.PI/2;
      const end = start + arc;
      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,R,start,end);
      ctx.fillStyle = seg.color;
      ctx.fill();
      ctx.strokeStyle='#0a0a0f';
      ctx.lineWidth=2;
      ctx.stroke();
      ctx.save();
      ctx.translate(cx,cy);
      ctx.rotate(start+arc/2);
      ctx.textAlign='right';
      ctx.fillStyle='#fff';
      ctx.font='bold 10px sans-serif';
      ctx.fillText(seg.label, R-8, 4);
      ctx.restore();
    });
    ctx.beginPath();
    ctx.arc(cx,cy,16,0,2*Math.PI);
    ctx.fillStyle='#0f0f18';
    ctx.fill();
    ctx.strokeStyle='#8b5cf6';
    ctx.lineWidth=2;
    ctx.stroke();
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = [
        { key: 'wheel_segments', value: JSON.stringify(segments), category: 'general' },
        { key: 'wheel_cooldown_hours', value: String(cooldownHours), category: 'general' },
        { key: 'wheel_enabled', value: String(wheelEnabled), category: 'general' },
      ];
      for (const u of updates) {
        const ex = settings.find(s => s.setting_key === u.key);
        if (ex) await base44.entities.SiteSettings.update(ex.id, { setting_value: u.value });
        else await base44.entities.SiteSettings.create({ setting_key: u.key, setting_value: u.value, category: u.category });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteSettings'] });
      toast.success('Koło fortuny zapisane!');
    }
  });

  const addSegment = () => {
    if (!newSeg.label.trim()) { toast.error('Podaj etykietę segmentu'); return; }
    setSegments(p => [...p, { ...newSeg, points: parseInt(newSeg.points)||0 }]);
    setNewSeg({ label: '', points: 0, color: COLORS[Math.floor(Math.random()*COLORS.length)] });
  };

  const removeSegment = (i) => setSegments(p => p.filter((_,idx)=>idx!==i));

  const updateSegment = (i, field, val) => {
    setSegments(p => p.map((s,idx) => idx===i ? { ...s, [field]: field==='points' ? parseInt(val)||0 : val } : s));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preview */}
        <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-400" /> Podgląd koła
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <canvas ref={canvasRef} width={240} height={240} className="rounded-full" />
            <Badge className="bg-amber-500/20 text-amber-400">{segments.length} segmentów</Badge>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white">Ustawienia ogólne</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-purple-500/20">
              <div>
                <p className="text-white font-medium">Koło fortuny włączone</p>
                <p className="text-slate-500 text-xs">Pokazuj użytkownikom sekcję koła</p>
              </div>
              <Switch checked={wheelEnabled} onCheckedChange={setWheelEnabled} />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Cooldown (godziny między kręceniami)</Label>
              <Input type="number" min="1" max="168" value={cooldownHours}
                onChange={e => setCooldownHours(parseInt(e.target.value)||24)}
                className="bg-slate-800 border-purple-500/30 text-white" />
              <p className="text-xs text-slate-500">Użytkownicy mogą kręcić co {cooldownHours}h</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700 space-y-1">
              <p className="text-slate-400 text-xs">Łączna pula nagród:</p>
              <p className="text-white font-bold text-lg">{segments.reduce((s,c)=>s+c.points,0)} pkt</p>
              <p className="text-slate-500 text-xs">Śr. nagroda: {Math.round(segments.reduce((s,c)=>s+c.points,0)/segments.length)} pkt</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segments editor */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white">Segmenty koła</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {segments.map((seg, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50 border border-slate-700">
                <input type="color" value={seg.color} onChange={e=>updateSegment(i,'color',e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
                <Input value={seg.label} onChange={e=>updateSegment(i,'label',e.target.value)}
                  placeholder="Etykieta" className="bg-slate-900 border-slate-600 text-white text-sm flex-1" />
                <Input type="number" value={seg.points} onChange={e=>updateSegment(i,'points',e.target.value)}
                  className="bg-slate-900 border-slate-600 text-white text-sm w-24" min="0" />
                <span className="text-slate-500 text-xs">pkt</span>
                <Button size="sm" variant="outline" onClick={()=>removeSegment(i)}
                  className="border-red-500/30 text-red-400 bg-transparent h-7 w-7 p-0">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add segment */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
            <input type="color" value={newSeg.color} onChange={e=>setNewSeg(p=>({...p,color:e.target.value}))}
              className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
            <Input value={newSeg.label} onChange={e=>setNewSeg(p=>({...p,label:e.target.value}))}
              placeholder="Etykieta (np. 50 pkt)" className="bg-slate-900 border-slate-600 text-white text-sm flex-1" />
            <Input type="number" value={newSeg.points} onChange={e=>setNewSeg(p=>({...p,points:e.target.value}))}
              className="bg-slate-900 border-slate-600 text-white text-sm w-24" min="0" placeholder="0" />
            <Button size="sm" onClick={addSegment} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600">
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? 'Zapisuję...' : 'Zapisz koło fortuny'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}