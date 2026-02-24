import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';

const CAMPAIGN_TYPES = [
  { value: 'ptc', label: 'PTC - Kliknij i zarabiaj' },
  { value: 'ptr', label: 'PTR - Czytaj artykuł' },
  { value: 'ptv', label: 'PTV - Oglądaj wideo' },
  { value: 'banner', label: 'Banner rotacyjny' },
  { value: 'email', label: 'Kampania email' },
];

const CATEGORIES = [
  { value: 'general', label: 'Ogólne' },
  { value: 'tech', label: 'Technologia' },
  { value: 'shopping', label: 'Zakupy' },
  { value: 'finance', label: 'Finanse' },
  { value: 'entertainment', label: 'Rozrywka' },
  { value: 'health', label: 'Zdrowie' },
  { value: 'gaming', label: 'Gaming' },
];

export default function AdvertiserCampaignForm({ isOpen, onClose, editingCampaign, userId, userEmail }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    campaign_type: 'ptc',
    title: '',
    description: '',
    url: '',
    image_url: '',
    budget_total: '',
    cost_per_action: '',
    points_reward: '',
    view_duration: 30,
    target_views: '',
    category: 'general',
    target_countries: 'PL',
  });

  useEffect(() => {
    if (editingCampaign) {
      setFormData({
        name: editingCampaign.name || '',
        campaign_type: editingCampaign.campaign_type || 'ptc',
        title: editingCampaign.title || '',
        description: editingCampaign.description || '',
        url: editingCampaign.url || '',
        image_url: editingCampaign.image_url || '',
        budget_total: editingCampaign.budget_total ? (editingCampaign.budget_total / 100).toString() : '',
        cost_per_action: editingCampaign.cost_per_action ? (editingCampaign.cost_per_action / 100).toString() : '',
        points_reward: editingCampaign.points_reward?.toString() || '',
        view_duration: editingCampaign.view_duration || 30,
        target_views: editingCampaign.target_views?.toString() || '',
        category: editingCampaign.category || 'general',
        target_countries: editingCampaign.target_countries || 'PL',
      });
    } else {
      setFormData({
        name: '',
        campaign_type: 'ptc',
        title: '',
        description: '',
        url: '',
        image_url: '',
        budget_total: '',
        cost_per_action: '',
        points_reward: '',
        view_duration: 30,
        target_views: '',
        category: 'general',
        target_countries: 'PL',
      });
    }
  }, [editingCampaign, isOpen]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AdvertiserCampaign.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myCampaigns'] });
      onClose();
      toast.success('Kampania utworzona!');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AdvertiserCampaign.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myCampaigns'] });
      onClose();
      toast.success('Kampania zaktualizowana!');
    }
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      advertiser_id: userId,
      advertiser_email: userEmail,
      name: formData.name,
      campaign_type: formData.campaign_type,
      title: formData.title,
      description: formData.description,
      url: formData.url,
      image_url: formData.image_url,
      budget_total: Math.round(parseFloat(formData.budget_total) * 100),
      cost_per_action: Math.round(parseFloat(formData.cost_per_action) * 100),
      points_reward: parseInt(formData.points_reward) || 0,
      view_duration: parseInt(formData.view_duration) || 30,
      target_views: formData.target_views ? parseInt(formData.target_views) : null,
      category: formData.category,
      target_countries: formData.target_countries,
      status: 'draft'
    };

    if (editingCampaign) {
      updateMutation.mutate({ id: editingCampaign.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-[#1a1a2e] border-purple-500/30">
        <DialogHeader>
          <DialogTitle className="text-white">
            {editingCampaign ? 'Edytuj kampanię' : 'Nowa kampania reklamowa'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Wypełnij formularz, aby utworzyć kampanię reklamową.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Nazwa kampanii *</Label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="bg-slate-800 border-purple-500/30 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Typ kampanii *</Label>
              <Select value={formData.campaign_type} onValueChange={(v) => handleChange('campaign_type', v)}>
                <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-purple-500/30 text-white">
                  {CAMPAIGN_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value} className="text-white hover:bg-purple-500/20">{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Tytuł reklamy *</Label>
            <Input
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="bg-slate-800 border-purple-500/30 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Opis</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="bg-slate-800 border-purple-500/30 text-white"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">URL docelowy *</Label>
              <Input
                type="url"
                value={formData.url}
                onChange={(e) => handleChange('url', e.target.value)}
                className="bg-slate-800 border-purple-500/30 text-white"
                placeholder="https://..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">URL obrazka</Label>
              <Input
                type="url"
                value={formData.image_url}
                onChange={(e) => handleChange('image_url', e.target.value)}
                className="bg-slate-800 border-purple-500/30 text-white"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Budżet (zł) *</Label>
              <Input
                type="number"
                step="0.01"
                min="10"
                value={formData.budget_total}
                onChange={(e) => handleChange('budget_total', e.target.value)}
                className="bg-slate-800 border-purple-500/30 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Koszt/akcję (zł) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.cost_per_action}
                onChange={(e) => handleChange('cost_per_action', e.target.value)}
                className="bg-slate-800 border-purple-500/30 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Nagroda (pkt)</Label>
              <Input
                type="number"
                min="1"
                value={formData.points_reward}
                onChange={(e) => handleChange('points_reward', e.target.value)}
                className="bg-slate-800 border-purple-500/30 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Czas (s)</Label>
              <Input
                type="number"
                min="5"
                value={formData.view_duration}
                onChange={(e) => handleChange('view_duration', e.target.value)}
                className="bg-slate-800 border-purple-500/30 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Cel wyświetleń</Label>
              <Input
                type="number"
                min="100"
                value={formData.target_views}
                onChange={(e) => handleChange('target_views', e.target.value)}
                className="bg-slate-800 border-purple-500/30 text-white"
                placeholder="Opcjonalnie"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Kategoria</Label>
              <Select value={formData.category} onValueChange={(v) => handleChange('category', v)}>
                <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-purple-500/30 text-white">
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value} className="text-white hover:bg-purple-500/20">{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-purple-500/30 text-white">
              Anuluj
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingCampaign ? 'Zapisz' : 'Utwórz kampanię'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}