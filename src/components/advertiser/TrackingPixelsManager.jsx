import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Code, Plus, Trash2, Copy, CheckCircle, Eye,
  Loader2, Activity, Settings
} from 'lucide-react';

const PIXEL_TYPES = [
  { id: 'facebook', name: 'Facebook Pixel', icon: '📘' },
  { id: 'google_analytics', name: 'Google Analytics', icon: '📊' },
  { id: 'google_ads', name: 'Google Ads', icon: '🎯' },
  { id: 'custom', name: 'Własny kod', icon: '⚙️' },
];

const EVENT_TYPES = [
  { id: 'page_view', name: 'Wyświetlenie strony' },
  { id: 'click', name: 'Kliknięcie' },
  { id: 'conversion', name: 'Konwersja' },
  { id: 'lead', name: 'Lead' },
  { id: 'purchase', name: 'Zakup' },
];

export default function TrackingPixelsManager({ advertiserId, campaigns = [] }) {
  const [showModal, setShowModal] = useState(false);
  const [editingPixel, setEditingPixel] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    pixel_type: 'facebook',
    pixel_id: '',
    event_type: 'page_view',
    campaign_id: '',
    custom_code: ''
  });
  const [copiedId, setCopiedId] = useState(null);
  const queryClient = useQueryClient();

  const { data: pixels = [], isLoading } = useQuery({
    queryKey: ['trackingPixels', advertiserId],
    queryFn: () => base44.entities.TrackingPixel.filter({ advertiser_id: advertiserId }),
    enabled: !!advertiserId
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TrackingPixel.create({
      ...data,
      advertiser_id: advertiserId
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trackingPixels'] });
      toast.success('Pixel utworzony!');
      setShowModal(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TrackingPixel.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trackingPixels'] });
      toast.success('Pixel zaktualizowany!');
      setShowModal(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TrackingPixel.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trackingPixels'] });
      toast.success('Pixel usunięty!');
    }
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.TrackingPixel.update(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trackingPixels'] })
  });

  const resetForm = () => {
    setFormData({
      name: '',
      pixel_type: 'facebook',
      pixel_id: '',
      event_type: 'page_view',
      campaign_id: '',
      custom_code: ''
    });
    setEditingPixel(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (pixel) => {
    setEditingPixel(pixel);
    setFormData({
      name: pixel.name,
      pixel_type: pixel.pixel_type,
      pixel_id: pixel.pixel_id || '',
      event_type: pixel.event_type,
      campaign_id: pixel.campaign_id || '',
      custom_code: pixel.custom_code || ''
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (editingPixel) {
      updateMutation.mutate({ id: editingPixel.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const copyPixelCode = (pixel) => {
    let code = '';
    if (pixel.pixel_type === 'facebook') {
      code = `<!-- Facebook Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixel.pixel_id}');
fbq('track', 'PageView');
</script>`;
    } else if (pixel.pixel_type === 'google_analytics') {
      code = `<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${pixel.pixel_id}"></script>
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${pixel.pixel_id}');
</script>`;
    } else {
      code = pixel.custom_code || '';
    }
    
    navigator.clipboard.writeText(code);
    setCopiedId(pixel.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Kod skopiowany!');
  };

  return (
    <div className="space-y-6">
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Code className="w-5 h-5 text-cyan-400" />
            Pixele śledzące
          </CardTitle>
          <Button onClick={openCreateModal} className="bg-purple-600">
            <Plus className="w-4 h-4 mr-2" />
            Dodaj pixel
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : pixels.length > 0 ? (
            <div className="space-y-3">
              {pixels.map((pixel) => {
                const typeConfig = PIXEL_TYPES.find(t => t.id === pixel.pixel_type);
                const eventConfig = EVENT_TYPES.find(e => e.id === pixel.event_type);
                
                return (
                  <div 
                    key={pixel.id}
                    className="p-4 rounded-xl bg-slate-800/50 border border-purple-500/20"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{typeConfig?.icon || '⚙️'}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-medium">{pixel.name}</p>
                            <Badge className={pixel.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}>
                              {pixel.is_active ? 'Aktywny' : 'Nieaktywny'}
                            </Badge>
                          </div>
                          <p className="text-slate-400 text-sm">{typeConfig?.name}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            <span>Event: {eventConfig?.name}</span>
                            <span>ID: {pixel.pixel_id || 'Custom'}</span>
                            <span className="flex items-center gap-1">
                              <Activity className="w-3 h-3" />
                              {pixel.fires_count || 0} wywołań
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={pixel.is_active}
                          onCheckedChange={(v) => toggleMutation.mutate({ id: pixel.id, is_active: v })}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-purple-500/30 text-purple-400"
                          onClick={() => copyPixelCode(pixel)}
                        >
                          {copiedId === pixel.id ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-purple-500/30 text-purple-400"
                          onClick={() => openEditModal(pixel)}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/30 text-red-400"
                          onClick={() => deleteMutation.mutate(pixel.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Code className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Brak pixeli śledzących</p>
              <p className="text-sm">Dodaj pixel aby śledzić konwersje</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-[#1a1a2e] border-purple-500/30 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPixel ? 'Edytuj pixel' : 'Nowy pixel śledzący'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Nazwa pixela</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="np. FB Pixel - Główny"
                className="bg-slate-800 border-purple-500/30 text-white"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Typ pixela</Label>
                <Select 
                  value={formData.pixel_type} 
                  onValueChange={(v) => setFormData({...formData, pixel_type: v})}
                >
                  <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-purple-500/30">
                    {PIXEL_TYPES.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.icon} {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-300">Typ eventu</Label>
                <Select 
                  value={formData.event_type} 
                  onValueChange={(v) => setFormData({...formData, event_type: v})}
                >
                  <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-purple-500/30">
                    {EVENT_TYPES.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {formData.pixel_type !== 'custom' && (
              <div className="space-y-2">
                <Label className="text-slate-300">ID Pixela</Label>
                <Input
                  value={formData.pixel_id}
                  onChange={(e) => setFormData({...formData, pixel_id: e.target.value})}
                  placeholder={formData.pixel_type === 'facebook' ? 'np. 123456789012345' : 'np. UA-123456789-1'}
                  className="bg-slate-800 border-purple-500/30 text-white"
                />
              </div>
            )}
            
            {formData.pixel_type === 'custom' && (
              <div className="space-y-2">
                <Label className="text-slate-300">Własny kod</Label>
                <Textarea
                  value={formData.custom_code}
                  onChange={(e) => setFormData({...formData, custom_code: e.target.value})}
                  placeholder="<script>...</script>"
                  className="bg-slate-800 border-purple-500/30 text-white font-mono text-sm h-32"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label className="text-slate-300">Kampania (opcjonalnie)</Label>
              <Select 
                value={formData.campaign_id} 
                onValueChange={(v) => setFormData({...formData, campaign_id: v})}
              >
                <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white">
                  <SelectValue placeholder="Wszystkie kampanie" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-purple-500/30">
                  <SelectItem value={null}>Wszystkie kampanie</SelectItem>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => { setShowModal(false); resetForm(); }}
                className="flex-1 border-slate-600"
              >
                Anuluj
              </Button>
              <Button
                onClick={handleSave}
                disabled={!formData.name || createMutation.isPending || updateMutation.isPending}
                className="flex-1 bg-purple-600"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                )}
                {editingPixel ? 'Zapisz' : 'Utwórz'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}