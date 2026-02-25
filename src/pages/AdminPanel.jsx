import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  LayoutDashboard, Plus, Eye, Users, Coins, TrendingUp, Loader2, 
  Pencil, Trash2, AlertTriangle, ArrowLeft, Gift, Settings, 
  Mail, ShoppingBag, Target, Zap, Shield, CreditCard, BarChart3,
  Crown, FileText, Flag, Gamepad2, Briefcase
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AdminAdForm from '@/components/admin/AdminAdForm.jsx';
import AdminSettingsForm from '@/components/admin/AdminSettingsForm.jsx';
import AdminEmailCampaigns from '@/components/admin/AdminEmailCampaigns.jsx';
import AdminEmailTemplates from '@/components/admin/AdminEmailTemplates.jsx';
import AdminPartnerPrograms from '@/components/admin/AdminPartnerPrograms.jsx';
import AdminContactMessages from '@/components/admin/AdminContactMessages.jsx';
import AdminPayoutSchedule from '@/components/admin/AdminPayoutSchedule.jsx';
import AdminSubscriptions from '@/components/admin/AdminSubscriptions.jsx';
import AdminInvoices from '@/components/admin/AdminInvoices.jsx';
import AdminTransactionHistory from '@/components/admin/AdminTransactionHistory.jsx';
import AdminGameReports from '@/components/admin/AdminGameReports.jsx';
import AdminRecruitment from '@/components/admin/AdminRecruitment.jsx';
import AdminUsersList from '@/components/admin/AdminUsersList.jsx';
import AdminFortuneWheel from '@/components/admin/AdminFortuneWheel.jsx';

export default function AdminPanel() {
  const [showAdForm, setShowAdForm] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [deleteAd, setDeleteAd] = useState(null);
  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: ads = [], isLoading: adsLoading } = useQuery({
    queryKey: ['allAds'],
    queryFn: () => base44.entities.Advertisement.list('-created_date')
  });

  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: paymentRequests = [] } = useQuery({
    queryKey: ['allPayments'],
    queryFn: () => base44.entities.PaymentRequest.list('-created_date')
  });

  const { data: allViews = [] } = useQuery({
    queryKey: ['allViews'],
    queryFn: () => base44.entities.AdView.list('-created_date', 100)
  });

  const { data: settings = [] } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: () => base44.entities.SiteSettings.list()
  });

  const { data: fraudScores = [] } = useQuery({
    queryKey: ['fraudScores'],
    queryFn: () => base44.entities.FraudScore.filter({ risk_level: 'high' }, '-score', 10)
  });

  const createAdMutation = useMutation({
    mutationFn: (data) => base44.entities.Advertisement.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allAds'] });
      setShowAdForm(false);
      toast.success('Reklama została utworzona!');
    }
  });

  const updateAdMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Advertisement.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allAds'] });
      setShowAdForm(false);
      setEditingAd(null);
      toast.success('Reklama została zaktualizowana!');
    }
  });

  const deleteAdMutation = useMutation({
    mutationFn: (id) => base44.entities.Advertisement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allAds'] });
      setDeleteAd(null);
      toast.success('Reklama została usunięta!');
    }
  });

  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.PaymentRequest.update(id, { 
      status,
      processed_date: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPayments'] });
      toast.success('Status wypłaty zaktualizowany!');
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast.success('Użytkownik zaktualizowany!');
    }
  });

  const getSetting = (key, defaultValue) => {
    const setting = settings.find(s => s.setting_key === key);
    return setting ? setting.setting_value : defaultValue;
  };

  const pointRate = parseFloat(getSetting('point_rate', '0.10'));
  const totalPointsEarned = allViews.reduce((sum, v) => sum + (v.reward_earned || 0), 0);
  const pendingPayments = paymentRequests.filter(p => p.status === 'pending');
  const totalUsers = users.length;
  const activeAds = ads.filter(a => a.status === 'active').length;

  const statusColors = {
    pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    paused: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30'
  };

  const adTypeLabels = {
    ptc: 'PTC',
    ptr: 'PTR',
    ptv: 'PTV',
    email: 'Email'
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (user?.role !== 'admin' && !user?.is_moderator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 mx-auto text-amber-500 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Brak dostępu</h1>
          <p className="text-slate-400 mb-6">Nie masz uprawnień do tej strony.</p>
          <Link to={createPageUrl('Dashboard')}>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Wróć do panelu
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
            <h1 className="text-3xl font-bold text-white">Panel Administratora</h1>
            <p className="text-slate-400 mt-1">Zarządzaj platformą netpunkt.pl</p>
          </div>
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="outline" className="border-purple-500/30 text-slate-300 hover:bg-purple-500/10 hover:text-white bg-transparent">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Panel użytkownika
            </Button>
          </Link>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Użytkownicy</p>
                  <p className="text-2xl font-bold text-white">{totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Aktywne reklamy</p>
                  <p className="text-2xl font-bold text-white">{activeAds}</p>
                </div>
                <Eye className="w-8 h-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Punkty wypłacone</p>
                  <p className="text-2xl font-bold text-white">{totalPointsEarned.toLocaleString()}</p>
                </div>
                <Coins className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Wartość</p>
                  <p className="text-2xl font-bold text-emerald-400">{(totalPointsEarned * pointRate).toFixed(2)} zł</p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Oczekujące wypłaty</p>
                  <p className="text-2xl font-bold text-amber-400">{pendingPayments.length}</p>
                </div>
                <CreditCard className="w-8 h-8 text-amber-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="messages" className="space-y-6">
          <TabsList className="bg-[#1a1a2e] border border-purple-500/20 p-1 flex-wrap h-auto">
            <TabsTrigger value="messages" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-slate-400">
              <Mail className="w-4 h-4 mr-2" /> Wiadomości
            </TabsTrigger>
            <TabsTrigger value="ads" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-slate-400">
              <Eye className="w-4 h-4 mr-2" /> Reklamy
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-slate-400">
              <CreditCard className="w-4 h-4 mr-2" /> Wypłaty
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-slate-400">
              <Users className="w-4 h-4 mr-2" /> Użytkownicy
            </TabsTrigger>
            <TabsTrigger value="advertisers" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-slate-400">
              <TrendingUp className="w-4 h-4 mr-2" /> Reklamodawcy
            </TabsTrigger>
            <TabsTrigger value="emails" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-slate-400">
              <Mail className="w-4 h-4 mr-2" /> Kampanie Email
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-slate-400">
              <Settings className="w-4 h-4 mr-2" /> Ustawienia
            </TabsTrigger>
            <TabsTrigger value="fraud" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-slate-400">
              <Shield className="w-4 h-4 mr-2" /> Anti-Fraud
            </TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-slate-400">
              <Mail className="w-4 h-4 mr-2" /> Szablony
            </TabsTrigger>
            <TabsTrigger value="partners" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-slate-400">
              <Users className="w-4 h-4 mr-2" /> Partnerzy
            </TabsTrigger>
            <TabsTrigger value="payouts" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-slate-400">
              <CreditCard className="w-4 h-4 mr-2" /> Harmonogram
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-slate-400">
              <Crown className="w-4 h-4 mr-2" /> Subskrypcje
            </TabsTrigger>
            <TabsTrigger value="invoices" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-slate-400">
              <FileText className="w-4 h-4 mr-2" /> Faktury
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-slate-400">
              <TrendingUp className="w-4 h-4 mr-2" /> Transakcje
            </TabsTrigger>
            <TabsTrigger value="recruitment" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-slate-400">
              <Briefcase className="w-4 h-4 mr-2" /> Rekrutacja
            </TabsTrigger>
            <TabsTrigger value="wheel" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white text-slate-400">
              <Gift className="w-4 h-4 mr-2" /> Koło Fortuny
            </TabsTrigger>
          </TabsList>

          {/* Messages Tab (default) */}
          <TabsContent value="messages">
            <div className="space-y-6">
              <AdminContactMessages />
              <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Flag className="w-5 h-5 text-red-400" /> Zgłoszenia z Gier
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AdminGameReports />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Ads Tab */}
          <TabsContent value="ads">
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Wszystkie reklamy</CardTitle>
                <Button
                  onClick={() => { setEditingAd(null); setShowAdForm(true); }}
                  className="bg-gradient-to-r from-purple-600 to-cyan-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Dodaj reklamę
                </Button>
              </CardHeader>
              <CardContent>
                {adsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-purple-500/20">
                          <TableHead className="text-slate-400">Tytuł</TableHead>
                          <TableHead className="text-slate-400">Typ</TableHead>
                          <TableHead className="text-slate-400">Punkty</TableHead>
                          <TableHead className="text-slate-400">Wyświetlenia</TableHead>
                          <TableHead className="text-slate-400">Czas</TableHead>
                          <TableHead className="text-slate-400">Status</TableHead>
                          <TableHead className="text-slate-400">Akcje</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ads.map((ad) => (
                          <TableRow key={ad.id} className="border-purple-500/20">
                            <TableCell className="text-white font-medium">{ad.title}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                                {adTypeLabels[ad.ad_type] || 'PTC'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-yellow-400">{ad.points_reward} pkt</TableCell>
                            <TableCell className="text-slate-300">{ad.current_views || 0} / {ad.max_views}</TableCell>
                            <TableCell className="text-slate-300">{ad.view_duration || 30}s</TableCell>
                            <TableCell>
                              <Badge className={statusColors[ad.status]}>{ad.status}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-purple-500/30 text-white hover:bg-purple-500/10"
                                  onClick={() => { setEditingAd(ad); setShowAdForm(true); }}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                  onClick={() => setDeleteAd(ad)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">Wnioski o wypłatę</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-purple-500/20">
                        <TableHead className="text-slate-400">Użytkownik</TableHead>
                        <TableHead className="text-slate-400">Punkty</TableHead>
                        <TableHead className="text-slate-400">Wartość</TableHead>
                        <TableHead className="text-slate-400">Metoda</TableHead>
                        <TableHead className="text-slate-400">Status</TableHead>
                        <TableHead className="text-slate-400">Data</TableHead>
                        <TableHead className="text-slate-400">Akcje</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentRequests.map((req) => (
                        <TableRow key={req.id} className="border-purple-500/20">
                          <TableCell className="text-white">{req.user_email}</TableCell>
                          <TableCell className="text-yellow-400">{req.amount} pkt</TableCell>
                          <TableCell className="text-emerald-400">{(req.amount * pointRate).toFixed(2)} zł</TableCell>
                          <TableCell className="text-slate-300 capitalize">{req.payment_method}</TableCell>
                          <TableCell>
                            <Badge className={statusColors[req.status]}>{req.status}</Badge>
                          </TableCell>
                          <TableCell className="text-slate-400">
                            {new Date(req.created_date).toLocaleDateString('pl-PL')}
                          </TableCell>
                          <TableCell>
                            {req.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                  onClick={() => updatePaymentMutation.mutate({ id: req.id, status: 'approved' })}
                                >
                                  Zatwierdź
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-500/30 text-red-400"
                                  onClick={() => updatePaymentMutation.mutate({ id: req.id, status: 'rejected' })}
                                >
                                  Odrzuć
                                </Button>
                              </div>
                            )}
                            {req.status === 'approved' && (
                              <Button
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700"
                                onClick={() => updatePaymentMutation.mutate({ id: req.id, status: 'paid' })}
                              >
                                Wypłacono
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab - Free users only */}
          <TabsContent value="users">
            <AdminUsersList users={users.filter(u => !u.is_advertiser)} updateUserMutation={updateUserMutation} title="Użytkownicy Free" />
          </TabsContent>

          {/* Advertisers Tab */}
          <TabsContent value="advertisers">
            <AdminUsersList users={users.filter(u => u.is_advertiser)} updateUserMutation={updateUserMutation} title="Reklamodawcy" showAdvertiserBadge />
          </TabsContent>

          {/* Email Campaigns Tab */}
          <TabsContent value="emails">
            <AdminEmailCampaigns />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <AdminSettingsForm settings={settings} />
          </TabsContent>

          {/* Fraud Tab */}
          <TabsContent value="fraud">
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-400" />
                  Wykryte zagrożenia
                </CardTitle>
              </CardHeader>
              <CardContent>
                {fraudScores.length > 0 ? (
                  <div className="space-y-4">
                    {fraudScores.map((fs) => {
                      const userData = users.find(u => u.id === fs.user_id);
                      return (
                        <div key={fs.id} className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white font-medium">{userData?.email || fs.user_id}</p>
                              <p className="text-slate-400 text-sm">Score: {fs.score}/100</p>
                            </div>
                            <Badge className={
                              fs.risk_level === 'critical' ? 'bg-red-500' :
                              fs.risk_level === 'high' ? 'bg-orange-500' :
                              'bg-amber-500'
                            }>
                              {fs.risk_level}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Brak wykrytych zagrożeń</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Templates Tab */}
          <TabsContent value="templates">
            <AdminEmailTemplates />
          </TabsContent>

          {/* Partner Programs Tab */}
          <TabsContent value="partners">
            <AdminPartnerPrograms />
          </TabsContent>

          {/* Payouts Schedule Tab */}
          <TabsContent value="payouts">
            <AdminPayoutSchedule paymentRequests={paymentRequests} users={users} />
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <AdminSubscriptions />
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices">
            <AdminInvoices />
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <AdminTransactionHistory />
          </TabsContent>

          {/* Recruitment Tab */}
          <TabsContent value="recruitment">
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-purple-400" /> Zarządzanie rekrutacją
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AdminRecruitment />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fortune Wheel Tab */}
          <TabsContent value="wheel">
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Gift className="w-5 h-5 text-amber-400" /> Koło Fortuny — konfiguracja
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AdminFortuneWheel settings={settings} />
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>

      {/* Ad Form Modal */}
      <AdminAdForm
        isOpen={showAdForm}
        onClose={() => { setShowAdForm(false); setEditingAd(null); }}
        onSubmit={(data) => {
          if (editingAd) {
            updateAdMutation.mutate({ id: editingAd.id, data });
          } else {
            createAdMutation.mutate(data);
          }
        }}
        editingAd={editingAd}
        isLoading={createAdMutation.isPending || updateAdMutation.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteAd} onOpenChange={() => setDeleteAd(null)}>
        <AlertDialogContent className="bg-[#1a1a2e] border-purple-500/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Usuń reklamę</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Czy na pewno chcesz usunąć "{deleteAd?.title}"? Tej operacji nie można cofnąć.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-purple-500/30 text-white">Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAdMutation.mutate(deleteAd?.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}