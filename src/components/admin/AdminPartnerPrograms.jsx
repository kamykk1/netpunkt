import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Handshake, Settings, Loader2, ExternalLink, Coins } from 'lucide-react';

const PARTNER_PROGRAMS = [
  { slug: 'systempartnerski', name: 'SystemPartnerski.pl', description: 'Finanse - konta, lokaty, pożyczki' },
  { slug: 'mylead', name: 'MyLead.global', description: 'Mobile Rewards' },
  { slug: 'vivnetwork', name: 'VivNetwork.com.pl', description: 'CPA/CPL Network' },
  { slug: 'superpartners', name: 'SuperPartners.pl', description: 'Cashback i programy lojalnościowe' },
  { slug: 'temu', name: 'Temu', description: 'Zakupy z cashbackiem' },
  { slug: 'aliexpress', name: 'AliExpress', description: 'Międzynarodowy marketplace' },
];

export default function AdminPartnerPrograms() {
  const [showSettings, setShowSettings] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['partnerPrograms'],
    queryFn: () => base44.entities.PartnerProgram.list()
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const existing = programs.find(p => p.slug === data.slug);
      if (existing) {
        return base44.entities.PartnerProgram.update(existing.id, data);
      }
      return base44.entities.PartnerProgram.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnerPrograms'] });
      setShowSettings(false);
      toast.success('Ustawienia zapisane!');
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ slug, enabled }) => {
      const existing = programs.find(p => p.slug === slug);
      if (existing) {
        return base44.entities.PartnerProgram.update(existing.id, { is_enabled: enabled });
      }
      const defaultProgram = PARTNER_PROGRAMS.find(p => p.slug === slug);
      return base44.entities.PartnerProgram.create({
        ...defaultProgram,
        is_enabled: enabled,
        default_points_per_action: 100,
        points_multiplier: 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnerPrograms'] });
      toast.success('Status zaktualizowany!');
    }
  });

  const openSettings = (slug) => {
    const program = programs.find(p => p.slug === slug);
    const defaultProgram = PARTNER_PROGRAMS.find(p => p.slug === slug);
    setEditingProgram(slug);
    setFormData({
      slug,
      name: program?.name || defaultProgram?.name,
      api_url: program?.api_url || '',
      api_key: program?.api_key || '',
      api_secret: program?.api_secret || '',
      points_multiplier: program?.points_multiplier || 1,
      default_points_per_action: program?.default_points_per_action || 100,
      admin_notes: program?.admin_notes || ''
    });
    setShowSettings(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const defaultProgram = PARTNER_PROGRAMS.find(p => p.slug === formData.slug);
    saveMutation.mutate({
      ...formData,
      description: defaultProgram?.description,
      is_enabled: programs.find(p => p.slug === formData.slug)?.is_enabled || false
    });
  };

  const allPrograms = PARTNER_PROGRAMS.map(def => {
    const dbProgram = programs.find(p => p.slug === def.slug);
    return { ...def, ...dbProgram, is_enabled: dbProgram?.is_enabled || false };
  });

  return (
    <div className="space-y-6">
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Handshake className="w-5 h-5 text-cyan-400" />
            Programy partnerskie
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : (
            <div className="space-y-4">
              {allPrograms.map((program) => (
                <div
                  key={program.slug}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-purple-500/20"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${program.is_enabled ? 'bg-emerald-500/20' : 'bg-slate-700'}`}>
                      <Handshake className={`w-6 h-6 ${program.is_enabled ? 'text-emerald-400' : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-semibold">{program.name}</h3>
                        {program.is_enabled && (
                          <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">Aktywny</Badge>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm">{program.description}</p>
                      {program.points_multiplier && program.points_multiplier !== 1 && (
                        <p className="text-purple-400 text-xs mt-1">
                          <Coins className="w-3 h-3 inline mr-1" />
                          Mnożnik: x{program.points_multiplier}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={program.is_enabled}
                      onCheckedChange={(checked) => toggleMutation.mutate({ slug: program.slug, enabled: checked })}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-purple-500/30 text-purple-400"
                      onClick={() => openSettings(program.slug)}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-lg bg-[#1a1a2e] border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="text-white">
              Ustawienia: {PARTNER_PROGRAMS.find(p => p.slug === editingProgram)?.name}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">URL API</Label>
              <Input
                value={formData.api_url || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, api_url: e.target.value }))}
                className="bg-slate-800 border-purple-500/30 text-white"
                placeholder="https://api.example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">API Key</Label>
                <Input
                  value={formData.api_key || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
                  className="bg-slate-800 border-purple-500/30 text-white"
                  type="password"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">API Secret</Label>
                <Input
                  value={formData.api_secret || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, api_secret: e.target.value }))}
                  className="bg-slate-800 border-purple-500/30 text-white"
                  type="password"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Mnożnik punktów</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={formData.points_multiplier || 1}
                  onChange={(e) => setFormData(prev => ({ ...prev, points_multiplier: parseFloat(e.target.value) }))}
                  className="bg-slate-800 border-purple-500/30 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Domyślne pkt/akcję</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.default_points_per_action || 100}
                  onChange={(e) => setFormData(prev => ({ ...prev, default_points_per_action: parseInt(e.target.value) }))}
                  className="bg-slate-800 border-purple-500/30 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Notatki</Label>
              <Input
                value={formData.admin_notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, admin_notes: e.target.value }))}
                className="bg-slate-800 border-purple-500/30 text-white"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowSettings(false)} className="flex-1 border-purple-500/30 text-white">
                Anuluj
              </Button>
              <Button type="submit" disabled={saveMutation.isPending} className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600">
                {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Zapisz
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}