import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  LayoutDashboard, Plus, Eye, Users, DollarSign, 
  TrendingUp, Loader2, Pencil, Trash2, AlertTriangle,
  ArrowLeft, Gift
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import AdminStatsCard from '@/components/admin/AdminStatsCard';
import AdForm from '@/components/admin/AdForm';
import PaymentRequestsTable from '@/components/admin/PaymentRequestsTable';

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

  const { data: allReferralBonuses = [] } = useQuery({
    queryKey: ['allReferralBonuses'],
    queryFn: () => base44.entities.ReferralBonus.list('-created_date')
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
      toast.success('Wniosek o wypłatę zaktualizowany!');
    }
  });

  const formatCurrency = (cents) => `${((cents || 0) / 100).toFixed(2)} zł`;

  const totalEarnings = allViews.reduce((sum, v) => sum + (v.reward_earned || 0), 0);
  const pendingPayments = paymentRequests.filter(p => p.status === 'pending');
  const totalPaid = paymentRequests.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const totalReferralBonuses = allReferralBonuses.reduce((sum, b) => sum + (b.bonus_amount || 0), 0);
  const usersWithReferrals = users.filter(u => u.referred_by).length;

  const statusColors = {
    active: 'bg-emerald-100 text-emerald-700',
    paused: 'bg-amber-100 text-amber-700',
    completed: 'bg-slate-100 text-slate-700'
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 mx-auto text-amber-500 mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Brak dostępu</h1>
          <p className="text-slate-500 mb-6">Nie masz uprawnień do wyświetlenia tej strony.</p>
          <Link to={createPageUrl('Dashboard')}>
            <Button className="bg-emerald-500 hover:bg-emerald-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Wróć do panelu
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Panel administratora</h1>
            <p className="text-slate-500 mt-1">Zarządzaj reklamami i wypłatami</p>
          </div>
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="outline">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Panel użytkownika
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <AdminStatsCard
            title="Użytkownicy"
            value={users.length}
            icon={Users}
            color="blue"
          />
          <AdminStatsCard
            title="Aktywne reklamy"
            value={ads.filter(a => a.status === 'active').length}
            icon={Eye}
            color="emerald"
          />
          <AdminStatsCard
            title="Łączne zarobki"
            value={formatCurrency(totalEarnings)}
            icon={TrendingUp}
            color="purple"
            subtitle="Za reklamy"
          />
          <AdminStatsCard
            title="Bonusy za polecenia"
            value={formatCurrency(totalReferralBonuses)}
            icon={Gift}
            color="rose"
            subtitle={`${usersWithReferrals} poleconych`}
          />
          <AdminStatsCard
            title="Oczekujące wypłaty"
            value={pendingPayments.length}
            icon={DollarSign}
            color="amber"
          />
        </div>

        <Tabs defaultValue="ads" className="space-y-6">
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="ads" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
              Reklamy
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
              Wnioski o wypłatę
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
              Użytkownicy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ads">
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-900">Wszystkie reklamy</h2>
                <Button
                  onClick={() => { setEditingAd(null); setShowAdForm(true); }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Dodaj nową
                </Button>
              </div>
              
              {adsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tytuł</TableHead>
                      <TableHead>Nagroda</TableHead>
                      <TableHead>Wyświetlenia</TableHead>
                      <TableHead>Czas</TableHead>
                      <TableHead>Kategoria</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Akcje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ads.map((ad) => (
                      <TableRow key={ad.id}>
                        <TableCell className="font-medium">{ad.title}</TableCell>
                        <TableCell>{formatCurrency(ad.reward_amount)}</TableCell>
                        <TableCell>{ad.current_views || 0} / {ad.max_views}</TableCell>
                        <TableCell>{ad.view_duration || 30}s</TableCell>
                        <TableCell className="capitalize">{ad.category}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[ad.status]}>{ad.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setEditingAd(ad); setShowAdForm(true); }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDeleteAd(ad)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          <TabsContent value="payments">
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-xl font-semibold text-slate-900">Wnioski o wypłatę</h2>
              </div>
              <PaymentRequestsTable
                requests={paymentRequests}
                onApprove={(req) => updatePaymentMutation.mutate({ id: req.id, status: 'approved' })}
                onReject={(req) => updatePaymentMutation.mutate({ id: req.id, status: 'rejected' })}
                onMarkPaid={(req) => updatePaymentMutation.mutate({ id: req.id, status: 'paid' })}
                isLoading={updatePaymentMutation.isPending}
              />
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-xl font-semibold text-slate-900">Wszyscy użytkownicy</h2>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Imię</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Łączne zarobki</TableHead>
                    <TableHead>Z poleceń</TableHead>
                    <TableHead>Obejrzane</TableHead>
                    <TableHead>Polecony przez</TableHead>
                    <TableHead>Rola</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => {
                    const referrer = u.referred_by ? users.find(user => user.id === u.referred_by) : null;
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.full_name || '-'}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{formatCurrency(u.balance)}</TableCell>
                        <TableCell>{formatCurrency(u.total_earned)}</TableCell>
                        <TableCell>
                          {u.referral_earnings > 0 ? (
                            <span className="text-purple-600 font-medium">{formatCurrency(u.referral_earnings)}</span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>{u.ads_viewed || 0}</TableCell>
                        <TableCell>
                          {referrer ? (
                            <span className="text-sm text-slate-500">{referrer.full_name || referrer.email}</span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}>
                            {u.role || 'user'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <AdForm
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

      <AlertDialog open={!!deleteAd} onOpenChange={() => setDeleteAd(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuń reklamę</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz usunąć "{deleteAd?.title}"? Tej operacji nie można cofnąć.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAdMutation.mutate(deleteAd?.id)}
              className="bg-red-500 hover:bg-red-600"
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}