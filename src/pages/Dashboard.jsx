import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Wallet, Eye, TrendingUp, DollarSign, Loader2, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import StatsCard from '@/components/dashboard/StatsCard';
import AdCard from '@/components/dashboard/AdCard';
import PaymentRequestModal from '@/components/payments/PaymentRequestModal';
import PaymentHistory from '@/components/payments/PaymentHistory';
import ReferralSection from '@/components/referrals/ReferralSection';

const REFERRAL_BONUS_PERCENT = 10;

export default function Dashboard() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [viewedAds, setViewedAds] = useState(new Set());
  const queryClient = useQueryClient();

  // Sprawdź kod polecający w URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      localStorage.setItem('referral_code', refCode);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: ads = [], isLoading: adsLoading } = useQuery({
    queryKey: ['ads'],
    queryFn: () => base44.entities.Advertisement.filter({ status: 'active' })
  });

  const { data: myViews = [] } = useQuery({
    queryKey: ['myViews', user?.id],
    queryFn: () => base44.entities.AdView.filter({ user_id: user?.id }),
    enabled: !!user?.id
  });

  const { data: myPayments = [] } = useQuery({
    queryKey: ['myPayments', user?.id],
    queryFn: () => base44.entities.PaymentRequest.filter({ user_id: user?.id }, '-created_date'),
    enabled: !!user?.id
  });

  const { data: referredUsers = [] } = useQuery({
    queryKey: ['referredUsers', user?.id],
    queryFn: () => base44.entities.User.filter({ referred_by: user?.id }),
    enabled: !!user?.id
  });

  const { data: referralBonuses = [] } = useQuery({
    queryKey: ['referralBonuses', user?.id],
    queryFn: () => base44.entities.ReferralBonus.filter({ referrer_id: user?.id }),
    enabled: !!user?.id
  });

  // Wygeneruj kod polecający jeśli użytkownik go nie ma
  useEffect(() => {
    const generateReferralCode = async () => {
      if (user && !user.referral_code) {
        const code = `${user.full_name?.split(' ')[0]?.toUpperCase() || 'USER'}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        await base44.auth.updateMe({ referral_code: code });
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      }
    };
    generateReferralCode();
  }, [user]);

  // Przetwórz polecenie jeśli użytkownik został polecony
  useEffect(() => {
    const processReferral = async () => {
      if (user && !user.referred_by) {
        const storedRefCode = localStorage.getItem('referral_code');
        if (storedRefCode && storedRefCode !== user.referral_code) {
          const referrers = await base44.entities.User.filter({ referral_code: storedRefCode });
          if (referrers.length > 0 && referrers[0].id !== user.id) {
            await base44.auth.updateMe({ referred_by: referrers[0].id });
            queryClient.invalidateQueries({ queryKey: ['currentUser'] });
            localStorage.removeItem('referral_code');
          }
        }
      }
    };
    processReferral();
  }, [user]);

  useEffect(() => {
    if (myViews.length > 0) {
      const completedAds = new Set(myViews.filter(v => v.completed).map(v => v.advertisement_id));
      setViewedAds(completedAds);
    }
  }, [myViews]);

  const paymentRequestMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.PaymentRequest.create({
        user_id: user.id,
        user_email: user.email,
        user_name: user.full_name,
        ...data
      });

      await base44.auth.updateMe({
        balance: (user.balance || 0) - data.amount
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['myPayments'] });
      setShowPaymentModal(false);
      toast.success('Wniosek o wypłatę został złożony!');
    }
  });

  const formatCurrency = (cents) => `${((cents || 0) / 100).toFixed(2)} zł`;

  const availableAds = ads.filter(ad => 
    !viewedAds.has(ad.id) && 
    (ad.current_views || 0) < (ad.max_views || Infinity)
  );

  // Odśwież dane po powrocie do karty
  useEffect(() => {
    const handleFocus = () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['myViews'] });
      queryClient.invalidateQueries({ queryKey: ['ads'] });
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [queryClient]);

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900">
            Witaj, {user?.full_name?.split(' ')[0] || 'Użytkowniku'}!
          </h1>
          <p className="text-slate-500 mt-1">Zarabiaj oglądając reklamy</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Saldo"
            value={formatCurrency(user?.balance)}
            icon={Wallet}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-500"
            subtitle="Dostępne do wypłaty"
          />
          <StatsCard
            title="Łączne zarobki"
            value={formatCurrency(user?.total_earned)}
            icon={TrendingUp}
            gradient="bg-gradient-to-br from-blue-500 to-indigo-500"
          />
          <StatsCard
            title="Obejrzane reklamy"
            value={user?.ads_viewed || 0}
            icon={Eye}
            gradient="bg-gradient-to-br from-purple-500 to-pink-500"
          />
          <StatsCard
            title="Wypłacone"
            value={formatCurrency(user?.total_withdrawn)}
            icon={DollarSign}
            gradient="bg-gradient-to-br from-amber-500 to-orange-500"
          />
        </div>

        <Tabs defaultValue="ads" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList className="bg-white border border-slate-200">
              <TabsTrigger value="ads" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
                Dostępne reklamy ({availableAds.length})
              </TabsTrigger>
              <TabsTrigger value="referrals" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
                <Users className="w-4 h-4 mr-1.5" />
                Polecenia
              </TabsTrigger>
              <TabsTrigger value="payments" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
                Wypłaty
              </TabsTrigger>
            </TabsList>
            
            <Button
              onClick={() => setShowPaymentModal(true)}
              disabled={(user?.balance || 0) < 500}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Wypłać środki
            </Button>
          </div>

          <TabsContent value="ads">
            {adsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              </div>
            ) : availableAds.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableAds.map((ad) => (
                  <AdCard
                    key={ad.id}
                    ad={ad}
                    isCompleted={viewedAds.has(ad.id)}
                  />
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 bg-white rounded-2xl border border-slate-100"
              >
                <Eye className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">Brak dostępnych reklam</h3>
                <p className="text-slate-500">Sprawdź później, aby znaleźć nowe możliwości zarobku</p>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="referrals">
            <ReferralSection 
              user={user} 
              referredUsers={referredUsers}
              referralBonuses={referralBonuses}
            />
          </TabsContent>

          <TabsContent value="payments">
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Historia wypłat</h2>
              <PaymentHistory payments={myPayments} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <PaymentRequestModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSubmit={(data) => paymentRequestMutation.mutate(data)}
        currentBalance={user?.balance || 0}
        isLoading={paymentRequestMutation.isPending}
      />
    </div>
  );
}