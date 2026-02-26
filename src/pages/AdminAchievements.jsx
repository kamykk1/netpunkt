import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Trophy, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const EMPTY = { key: '', name: '', description: '', icon: '🏅', category: 'games', requirement_type: 'games_played', requirement_value: 1, reward_type: 'points', reward_value: 0, reward_description: '', rarity: 'common', is_active: true, is_visible: true, sort_order: 0 };
const REQ_TYPES = [
  { value: 'games_played', label: 'Rozegrane gry' },
  { value: 'games_won', label: 'Wygrane gry' },
  { value: 'points_earned', label: 'Zdobyte punkty' },
  { value: 'referrals_count', label: 'Polecenia' },
  { value: 'win_streak', label: 'Seria wygranych' },
  { value: 'custom', label: 'Własne' },
];
const RARITIES = ['common', 'rare', 'epic', 'legendary'];
const RARITY_NAMES = { common: 'Pospolite', rare: 'Rzadkie', epic: 'Epickie', legendary: 'Legendarne' };
const RARITY_COLORS = { common: 'bg-slate-500/20 text-slate-300', rare: 'bg-blue-500/20 text-blue-300', epic: 'bg-purple-500/20 text-purple-300', legendary: 'bg-yellow-500/20 text-yellow-300' };

export default function AdminAchievements() {
  const queryClient = useQueryClient();
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteId, setDeleteId] = useState(null);

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: achievements = [], isLoading } = useQuery({
    queryKey: ['allAchievements'],
    queryFn: () => base44.entities.Achievement.list('sort_order')
  });

  const saveMutation = useMutation({
    mutationFn: async () => editItem?.id
      ? base44.entities.Achievement.update(editItem.id, form)
      : base44.entities.Achievement.create(form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['allAchievements'] }); queryClient.invalidateQueries({ queryKey: ['achievements'] }); setEditItem(null); toast.success('Zapisano!'); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Achievement.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['allAchievements'] }); queryClient.invalidateQueries({ queryKey: ['achievements'] }); setDeleteId(null); toast.success('Usunięto!'); }
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, field, val }) => base44.entities.Achievement.update(id, { [field]: val }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['allAchievements'] }); queryClient.invalidateQueries({ queryKey: ['achievements'] }); }
  });

  const openCreate = () => { setForm(EMPTY); setEditItem({}); };
  const openEdit = (a) => { setForm({ ...a }); setEditItem(a); };
  const sf = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const f = (k) => (e) => sf(k, e.target.value);

  if (user?.role !== 'admin') return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center"><p className="text-red-400">Brak dostępu</p></div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Trophy className="w-7 h-7 text-yellow-400" /> Osiągnięcia</h1>
            <p className="text-slate-400 mt-1">Zarządzaj systemem osiągnięć i nagród</p>
          </div>
          <Button onClick={openCreate} className="bg-gradient-to-r from-purple-600 to-cyan-600">
            <Plus className="w-4 h-4 mr-2" /> Dodaj osiągnięcie
          </Button>
        </div>

        <div className="space-y-3">
          {isLoading ? <p className="text-center text-slate-400 py-12">Ładowanie...</p> :
            achievements.length === 0 ? (
              <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
                <CardContent className="py-12 text-center text-slate-400">
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Brak osiągnięć. Dodaj pierwsze.</p>
                </CardContent>
              </Card>
            ) : achievements.map(a => (
              <Card key={a.id} className="bg-[#1a1a2e]/50 border-purple-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`text-2xl ${!a.is_active ? 'grayscale opacity-40' : ''}`}>{a.icon || '🏅'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-semibold">{a.name}</p>
                        <Badge className={RARITY_COLORS[a.rarity] || RARITY_COLORS.common}>{RARITY_NAMES[a.rarity]}</Badge>
                        <Badge className={a.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-600/50 text-slate-400'}>{a.is_active ? 'Aktywne' : 'Wyłączone'}</Badge>
                        {!a.is_visible && <Badge className="bg-slate-600/50 text-slate-400"><EyeOff className="w-3 h-3 mr-1" />Ukryte</Badge>}
                      </div>
                      <p className="text-slate-400 text-sm mt-0.5">{a.description}</p>
                      <p className="text-slate-500 text-xs">Wymaganie: {REQ_TYPES.find(r=>r.value===a.requirement_type)?.label} ≥ {a.requirement_value} | Nagroda: {a.reward_type === 'points' ? `${a.reward_value} pkt` : a.reward_description || '—'}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button title="Widoczność" onClick={() => toggleMutation.mutate({ id: a.id, field: 'is_visible', val: !a.is_visible })} className="p-1.5 rounded text-slate-400 hover:text-white">
                        {a.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <Switch checked={!!a.is_active} onCheckedChange={v => toggleMutation.mutate({ id: a.id, field: 'is_active', val: v })} />
                      <Button size="icon" variant="ghost" onClick={() => openEdit(a)} className="text-slate-400 hover:text-white h-8 w-8"><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteId(a.id)} className="text-red-400 hover:text-red-300 h-8 w-8"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          }
        </div>

        {/* Edit dialog */}
        <Dialog open={!!editItem} onOpenChange={v => !v && setEditItem(null)}>
          <DialogContent className="bg-[#1a1a2e] border-purple-500/30 text-white max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="text-white">{editItem?.id ? 'Edytuj osiągnięcie' : 'Nowe osiągnięcie'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Klucz (unikalny) *</Label>
                  <Input value={form.key} onChange={f('key')} className="bg-slate-800 border-purple-500/30 text-white" placeholder="games_first_win" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Ikona (emoji)</Label>
                  <Input value={form.icon} onChange={f('icon')} className="bg-slate-800 border-purple-500/30 text-white" placeholder="🏅" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Nazwa *</Label>
                <Input value={form.name} onChange={f('name')} className="bg-slate-800 border-purple-500/30 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Opis</Label>
                <Input value={form.description} onChange={f('description')} className="bg-slate-800 border-purple-500/30 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Wymaganie</Label>
                  <Select value={form.requirement_type} onValueChange={v => sf('requirement_type', v)}>
                    <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-purple-500/30 text-white">
                      {REQ_TYPES.map(r => <SelectItem key={r.value} value={r.value} className="text-white">{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Wartość wymagana</Label>
                  <Input type="number" min="1" value={form.requirement_value} onChange={e => sf('requirement_value', parseInt(e.target.value)||1)} className="bg-slate-800 border-purple-500/30 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Rzadkość</Label>
                  <Select value={form.rarity} onValueChange={v => sf('rarity', v)}>
                    <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-purple-500/30 text-white">
                      {RARITIES.map(r => <SelectItem key={r} value={r} className="text-white">{RARITY_NAMES[r]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Kolejność</Label>
                  <Input type="number" value={form.sort_order} onChange={e => sf('sort_order', parseInt(e.target.value)||0)} className="bg-slate-800 border-purple-500/30 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Typ nagrody</Label>
                  <Select value={form.reward_type} onValueChange={v => sf('reward_type', v)}>
                    <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-purple-500/30 text-white">
                      <SelectItem value="points" className="text-white">Punkty</SelectItem>
                      <SelectItem value="badge" className="text-white">Odznaka</SelectItem>
                      <SelectItem value="feature" className="text-white">Funkcja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Wartość nagrody</Label>
                  <Input type="number" min="0" value={form.reward_value} onChange={e => sf('reward_value', parseInt(e.target.value)||0)} className="bg-slate-800 border-purple-500/30 text-white" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Opis nagrody</Label>
                <Input value={form.reward_description} onChange={f('reward_description')} className="bg-slate-800 border-purple-500/30 text-white" placeholder="np. +50 pkt, odblokowanie funkcji XYZ" />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer"><Switch checked={!!form.is_active} onCheckedChange={v => sf('is_active', v)} /><span className="text-slate-300 text-sm">Aktywne</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><Switch checked={!!form.is_visible} onCheckedChange={v => sf('is_visible', v)} /><span className="text-slate-300 text-sm">Widoczne</span></label>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setEditItem(null)} className="flex-1 border-slate-600 text-slate-300 bg-transparent">Anuluj</Button>
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.key || !form.name} className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600">
                  {saveMutation.isPending ? 'Zapisywanie...' : 'Zapisz'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
          <DialogContent className="bg-[#1a1a2e] border-red-500/30 text-white max-w-sm">
            <DialogHeader><DialogTitle>Usuń osiągnięcie?</DialogTitle></DialogHeader>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1 border-slate-600 text-slate-300 bg-transparent">Anuluj</Button>
              <Button onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending} className="flex-1 bg-red-600 hover:bg-red-700">Usuń</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}