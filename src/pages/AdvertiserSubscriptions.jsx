import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  CreditCard, CheckCircle, AlertTriangle, Loader2, ArrowLeft,
  Download, RefreshCw, Calendar, DollarSign, FileText, Zap, Crown
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PLANS = {
  starter: { name: 'Starter', price: 49, color: 'bg-slate-500', features: ['5 kampanii', '10 000 wyświetleń'] },
  pro: { name: 'Pro', price: 149, color: 'bg-purple-500', features: ['20 kampanii', '100 000 wyświetleń', 'AI tools'] },
  enterprise: { name: 'Enterprise', price: 499, color: 'bg-yellow-500', features: ['Unlimited', 'White-label', 'Dedicated manager'] },
};

// Mock invoices
const mockInvoices = [
  { id: 'INV-2024-001', date: '2024-01-01', amount: 149, plan: 'Pro', status: 'paid', currency: 'PLN' },
  { id: 'INV-2024-002', date: '2024-02-01', amount: 149, plan: 'Pro', status: 'paid', currency: 'PLN' },
  { id: 'INV-2024-003', date: '2024-03-01', amount: 149, plan: 'Pro', status: 'paid', currency: 'PLN' },
];

export default function AdvertiserSubscriptions() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const changePlanMutation = useMutation({
    mutationFn: async (newPlan) => {
      await base44.auth.updateMe({ advertiser_plan: newPlan });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Plan zmieniony!');
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      await base44.auth.updateMe({ advertiser_plan: null, is_advertiser: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Subskrypcja anulowana');
    }
  });

  const currentPlan = PLANS[user?.advertiser_plan] || PLANS.pro;
  const nextBillingDate = new Date();
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!user?.is_advertiser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 mx-auto text-amber-500 mb-4" />
          <h2 className="text-xl font-bold text-white mb-4">Brak aktywnej subskrypcji</h2>
          <Link to={createPageUrl('AdvertiserRegister')}>
            <Button className="bg-purple-600">Kup plan reklamodawcy</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Subskrypcje i faktury</h1>
            <p className="text-slate-400 mt-1">Zarządzaj planem i płatnościami</p>
          </div>
          <Link to={createPageUrl('AdvertiserPanel')}>
            <Button variant="outline" className="border-purple-500/30 text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Panel
            </Button>
          </Link>
        </motion.div>

        <Tabs defaultValue="subscription" className="space-y-6">
          <TabsList className="bg-[#1a1a2e] border border-purple-500/20 p-1">
            <TabsTrigger value="subscription" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <Crown className="w-4 h-4 mr-2" /> Subskrypcja
            </TabsTrigger>
            <TabsTrigger value="invoices" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <FileText className="w-4 h-4 mr-2" /> Faktury
            </TabsTrigger>
            <TabsTrigger value="payment" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <CreditCard className="w-4 h-4 mr-2" /> Metoda płatności
            </TabsTrigger>
          </TabsList>

          {/* Subscription Tab */}
          <TabsContent value="subscription">
            {/* Current Plan */}
            <Card className="bg-gradient-to-r from-purple-600/20 to-cyan-600/20 border-purple-500/30 mb-6">
              <CardContent className="p-6">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Aktualny plan</p>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge className={currentPlan.color}>{currentPlan.name}</Badge>
                      <p className="text-white text-2xl font-bold">{currentPlan.price} PLN/mies.</p>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {currentPlan.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-1 text-sm text-slate-300">
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-sm">Następna płatność</p>
                    <p className="text-white font-semibold">{nextBillingDate.toLocaleDateString('pl-PL')}</p>
                    <Badge className="mt-2 bg-emerald-500/20 text-emerald-400">Aktywna</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Change Plan */}
            <h3 className="text-white font-semibold mb-4">Zmień plan</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {Object.entries(PLANS).map(([planId, plan]) => (
                <Card
                  key={planId}
                  className={`border cursor-pointer transition-all ${
                    user?.advertiser_plan === planId
                      ? 'border-purple-500/60 bg-purple-500/10'
                      : 'border-slate-700/50 bg-[#1a1a2e]/50 hover:border-purple-500/30'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={plan.color}>{plan.name}</Badge>
                      {user?.advertiser_plan === planId && <CheckCircle className="w-5 h-5 text-purple-400" />}
                    </div>
                    <p className="text-2xl font-bold text-white">{plan.price} <span className="text-slate-400 text-sm font-normal">PLN/mies.</span></p>
                    <div className="space-y-1 mt-3">
                      {plan.features.map((f, i) => (
                        <p key={i} className="text-slate-300 text-sm">✓ {f}</p>
                      ))}
                    </div>
                    {user?.advertiser_plan !== planId && (
                      <Button
                        size="sm"
                        className="w-full mt-4 bg-purple-600"
                        onClick={() => changePlanMutation.mutate(planId)}
                        disabled={changePlanMutation.isPending}
                      >
                        Przełącz
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl mb-4">
              <p className="text-amber-300 text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 shrink-0" />
                W środowisku produkcyjnym zmiany planu są przetwarzane przez Stripe z natychmiastowym przeliczeniem proporcjonalnym.
              </p>
            </div>

            <Button
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
            >
              Anuluj subskrypcję
            </Button>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices">
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">Historia faktur</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockInvoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-purple-500/10">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{inv.id}</p>
                          <p className="text-slate-400 text-sm">{new Date(inv.date).toLocaleDateString('pl-PL')} · Plan {inv.plan}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-white font-bold">{inv.amount} {inv.currency}</p>
                          <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">{inv.status}</Badge>
                        </div>
                        <Button size="sm" variant="outline" className="border-purple-500/30 text-purple-400">
                          <Download className="w-4 h-4 mr-1" /> PDF
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Method Tab */}
          <TabsContent value="payment">
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">Metoda płatności</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-xl bg-slate-800/50 border border-purple-500/20 flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-8 h-8 text-purple-400" />
                    <div>
                      <p className="text-white font-medium">•••• •••• •••• 4242</p>
                      <p className="text-slate-400 text-sm">Visa · Wygasa 12/2027</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400">Domyślna</Badge>
                </div>

                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl mb-4">
                  <p className="text-blue-300 text-sm">
                    🔒 Płatności są przetwarzane przez <strong>Stripe</strong> — dane karty są szyfrowane i nigdy nie trafiają na nasze serwery.
                  </p>
                </div>

                <Button className="bg-purple-600 hover:bg-purple-700">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Zmień metodę płatności (Stripe)
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}