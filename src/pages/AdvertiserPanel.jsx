import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { 
  TrendingUp, Plus, Eye, Coins, CreditCard, BarChart3, Target,
  Loader2, Pencil, Pause, Play, Trash2, FileText, AlertTriangle,
  CheckCircle, XCircle, Clock, Shield, Brain, Wand2, Sparkles
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import AdvertiserCampaignForm from '@/components/advertiser/AdvertiserCampaignForm.jsx';
import AdvertiserFraudDashboard from '@/components/advertiser/AdvertiserFraudDashboard.jsx';
import AdvertiserBilling from '@/components/advertiser/AdvertiserBilling.jsx';
import NoCodeBuilder from '@/components/advertiser/NoCodeBuilder.jsx';
import ProductFeedCreator from '@/components/advertiser/ProductFeedCreator.jsx';
import AdvancedTargeting from '@/components/advertiser/AdvancedTargeting.jsx';
import AIAdGenerator from '@/components/advertiser/AIAdGenerator.jsx';
import AIBidOptimizer from '@/components/advertiser/AIBidOptimizer.jsx';
import AIPredictiveAnalysis from '@/components/advertiser/AIPredictiveAnalysis.jsx';

export default function AdvertiserPanel() {
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [creativeData, setCreativeData] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['myCampaigns', user?.id],
    queryFn: () => base44.entities.AdvertiserCampaign.filter({ advertiser_id: user?.id }, '-created_date'),
    enabled: !!user?.id
  });

  const { data: settings = [] } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: () => base44.entities.SiteSettings.list()
  });

  const getSetting = (key, defaultValue) => {
    const setting = settings.find(s => s.setting_key === key);
    return setting ? setting.setting_value : defaultValue;
  };

  const advertiserFraudEnabled = getSetting('advertiser_fraud_dashboard', 'true') === 'true';

  const updateCampaignMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AdvertiserCampaign.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myCampaigns'] });
      toast.success('Kampania zaktualizowana!');
    }
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: (id) => base44.entities.AdvertiserCampaign.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myCampaigns'] });
      toast.success('Kampania usunięta!');
    }
  });

  const statusConfig = {
    draft: { color: 'bg-slate-500/20 text-slate-400', icon: FileText, label: 'Szkic' },
    pending_review: { color: 'bg-amber-500/20 text-amber-400', icon: Clock, label: 'Do akceptacji' },
    active: { color: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle, label: 'Aktywna' },
    paused: { color: 'bg-blue-500/20 text-blue-400', icon: Pause, label: 'Wstrzymana' },
    completed: { color: 'bg-purple-500/20 text-purple-400', icon: CheckCircle, label: 'Zakończona' },
    rejected: { color: 'bg-red-500/20 text-red-400', icon: XCircle, label: 'Odrzucona' }
  };

  const totalSpent = campaigns.reduce((sum, c) => sum + (c.budget_spent || 0), 0);
  const totalViews = campaigns.reduce((sum, c) => sum + (c.current_views || 0), 0);
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

  if (!user?.is_advertiser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <TrendingUp className="w-16 h-16 mx-auto text-purple-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Panel Reklamodawcy</h2>
          <p className="text-slate-400 mb-6">Aby uzyskać dostęp, aktywuj konto reklamodawcy</p>
          <Button
            onClick={async () => {
              await base44.auth.updateMe({ is_advertiser: true });
              queryClient.invalidateQueries({ queryKey: ['currentUser'] });
              toast.success('Konto reklamodawcy aktywowane!');
            }}
            className="bg-gradient-to-r from-purple-600 to-cyan-600"
          >
            Aktywuj konto reklamodawcy
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white">Panel Reklamodawcy</h1>
            <p className="text-slate-400 mt-1">Zarządzaj kampaniami reklamowymi</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-full border border-purple-500/30">
              <span className="text-slate-400 text-sm">Saldo: </span>
              <span className="text-white font-bold">{((user?.advertiser_balance || 0) / 100).toFixed(2)} zł</span>
            </div>
            <Button
              onClick={() => { setEditingCampaign(null); setShowCampaignForm(true); }}
              className="bg-gradient-to-r from-purple-600 to-cyan-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nowa kampania
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Aktywne kampanie</p>
                  <p className="text-2xl font-bold text-white">{activeCampaigns}</p>
                </div>
                <Target className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Wyświetlenia</p>
                  <p className="text-2xl font-bold text-white">{totalViews.toLocaleString()}</p>
                </div>
                <Eye className="w-8 h-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Wydano</p>
                  <p className="text-2xl font-bold text-emerald-400">{(totalSpent / 100).toFixed(2)} zł</p>
                </div>
                <Coins className="w-8 h-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Avg CTR</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {campaigns.length > 0 ? '2.4%' : '0%'}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="campaigns" className="space-y-6">
          <TabsList className="bg-[#1a1a2e] border border-purple-500/20 p-1">
            <TabsTrigger value="campaigns" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <Target className="w-4 h-4 mr-2" /> Kampanie
            </TabsTrigger>
            <TabsTrigger value="builder" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <Pencil className="w-4 h-4 mr-2" /> No-Code Builder
            </TabsTrigger>
            <TabsTrigger value="products" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <Eye className="w-4 h-4 mr-2" /> Produkty
            </TabsTrigger>
            <TabsTrigger value="targeting" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <Target className="w-4 h-4 mr-2" /> Targetowanie
            </TabsTrigger>
            <TabsTrigger value="ai-generator" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <Wand2 className="w-4 h-4 mr-2" /> AI Teksty
            </TabsTrigger>
            <TabsTrigger value="ai-bids" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <Sparkles className="w-4 h-4 mr-2" /> AI Stawki
            </TabsTrigger>
            <TabsTrigger value="ai-analysis" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <Brain className="w-4 h-4 mr-2" /> AI Analiza
            </TabsTrigger>
            <TabsTrigger value="billing" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <CreditCard className="w-4 h-4 mr-2" /> Billing
            </TabsTrigger>
            {advertiserFraudEnabled && (
              <TabsTrigger value="fraud" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                <Shield className="w-4 h-4 mr-2" /> Anti-Fraud
              </TabsTrigger>
            )}
          </TabsList>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns">
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">Twoje kampanie</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                  </div>
                ) : campaigns.length > 0 ? (
                  <div className="space-y-4">
                    {campaigns.map((campaign) => {
                      const config = statusConfig[campaign.status] || statusConfig.draft;
                      const Icon = config.icon;
                      const progress = campaign.target_views 
                        ? (campaign.current_views / campaign.target_views) * 100 
                        : 0;
                      
                      return (
                        <motion.div
                          key={campaign.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-xl bg-slate-800/50 border border-purple-500/20"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-white font-semibold">{campaign.name}</h3>
                              <p className="text-slate-400 text-sm">{campaign.title}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={config.color}>
                                <Icon className="w-3 h-3 mr-1" />
                                {config.label}
                              </Badge>
                              <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                                {campaign.campaign_type?.toUpperCase()}
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-4 mb-3 text-sm">
                            <div>
                              <p className="text-slate-500">Budżet</p>
                              <p className="text-white">{(campaign.budget_total / 100).toFixed(2)} zł</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Wydano</p>
                              <p className="text-emerald-400">{(campaign.budget_spent / 100).toFixed(2)} zł</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Wyświetlenia</p>
                              <p className="text-white">{campaign.current_views || 0} / {campaign.target_views || '∞'}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Koszt/akcję</p>
                              <p className="text-white">{(campaign.cost_per_action / 100).toFixed(2)} zł</p>
                            </div>
                          </div>

                          {campaign.target_views && (
                            <Progress value={progress} className="h-2 bg-slate-700 mb-3" />
                          )}

                          {campaign.status === 'rejected' && campaign.rejection_reason && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 mb-3">
                              <p className="text-red-400 text-sm">
                                <AlertTriangle className="w-4 h-4 inline mr-1" />
                                Powód odrzucenia: {campaign.rejection_reason}
                              </p>
                            </div>
                          )}

                          <div className="flex gap-2">
                            {campaign.status === 'active' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-amber-500/30 text-amber-400"
                                onClick={() => updateCampaignMutation.mutate({ id: campaign.id, data: { status: 'paused' } })}
                              >
                                <Pause className="w-4 h-4 mr-1" /> Wstrzymaj
                              </Button>
                            )}
                            {campaign.status === 'paused' && (
                              <Button
                                size="sm"
                                className="bg-emerald-600"
                                onClick={() => updateCampaignMutation.mutate({ id: campaign.id, data: { status: 'active' } })}
                              >
                                <Play className="w-4 h-4 mr-1" /> Wznów
                              </Button>
                            )}
                            {['draft', 'rejected'].includes(campaign.status) && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-purple-500/30 text-purple-400"
                                onClick={() => { setEditingCampaign(campaign); setShowCampaignForm(true); }}
                              >
                                <Pencil className="w-4 h-4 mr-1" /> Edytuj
                              </Button>
                            )}
                            {campaign.status === 'draft' && (
                              <Button
                                size="sm"
                                className="bg-purple-600"
                                onClick={() => updateCampaignMutation.mutate({ id: campaign.id, data: { status: 'pending_review' } })}
                              >
                                Wyślij do akceptacji
                              </Button>
                            )}
                            {['draft', 'rejected'].includes(campaign.status) && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-500/30 text-red-400"
                                onClick={() => deleteCampaignMutation.mutate(campaign.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Brak kampanii</p>
                    <p className="text-sm">Utwórz pierwszą kampanię reklamową</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* No-Code Builder Tab */}
          <TabsContent value="builder">
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">White-Label Builder</CardTitle>
              </CardHeader>
              <CardContent>
                <NoCodeBuilder onSave={(config) => console.log('Saved config:', config)} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">Dynamiczne kreacje produktowe</CardTitle>
              </CardHeader>
              <CardContent>
                <ProductFeedCreator onSelectProduct={(config) => console.log('Product config:', config)} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Targeting Tab */}
          <TabsContent value="targeting">
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">Zaawansowane targetowanie</CardTitle>
              </CardHeader>
              <CardContent>
                <AdvancedTargeting onChange={(config) => console.log('Targeting:', config)} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Ad Generator Tab */}
          <TabsContent value="ai-generator">
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-yellow-400" />
                  Generator tekstów AI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AIAdGenerator 
                  onApply={(data) => {
                    setCreativeData(prev => ({ ...prev, [data.type]: data.text }));
                  }} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Bid Optimizer Tab */}
          <TabsContent value="ai-bids">
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  Optymalizacja stawek AI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AIBidOptimizer 
                  onApplyBid={(bid) => console.log('Apply bid:', bid)} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Predictive Analysis Tab */}
          <TabsContent value="ai-analysis">
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Brain className="w-5 h-5 text-pink-400" />
                  Analiza predykcyjna AI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AIPredictiveAnalysis 
                  creativeData={creativeData} 
                  onOptimize={(suggestions) => console.log('Optimize:', suggestions)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing">
            <AdvertiserBilling user={user} />
          </TabsContent>

          {/* Fraud Tab */}
          {advertiserFraudEnabled && (
            <TabsContent value="fraud">
              <AdvertiserFraudDashboard campaigns={campaigns} />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Campaign Form Modal */}
      <AdvertiserCampaignForm
        isOpen={showCampaignForm}
        onClose={() => { setShowCampaignForm(false); setEditingCampaign(null); }}
        editingCampaign={editingCampaign}
        userId={user?.id}
        userEmail={user?.email}
      />
    </div>
  );
}