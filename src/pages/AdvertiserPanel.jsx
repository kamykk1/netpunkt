import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, Plus, Eye, Coins, CreditCard, BarChart3, Target,
  Loader2, Pencil, Pause, Play, Trash2, FileText, AlertTriangle,
  CheckCircle, XCircle, Clock, Shield, Brain, Wand2, Sparkles,
  Link2, Code, Bell, PieChart
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
import MarketingIntegrations from '@/components/advertiser/MarketingIntegrations.jsx';
import TrackingPixelsManager from '@/components/advertiser/TrackingPixelsManager.jsx';
import AdvancedCampaignReporting from '@/components/advertiser/AdvancedCampaignReporting.jsx';
import NotificationSettingsPanel from '@/components/notifications/NotificationSettingsPanel.jsx';
import CampaignBulkActions from '@/components/advertiser/CampaignBulkActions.jsx';
import { ExchangeRatesTable, CurrencySelector, formatCurrency } from '@/components/advertiser/CurrencySelector.jsx';
import { sendNotification } from '@/components/notifications/notificationHelpers.jsx';

export default function AdvertiserPanel() {
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [creativeData, setCreativeData] = useState(null);
  const [currency, setCurrency] = useState('PLN');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['myCampaigns', user?.id],
    queryFn: () => base44.entities.AdvertiserCampaign.filter({ advertiser_id: user?.id }, '-created_date'),
    enabled: !!user?.id,
    onSuccess: async (data) => {
      if (!user?.id) return;
      for (const c of data) {
        // Low budget warning
        if (c.status === 'active' && c.budget_total > 0) {
          const pct = (c.budget_spent || 0) / c.budget_total;
          if (pct >= 0.8) {
            await sendNotification({
              userId: user.id, userEmail: user.email,
              type: 'campaign_budget_low',
              title: `Niski budżet kampanii: ${c.name}`,
              message: `Kampania "${c.name}" zużyła ${Math.round(pct * 100)}% budżetu. Doładuj konto, aby kontynuować.`,
              referenceId: c.id, referenceType: 'campaign',
              sendEmail: true
            });
          }
        }
        // Completed campaign notification
        if (c.status === 'completed') {
          await sendNotification({
            userId: user.id, userEmail: user.email,
            type: 'campaign_goal_reached',
            title: `Kampania zakończona: ${c.name}`,
            message: `Kampania "${c.name}" osiągnęła cel (${c.current_views || 0} wyświetleń).`,
            referenceId: c.id, referenceType: 'campaign',
            sendEmail: true
          });
        }
      }
    }
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
        <div className="text-center max-w-sm px-4">
          <TrendingUp className="w-16 h-16 mx-auto text-purple-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Panel Reklamodawcy</h2>
          <p className="text-slate-400 mb-6">Załóż konto reklamodawcy i dotrzyj do tysięcy użytkowników!</p>
          <Link to={createPageUrl('AdvertiserRegister')}>
            <Button className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 mb-3">
              Zarejestruj konto reklamodawcy
            </Button>
          </Link>
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
          <div className="flex items-center gap-4 flex-wrap">
            <CurrencySelector value={currency} onChange={setCurrency} />
            <div className="px-4 py-2 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-full border border-purple-500/30">
              <span className="text-slate-400 text-sm">Saldo: </span>
              <span className="text-white font-bold">{formatCurrency(user?.advertiser_balance || 0, currency)}</span>
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
            <TabsTrigger value="reporting" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <PieChart className="w-4 h-4 mr-2" /> Raporty
            </TabsTrigger>
            <TabsTrigger value="integrations" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <Link2 className="w-4 h-4 mr-2" /> Integracje
            </TabsTrigger>
            <TabsTrigger value="pixels" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <Code className="w-4 h-4 mr-2" /> Pixele
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <Bell className="w-4 h-4 mr-2" /> Powiadomienia
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
                  <CampaignBulkActions 
                    campaigns={campaigns}
                    onEdit={(campaign) => { setEditingCampaign(campaign); setShowCampaignForm(true); }}
                  />
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

          {/* Reporting Tab */}
          <TabsContent value="reporting">
            <AdvancedCampaignReporting campaigns={campaigns} />
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations">
            <MarketingIntegrations advertiserId={user?.id} />
          </TabsContent>

          {/* Tracking Pixels Tab */}
          <TabsContent value="pixels">
            <TrackingPixelsManager advertiserId={user?.id} campaigns={campaigns} />
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <NotificationSettingsPanel userId={user?.id} />
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing">
            <div className="space-y-6">
              <AdvertiserBilling user={user} />
              <ExchangeRatesTable />
              <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Zarządzaj subskrypcją i fakturami</p>
                  <p className="text-slate-400 text-sm">Zmień plan, pobierz faktury, zarządzaj kartą płatniczą</p>
                </div>
                <Link to={createPageUrl('AdvertiserSubscriptions')}>
                  <Button className="bg-purple-600 shrink-0">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Subskrypcje
                  </Button>
                </Link>
              </div>
            </div>
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