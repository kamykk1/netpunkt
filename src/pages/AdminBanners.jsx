import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Image, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';

const EMPTY = { title: '', description: '', image_url: '', target_url: '', is_active: true, sort_order: 0, display_duration: 5 };

export default function AdminBanners() {
  const queryClient = useQueryClient();
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteId, setDeleteId] = useState(null);

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['gameBanners'],
    queryFn: () => base44.entities.GameBanner.list('sort_order')
  });

  const saveMutation = useMutation({
    mutationFn: async () => editItem?.id
      ? base44.entities.GameBanner.update(editItem.id, form)
      : base44.entities.GameBanner.create(form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gameBanners'] }); setEditItem(null); toast.success('Zapisano!'); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GameBanner.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gameBanners'] }); setDeleteId(null); toast.success('Usunięto!'); }
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, val }) => base44.entities.GameBanner.update(id, { is_active: val }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gameBanners'] })
  });

  const openCreate = () => { setForm(EMPTY); setEditItem({}); };
  const openEdit = (b) => { setForm({ ...b }); setEditItem(b); };
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  if (user?.role !== 'admin') return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <p className="text-red-400">Brak dostępu</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Image className="w-7 h-7 text-purple-400" /> Bannery pre-game</h1>
            <p className="text-slate-400 mt-1">Zarządzaj rotacyjnymi banerami wyświetlanymi przed grami solo</p>
          </div>
          <Button onClick={openCreate} className="bg-gradient-to-r from-purple-600 to-cyan-600">
            <Plus className="w-4 h-4 mr-2" /> Dodaj banner
          </Button>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-12 text-slate-400">Ładowanie...</div>
          ) : banners.length === 0 ? (
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
              <CardContent className="py-12 text-center text-slate-400">
                <Image className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Brak bannerów. Dodaj pierwszy banner.</p>
              </CardContent>
            </Card>
          ) : (
            banners.map((b, idx) => (
              <Card key={b.id} className="bg-[#1a1a2e]/50 border-purple-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {b.image_url ? (
                      <img src={b.image_url} alt={b.title} className="w-20 h-12 object-cover rounded-lg border border-slate-700" onError={e => e.target.style.display='none'} />
                    ) : (
                      <div className="w-20 h-12 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center"><Image className="w-5 h-5 text-slate-500" /></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-semibold">{b.title}</p>
                        <Badge className={b.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-600/50 text-slate-400'}>
                          {b.is_active ? 'Aktywny' : 'Ukryty'}
                        </Badge>
                        <Badge className="bg-slate-700/50 text-slate-300 text-xs">{b.display_duration}s</Badge>
                        <Badge className="bg-slate-700/50 text-slate-300 text-xs">#{b.sort_order}</Badge>
                      </div>
                      {b.description && <p className="text-slate-400 text-sm mt-0.5 truncate">{b.description}</p>}
                      {b.target_url && <p className="text-purple-400 text-xs truncate">{b.target_url}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Switch checked={!!b.is_active} onCheckedChange={v => toggleMutation.mutate({ id: b.id, val: v })} />
                      <Button size="icon" variant="ghost" onClick={() => openEdit(b)} className="text-slate-400 hover:text-white h-8 w-8"><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteId(b.id)} className="text-red-400 hover:text-red-300 h-8 w-8"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Edit/Create dialog */}
        <Dialog open={!!editItem} onOpenChange={v => !v && setEditItem(null)}>
          <DialogContent className="bg-[#1a1a2e] border-purple-500/30 text-white max-w-md">
            <DialogHeader><DialogTitle className="text-white">{editItem?.id ? 'Edytuj banner' : 'Nowy banner'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-slate-300">Tytuł *</Label>
                <Input value={form.title} onChange={f('title')} className="bg-slate-800 border-purple-500/30 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Opis</Label>
                <Input value={form.description} onChange={f('description')} className="bg-slate-800 border-purple-500/30 text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">URL obrazka (banner)</Label>
                <Input value={form.image_url} onChange={f('image_url')} className="bg-slate-800 border-purple-500/30 text-white" placeholder="https://..." />
                {form.image_url && <img src={form.image_url} alt="" className="rounded-lg h-24 w-full object-cover border border-slate-700 mt-1" onError={e => e.target.style.display='none'} />}
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">URL docelowy (kliknięcie)</Label>
                <Input value={form.target_url} onChange={f('target_url')} className="bg-slate-800 border-purple-500/30 text-white" placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Kolejność</Label>
                  <Input type="number" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: parseInt(e.target.value)||0 }))} className="bg-slate-800 border-purple-500/30 text-white" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Czas odliczania (s)</Label>
                  <Input type="number" min="3" max="30" value={form.display_duration} onChange={e => setForm(p => ({ ...p, display_duration: parseInt(e.target.value)||5 }))} className="bg-slate-800 border-purple-500/30 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={!!form.is_active} onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))} />
                <Label className="text-slate-300">Aktywny</Label>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setEditItem(null)} className="flex-1 border-slate-600 text-slate-300 bg-transparent">Anuluj</Button>
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.title} className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600">
                  {saveMutation.isPending ? 'Zapisywanie...' : 'Zapisz'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete confirm */}
        <Dialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
          <DialogContent className="bg-[#1a1a2e] border-red-500/30 text-white max-w-sm">
            <DialogHeader><DialogTitle>Usuń banner?</DialogTitle></DialogHeader>
            <p className="text-slate-400">Ta operacja jest nieodwracalna.</p>
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