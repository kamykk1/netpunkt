import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';

const CATEGORIES = [
  { value: 'general', label: 'Ogólne' },
  { value: 'tech', label: 'Technologia' },
  { value: 'shopping', label: 'Zakupy' },
  { value: 'finance', label: 'Finanse' },
  { value: 'entertainment', label: 'Rozrywka' },
  { value: 'health', label: 'Zdrowie' }
];

const AFFILIATE_NETWORKS = [
  { value: 'none', label: 'Brak' },
  { value: 'tradedoubler', label: 'TradeDoubler' },
  { value: 'awin', label: 'Awin' },
  { value: 'cj', label: 'Commission Junction' },
  { value: 'admitad', label: 'Admitad' },
  { value: 'other', label: 'Inna' }
];

export default function AdForm({ isOpen, onClose, onSubmit, editingAd, isLoading }) {
  const [formData, setFormData] = useState(editingAd || {
    title: '',
    description: '',
    url: '',
    image_url: '',
    reward_amount: '',
    view_duration: 30,
    max_views: 100,
    category: 'general',
    status: 'active',
    affiliate_network: 'none',
    affiliate_id: ''
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      reward_amount: Math.round(parseFloat(formData.reward_amount) * 100),
      view_duration: parseInt(formData.view_duration) || 30,
      max_views: parseInt(formData.max_views) || 100,
      current_views: editingAd?.current_views || 0
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingAd ? 'Edytuj reklamę' : 'Utwórz nową reklamę'}</DialogTitle>
          <DialogDescription>
            Wypełnij formularz, aby {editingAd ? 'zaktualizować' : 'dodać'} reklamę.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Tytuł *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Opis *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reward">Nagroda (zł) *</Label>
              <Input
                id="reward"
                type="number"
                step="0.01"
                min="0.01"
                value={typeof formData.reward_amount === 'number' ? (formData.reward_amount / 100).toFixed(2) : formData.reward_amount}
                onChange={(e) => handleChange('reward_amount', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Czas oglądania (s)</Label>
              <Input
                id="duration"
                type="number"
                min="5"
                value={formData.view_duration}
                onChange={(e) => handleChange('view_duration', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxViews">Maks. wyświetleń</Label>
              <Input
                id="maxViews"
                type="number"
                min="1"
                value={formData.max_views}
                onChange={(e) => handleChange('max_views', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Kategoria</Label>
              <Select value={formData.category} onValueChange={(v) => handleChange('category', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL strony / Link partnerski</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => handleChange('url', e.target.value)}
              placeholder="https://..."
            />
            <p className="text-xs text-slate-500">
              Wklej link partnerski (np. z TradeDoubler). Strona otworzy się w nowej karcie podczas oglądania reklamy.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sieć afiliacyjna</Label>
              <Select value={formData.affiliate_network} onValueChange={(v) => handleChange('affiliate_network', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AFFILIATE_NETWORKS.map(net => (
                    <SelectItem key={net.value} value={net.value}>
                      {net.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="affiliateId">ID kampanii (opcjonalne)</Label>
              <Input
                id="affiliateId"
                value={formData.affiliate_id}
                onChange={(e) => handleChange('affiliate_id', e.target.value)}
                placeholder="np. 12345"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">URL obrazka</Label>
            <Input
              id="image"
              type="url"
              value={formData.image_url}
              onChange={(e) => handleChange('image_url', e.target.value)}
              placeholder="https://..."
            />
          </div>

          {editingAd && (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktywna</SelectItem>
                  <SelectItem value="paused">Wstrzymana</SelectItem>
                  <SelectItem value="completed">Zakończona</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Anuluj
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
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