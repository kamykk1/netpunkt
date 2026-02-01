import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';

const AD_TYPES = [
  { value: 'ptc', label: 'PTC - Kliknij' },
  { value: 'ptr', label: 'PTR - Czytaj' },
  { value: 'ptv', label: 'PTV - Oglądaj' },
  { value: 'email', label: 'Email' },
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

const STATUSES = [
  { value: 'pending', label: 'Oczekująca' },
  { value: 'active', label: 'Aktywna' },
  { value: 'paused', label: 'Wstrzymana' },
  { value: 'completed', label: 'Zakończona' },
  { value: 'rejected', label: 'Odrzucona' },
];

const AFFILIATE_NETWORKS = [
  { value: 'none', label: 'Brak' },
  { value: 'tradedoubler', label: 'TradeDoubler' },
  { value: 'awin', label: 'Awin' },
  { value: 'cj', label: 'Commission Junction' },
  { value: 'admitad', label: 'Admitad' },
  { value: 'aliexpress', label: 'AliExpress' },
];

export default function AdminAdForm({ isOpen, onClose, onSubmit, editingAd, isLoading }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    image_url: '',
    ad_type: 'ptc',
    points_reward: '',
    view_duration: 30,
    max_views: 100,
    category: 'general',
    status: 'active',
    affiliate_network: 'none',
    affiliate_id: '',
    priority: 1,
    event_multiplier: 1,
  });

  useEffect(() => {
    if (editingAd) {
      setFormData({
        title: editingAd.title || '',
        description: editingAd.description || '',
        url: editingAd.url || '',
        image_url: editingAd.image_url || '',
        ad_type: editingAd.ad_type || 'ptc',
        points_reward: editingAd.points_reward || '',
        view_duration: editingAd.view_duration || 30,
        max_views: editingAd.max_views || 100,
        category: editingAd.category || 'general',
        status: editingAd.status || 'active',
        affiliate_network: editingAd.affiliate_network || 'none',
        affiliate_id: editingAd.affiliate_id || '',
        priority: editingAd.priority || 1,
        event_multiplier: editingAd.event_multiplier || 1,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        url: '',
        image_url: '',
        ad_type: 'ptc',
        points_reward: '',
        view_duration: 30,
        max_views: 100,
        category: 'general',
        status: 'active',
        affiliate_network: 'none',
        affiliate_id: '',
        priority: 1,
        event_multiplier: 1,
      });
    }
  }, [editingAd, isOpen]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      points_reward: parseInt(formData.points_reward) || 0,
      view_duration: parseInt(formData.view_duration) || 30,
      max_views: parseInt(formData.max_views) || 100,
      priority: parseInt(formData.priority) || 1,
      event_multiplier: parseFloat(formData.event_multiplier) || 1,
      current_views: editingAd?.current_views || 0
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-[#1a1a2e] border-purple-500/30">
        <DialogHeader>
          <DialogTitle className="text-white">{editingAd ? 'Edytuj reklamę' : 'Nowa reklama'}</DialogTitle>
          <DialogDescription className="text-slate-400">
            Wypełnij formularz aby {editingAd ? 'zaktualizować' : 'dodać'} reklamę.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Typ reklamy *</Label>
              <Select value={formData.ad_type} onValueChange={(v) => handleChange('ad_type', v)}>
                <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-purple-500/30">
                  {AD_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Kategoria</Label>
              <Select value={formData.category} onValueChange={(v) => handleChange('category', v)}>
                <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-purple-500/30">
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Tytuł *</Label>
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

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Punkty *</Label>
              <Input
                type="number"
                min="1"
                value={formData.points_reward}
                onChange={(e) => handleChange('points_reward', e.target.value)}
                className="bg-slate-800 border-purple-500/30 text-white"
                required
              />
            </div>
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
              <Label className="text-slate-300">Max wyśw.</Label>
              <Input
                type="number"
                min="1"
                value={formData.max_views}
                onChange={(e) => handleChange('max_views', e.target.value)}
                className="bg-slate-800 border-purple-500/30 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">URL strony</Label>
            <Input
              type="url"
              value={formData.url}
              onChange={(e) => handleChange('url', e.target.value)}
              className="bg-slate-800 border-purple-500/30 text-white"
              placeholder="https://..."
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Sieć afiliacyjna</Label>
              <Select value={formData.affiliate_network} onValueChange={(v) => handleChange('affiliate_network', v)}>
                <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-purple-500/30">
                  {AFFILIATE_NETWORKS.map(net => (
                    <SelectItem key={net.value} value={net.value}>{net.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">ID kampanii</Label>
              <Input
                value={formData.affiliate_id}
                onChange={(e) => handleChange('affiliate_id', e.target.value)}
                className="bg-slate-800 border-purple-500/30 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Priorytet (1-10)</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="bg-slate-800 border-purple-500/30 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Mnożnik</Label>
              <Input
                type="number"
                step="0.1"
                min="1"
                value={formData.event_multiplier}
                onChange={(e) => handleChange('event_multiplier', e.target.value)}
                className="bg-slate-800 border-purple-500/30 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Status</Label>
              <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-purple-500/30">
                  {STATUSES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
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
              {editingAd ? 'Zapisz' : 'Utwórz'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}