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
import AdViewModal from '@/components/dashboard/AdViewModal';
import PaymentRequestModal from '@/components/payments/PaymentRequestModal';
import PaymentHistory from '@/components/payments/PaymentHistory';
import ReferralSection from '@/components/referrals/ReferralSection';

const REFERRAL_BONUS_PERCENT = 10; // 10% of ad reward goes to referrer

export default function Dashboard() {
  const [selectedAd, setSelectedAd] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [viewedAds, setViewedAds] = useState(new Set());
  const queryClient = useQueryClient();

  // Check for referral code in URL and store it
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      localStorage.setItem('referral_code', refCode);
      // Clean up URL
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

  // Fetch referred users (users who have this user as their referrer)
  const { data: referredUsers = [] } = useQuery({
    queryKey: ['referredUsers', user?.id],
    queryFn: () => base44.entities.User.filter({ referred_by: user?.id }),
    enabled: !!user?.id
  });

  // Fetch referral bonuses earned by this user
  const { data: referralBonuses = [] } = useQuery({
    queryKey: ['referralBonuses', user?.id],
    queryFn: () => base44.entities.ReferralBonus.filter({ referrer_id: user?.id }),
    enabled: !!user?.id
  });

  // Generate referral code if user doesn't have one
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

  // Process referral if user was referred
  useEffect(() => {
    const processReferral = async () => {
      if (user && !user.referred_by) {
        const storedRefCode = localStorage.getItem('referral_code');
        if (storedRefCode && storedRefCode !== user.referral_code) {
          // Find the referrer by their code
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

  const completeViewMutation = useMutation({
    mutationFn: async (ad) => {
      const adView = await base44.entities.AdView.create({
        user_id: user.id,
        user_email: user.email,
        advertisement_id: ad.id,
        advertisement_title: ad.title,
        reward_earned: ad.reward_amount,
        completed: true
      });

      await base44.entities.Advertisement.update(ad.id, {
        current_views: (ad.current_views || 0) + 1
      });

      await base44.auth.updateMe({
        balance: (user.balance || 0) + ad.reward_amount,
        total_earned: (user.total_earned || 0) + ad.reward_amount,
        ads_viewed: (user.ads_viewed || 0) + 1
      });

      // Award referral bonus if user was referred
      if (user.referred_by) {
        const bonusAmount = Math.floor(ad.reward_amount * REFERRAL_BONUS_PERCENT / 100);
        if (bonusAmount > 0) {
          // Get referrer details
          const referrers = await base44.entities.User.filter({ id: user.referred_by });
          if (referrers.length > 0) {
            const referrer = referrers[0];
            
            // Create referral bonus record
            await base44.entities.ReferralBonus.create({
              referrer_id: referrer.id,
              referrer_email: referrer.email,
              referred_user_id: user.id,
              referred_user_email: user.email,
              ad_view_id: adView.id,
              bonus_amount: bonusAmount
            });

            // Update referrer's balance and referral earnings
            await base44.entities.User.update(referrer.id, {
              balance: (referrer.balance || 0) + bonusAmount,
              total_earned: (referrer.total_earned || 0) + bonusAmount,
              referral_earnings: (referrer.referral_earnings || 0) + bonusAmount
            });
          }
        }
      }
    },
    onSuccess: (_, ad) => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['myViews'] });
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      setViewedAds(prev => new Set([...prev, ad.id]));
      toast.success(`You earned $${(ad.reward_amount / 100).toFixed(2)}!`);
    }
  });

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
      toast.success('Payment request submitted!');
    }
  });

  const formatCurrency = (cents) => `$${((cents || 0) / 100).toFixed(2)}`;

  const availableAds = ads.filter(ad => 
    !viewedAds.has(ad.id) && 
    (ad.current_views || 0) < (ad.max_views || Infinity)
  );

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
            Welcome back, {user?.full_name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-slate-500 mt-1">Start earning by viewing ads</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Balance"
            value={formatCurrency(user?.balance)}
            icon={Wallet}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-500"
            subtitle="Available to withdraw"
          />
          <StatsCard
            title="Total Earned"
            value={formatCurrency(user?.total_earned)}
            icon={TrendingUp}
            gradient="bg-gradient-to-br from-blue-500 to-indigo-500"
          />
          <StatsCard
            title="Ads Viewed"
            value={user?.ads_viewed || 0}
            icon={Eye}
            gradient="bg-gradient-to-br from-purple-500 to-pink-500"
          />
          <StatsCard
            title="Withdrawn"
            value={formatCurrency(user?.total_withdrawn)}
            icon={DollarSign}
            gradient="bg-gradient-to-br from-amber-500 to-orange-500"
          />
        </div>

        <Tabs defaultValue="ads" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList className="bg-white border border-slate-200">
              <TabsTrigger value="ads" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
                Available Ads ({availableAds.length})
              </TabsTrigger>
              <TabsTrigger value="referrals" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
                <Users className="w-4 h-4 mr-1.5" />
                Referrals
              </TabsTrigger>
              <TabsTrigger value="payments" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
                Payments
              </TabsTrigger>
            </TabsList>
            
            <Button
              onClick={() => setShowPaymentModal(true)}
              disabled={(user?.balance || 0) < 500}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Request Payment
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
                    onView={setSelectedAd}
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
                <h3 className="text-xl font-semibold text-slate-700 mb-2">No ads available</h3>
                <p className="text-slate-500">Check back later for new earning opportunities</p>
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
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Payment History</h2>
              <PaymentHistory payments={myPayments} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <AdViewModal
        ad={selectedAd}
        isOpen={!!selectedAd}
        onClose={() => setSelectedAd(null)}
        onComplete={(ad) => completeViewMutation.mutate(ad)}
      />

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