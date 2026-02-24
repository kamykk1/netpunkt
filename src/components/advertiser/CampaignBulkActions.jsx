import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Pause, Play, Trash2, Copy, Pencil, CheckSquare, X,
  Loader2, AlertTriangle, CheckCircle, Clock, FileText, XCircle, DollarSign
} from 'lucide-react';

const statusConfig = {
  draft: { color: 'bg-slate-500/20 text-slate-400', icon: FileText, label: 'Szkic' },
  pending_review: { color: 'bg-amber-500/20 text-amber-400', icon: Clock, label: 'Do akceptacji' },
  active: { color: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle, label: 'Aktywna' },
  paused: { color: 'bg-blue-500/20 text-blue-400', icon: Pause, label: 'Wstrzymana' },
  completed: { color: 'bg-purple-500/20 text-purple-400', icon: CheckCircle, label: 'Zakończona' },
  rejected: { color: 'bg-red-500/20 text-red-400', icon: XCircle, label: 'Odrzucona' }
};

export default function CampaignBulkActions({ campaigns, onEdit }) {
  const [selected, setSelected] = useState([]);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [newBudget, setNewBudget] = useState('');
  const queryClient = useQueryClient();

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, data }) => {
      await Promise.all(ids.map(id => base44.entities.AdvertiserCampaign.update(id, data)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myCampaigns'] });
      setSelected([]);
      toast.success('Kampanie zaktualizowane!');
    }
  });

  const copyMutation = useMutation({
    mutationFn: async (campaign) => {
      const { id, created_date, updated_date, ...rest } = campaign;
      return base44.entities.AdvertiserCampaign.create({
        ...rest,
        name: `${rest.name} (kopia)`,
        status: 'draft',
        current_views: 0,
        budget_spent: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myCampaigns'] });
      toast.success('Kampania skopiowana!');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(ids.map(id => base44.entities.AdvertiserCampaign.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myCampaigns'] });
      setSelected([]);
      toast.success('Kampanie usunięte!');
    }
  });

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectAll = () => {
    setSelected(campaigns.map(c => c.id));
  };

  const clearSelection = () => setSelected([]);

  const handleBulkStatus = (status) => {
    if (selected.length === 0) return;
    bulkUpdateMutation.mutate({ ids: selected, data: { status } });
  };

  const handleBulkBudget = () => {
    const budgetCents = Math.floor(parseFloat(newBudget) * 100);
    if (isNaN(budgetCents) || budgetCents <= 0) return;
    bulkUpdateMutation.mutate({ ids: selected, data: { budget_total: budgetCents } });
    setShowBudgetModal(false);
    setNewBudget('');
  };

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30"
          >
            <span className="text-purple-300 font-medium text-sm">
              Zaznaczono: {selected.length}
            </span>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleBulkStatus('active')} disabled={bulkUpdateMutation.isPending}>
                <Play className="w-3 h-3 mr-1" /> Wznów
              </Button>
              <Button size="sm" variant="outline" className="border-amber-500/30 text-amber-400"
                onClick={() => handleBulkStatus('paused')} disabled={bulkUpdateMutation.isPending}>
                <Pause className="w-3 h-3 mr-1" /> Wstrzymaj
              </Button>
              <Button size="sm" variant="outline" className="border-cyan-500/30 text-cyan-400"
                onClick={() => setShowBudgetModal(true)}>
                <DollarSign className="w-3 h-3 mr-1" /> Zmień budżet
              </Button>
              <Button size="sm" variant="outline" className="border-red-500/30 text-red-400"
                onClick={() => deleteMutation.mutate(selected)} disabled={deleteMutation.isPending}>
                <Trash2 className="w-3 h-3 mr-1" /> Usuń
              </Button>
              <Button size="sm" variant="ghost" className="text-slate-400" onClick={clearSelection}>
                <X className="w-3 h-3 mr-1" /> Anuluj
              </Button>
            </div>
            {bulkUpdateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin text-purple-400" />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Select All */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={selected.length === campaigns.length && campaigns.length > 0}
            onCheckedChange={(v) => v ? selectAll() : clearSelection()}
          />
          <span className="text-slate-400 text-sm">Zaznacz wszystkie</span>
        </label>
      </div>

      {/* Campaign List */}
      <div className="space-y-3">
        {campaigns.map((campaign) => {
          const config = statusConfig[campaign.status] || statusConfig.draft;
          const Icon = config.icon;
          const progress = campaign.target_views 
            ? Math.min((campaign.current_views / campaign.target_views) * 100, 100)
            : 0;
          const isSelected = selected.includes(campaign.id);

          return (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border transition-all ${
                isSelected 
                  ? 'bg-purple-500/10 border-purple-500/40' 
                  : 'bg-slate-800/50 border-purple-500/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleSelect(campaign.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                    <div>
                      <h3 className="text-white font-semibold">{campaign.name}</h3>
                      <p className="text-slate-400 text-sm truncate">{campaign.title}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={config.color}>
                        <Icon className="w-3 h-3 mr-1" />
                        {config.label}
                      </Badge>
                      <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                        {campaign.campaign_type?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
                    <div>
                      <p className="text-slate-500">Budżet</p>
                      <p className="text-white">{((campaign.budget_total || 0) / 100).toFixed(2)} zł</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Wydano</p>
                      <p className="text-emerald-400">{((campaign.budget_spent || 0) / 100).toFixed(2)} zł</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Wyświetlenia</p>
                      <p className="text-white">{campaign.current_views || 0} / {campaign.target_views || '∞'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Koszt/akcję</p>
                      <p className="text-white">{((campaign.cost_per_action || 0) / 100).toFixed(2)} zł</p>
                    </div>
                  </div>

                  {campaign.target_views && (
                    <Progress value={progress} className="h-2 bg-slate-700 mb-3" />
                  )}

                  {campaign.status === 'rejected' && campaign.rejection_reason && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 mb-3">
                      <p className="text-red-400 text-sm">
                        <AlertTriangle className="w-4 h-4 inline mr-1" />
                        {campaign.rejection_reason}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    {campaign.status === 'active' && (
                      <Button size="sm" variant="outline" className="border-amber-500/30 text-amber-400"
                        onClick={() => bulkUpdateMutation.mutate({ ids: [campaign.id], data: { status: 'paused' } })}>
                        <Pause className="w-3 h-3 mr-1" /> Wstrzymaj
                      </Button>
                    )}
                    {campaign.status === 'paused' && (
                      <Button size="sm" className="bg-emerald-600"
                        onClick={() => bulkUpdateMutation.mutate({ ids: [campaign.id], data: { status: 'active' } })}>
                        <Play className="w-3 h-3 mr-1" /> Wznów
                      </Button>
                    )}
                    {['draft', 'rejected'].includes(campaign.status) && (
                      <Button size="sm" variant="outline" className="border-purple-500/30 text-purple-400"
                        onClick={() => onEdit(campaign)}>
                        <Pencil className="w-3 h-3 mr-1" /> Edytuj
                      </Button>
                    )}
                    {campaign.status === 'draft' && (
                      <Button size="sm" className="bg-purple-600"
                        onClick={() => bulkUpdateMutation.mutate({ ids: [campaign.id], data: { status: 'pending_review' } })}>
                        Wyślij do akceptacji
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="border-cyan-500/30 text-cyan-400"
                      onClick={() => copyMutation.mutate(campaign)} disabled={copyMutation.isPending}>
                      <Copy className="w-3 h-3 mr-1" /> Kopiuj
                    </Button>
                    {['draft', 'rejected'].includes(campaign.status) && (
                      <Button size="sm" variant="outline" className="border-red-500/30 text-red-400"
                        onClick={() => deleteMutation.mutate([campaign.id])}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Budget Modal */}
      <Dialog open={showBudgetModal} onOpenChange={setShowBudgetModal}>
        <DialogContent className="bg-[#1a1a2e] border-purple-500/30 text-white">
          <DialogHeader>
            <DialogTitle>Zmień budżet dla {selected.length} kampanii</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Nowy budżet całkowity (zł)</Label>
              <Input
                type="number"
                value={newBudget}
                onChange={(e) => setNewBudget(e.target.value)}
                placeholder="np. 500.00"
                className="bg-slate-800 border-purple-500/30 text-white"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowBudgetModal(false)} className="flex-1">Anuluj</Button>
              <Button onClick={handleBulkBudget} className="flex-1 bg-purple-600">Zastosuj</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}