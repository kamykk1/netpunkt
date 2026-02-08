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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Link2, Unlink, RefreshCw, Settings, Loader2, Plus,
  CheckCircle, XCircle, ExternalLink, Download, Upload
} from 'lucide-react';

const PLATFORMS = [
  { 
    id: 'google_analytics', 
    name: 'Google Analytics', 
    icon: '📊',
    color: 'bg-orange-500',
    description: 'Śledź ruch i konwersje'
  },
  { 
    id: 'google_ads', 
    name: 'Google Ads', 
    icon: '🎯',
    color: 'bg-blue-500',
    description: 'Importuj kampanie z Google Ads'
  },
  { 
    id: 'facebook_ads', 
    name: 'Facebook Ads', 
    icon: '📘',
    color: 'bg-indigo-500',
    description: 'Synchronizuj z Meta Ads'
  },
  { 
    id: 'tiktok_ads', 
    name: 'TikTok Ads', 
    icon: '🎵',
    color: 'bg-slate-800',
    description: 'Integracja z TikTok For Business'
  },
  { 
    id: 'linkedin_ads', 
    name: 'LinkedIn Ads', 
    icon: '💼',
    color: 'bg-sky-600',
    description: 'Kampanie B2B'
  },
];

export default function MarketingIntegrations({ advertiserId }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [formData, setFormData] = useState({
    account_id: '',
    api_key: '',
    access_token: ''
  });
  const queryClient = useQueryClient();

  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ['marketingIntegrations', advertiserId],
    queryFn: () => base44.entities.MarketingIntegration.filter({ advertiser_id: advertiserId }),
    enabled: !!advertiserId
  });

  const connectMutation = useMutation({
    mutationFn: (data) => base44.entities.MarketingIntegration.create({
      ...data,
      advertiser_id: advertiserId,
      is_connected: true,
      last_sync: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketingIntegrations'] });
      toast.success('Integracja połączona!');
      setShowModal(false);
      resetForm();
    }
  });

  const disconnectMutation = useMutation({
    mutationFn: (id) => base44.entities.MarketingIntegration.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketingIntegrations'] });
      toast.success('Integracja odłączona!');
    }
  });

  const syncMutation = useMutation({
    mutationFn: async (integration) => {
      // Symulacja synchronizacji
      await new Promise(r => setTimeout(r, 2000));
      return base44.entities.MarketingIntegration.update(integration.id, {
        last_sync: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketingIntegrations'] });
      toast.success('Dane zsynchronizowane!');
    }
  });

  const toggleSyncMutation = useMutation({
    mutationFn: ({ id, sync_enabled }) => 
      base44.entities.MarketingIntegration.update(id, { sync_enabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marketingIntegrations'] })
  });

  const resetForm = () => {
    setFormData({ account_id: '', api_key: '', access_token: '' });
    setSelectedPlatform(null);
  };

  const openConnectModal = (platform) => {
    setSelectedPlatform(platform);
    setShowModal(true);
  };

  const handleConnect = () => {
    if (!selectedPlatform) return;
    connectMutation.mutate({
      platform: selectedPlatform.id,
      ...formData
    });
  };

  const getIntegration = (platformId) => 
    integrations.find(i => i.platform === platformId);

  return (
    <div className="space-y-6">
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Link2 className="w-5 h-5 text-cyan-400" />
            Integracje marketingowe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PLATFORMS.map((platform) => {
              const integration = getIntegration(platform.id);
              const isConnected = !!integration?.is_connected;
              
              return (
                <div 
                  key={platform.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isConnected 
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : 'bg-slate-800/50 border-purple-500/20 hover:border-purple-500/40'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl ${platform.color} flex items-center justify-center text-2xl`}>
                        {platform.icon}
                      </div>
                      <div>
                        <p className="text-white font-semibold">{platform.name}</p>
                        <p className="text-slate-400 text-xs">{platform.description}</p>
                      </div>
                    </div>
                  </div>
                  
                  {isConnected ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400 text-sm">Połączono</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Auto-sync</span>
                        <Switch
                          checked={integration.sync_enabled}
                          onCheckedChange={(v) => toggleSyncMutation.mutate({ 
                            id: integration.id, 
                            sync_enabled: v 
                          })}
                        />
                      </div>
                      
                      {integration.last_sync && (
                        <p className="text-slate-500 text-xs">
                          Ostatnia sync: {new Date(integration.last_sync).toLocaleString('pl-PL')}
                        </p>
                      )}
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-purple-500/30 text-purple-400"
                          onClick={() => syncMutation.mutate(integration)}
                          disabled={syncMutation.isPending}
                        >
                          {syncMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3 h-3 mr-1" />
                          )}
                          Sync
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/30 text-red-400"
                          onClick={() => disconnectMutation.mutate(integration.id)}
                        >
                          <Unlink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      onClick={() => openConnectModal(platform)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Połącz
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Import/Export Section */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white">Import / Export danych</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-purple-500/20">
              <div className="flex items-center gap-3 mb-3">
                <Download className="w-6 h-6 text-cyan-400" />
                <div>
                  <p className="text-white font-medium">Import kampanii</p>
                  <p className="text-slate-400 text-xs">Importuj dane z zewnętrznych platform</p>
                </div>
              </div>
              <Button variant="outline" className="w-full border-cyan-500/30 text-cyan-400">
                Importuj CSV
              </Button>
            </div>
            
            <div className="p-4 rounded-xl bg-slate-800/50 border border-purple-500/20">
              <div className="flex items-center gap-3 mb-3">
                <Upload className="w-6 h-6 text-emerald-400" />
                <div>
                  <p className="text-white font-medium">Eksport danych</p>
                  <p className="text-slate-400 text-xs">Pobierz dane kampanii jako CSV</p>
                </div>
              </div>
              <Button variant="outline" className="w-full border-emerald-500/30 text-emerald-400">
                Eksportuj dane
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connect Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-[#1a1a2e] border-purple-500/30 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedPlatform && (
                <>
                  <span className="text-2xl">{selectedPlatform.icon}</span>
                  Połącz z {selectedPlatform.name}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">ID konta</Label>
              <Input
                value={formData.account_id}
                onChange={(e) => setFormData({...formData, account_id: e.target.value})}
                placeholder="np. UA-123456789"
                className="bg-slate-800 border-purple-500/30 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">API Key</Label>
              <Input
                type="password"
                value={formData.api_key}
                onChange={(e) => setFormData({...formData, api_key: e.target.value})}
                placeholder="Twój klucz API"
                className="bg-slate-800 border-purple-500/30 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">Access Token (opcjonalnie)</Label>
              <Input
                type="password"
                value={formData.access_token}
                onChange={(e) => setFormData({...formData, access_token: e.target.value})}
                placeholder="Token dostępu"
                className="bg-slate-800 border-purple-500/30 text-white"
              />
            </div>
            
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-amber-300 text-sm">
                ⚠️ Upewnij się, że klucze API mają odpowiednie uprawnienia do odczytu danych kampanii.
              </p>
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
                onClick={handleConnect}
                disabled={!formData.account_id || connectMutation.isPending}
                className="flex-1 bg-purple-600"
              >
                {connectMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Link2 className="w-4 h-4 mr-2" />
                )}
                Połącz
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}