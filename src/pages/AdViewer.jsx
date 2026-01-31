import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, Clock, CheckCircle, DollarSign, ExternalLink } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const REFERRAL_BONUS_PERCENT = 10;

export default function AdViewer() {
  const [timeLeft, setTimeLeft] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const adId = urlParams.get('id');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: ad, isLoading } = useQuery({
    queryKey: ['ad', adId],
    queryFn: async () => {
      const ads = await base44.entities.Advertisement.filter({ id: adId });
      return ads[0] || null;
    },
    enabled: !!adId
  });

  // Check if already viewed
  const { data: existingView } = useQuery({
    queryKey: ['existingView', adId, user?.id],
    queryFn: async () => {
      const views = await base44.entities.AdView.filter({ 
        advertisement_id: adId, 
        user_id: user?.id,
        completed: true 
      });
      return views[0] || null;
    },
    enabled: !!adId && !!user?.id
  });

  useEffect(() => {
    if (ad && !existingView && timeLeft === null) {
      setTimeLeft(ad.view_duration || 30);
    }
  }, [ad, existingView]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || completed) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, completed]);

  const claimReward = async () => {
    if (!ad || !user || claiming) return;
    setClaiming(true);

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

    // Award referral bonus
    if (user.referred_by) {
      const bonusAmount = Math.floor(ad.reward_amount * REFERRAL_BONUS_PERCENT / 100);
      if (bonusAmount > 0) {
        const referrers = await base44.entities.User.filter({ id: user.referred_by });
        if (referrers.length > 0) {
          const referrer = referrers[0];
          await base44.entities.ReferralBonus.create({
            referrer_id: referrer.id,
            referrer_email: referrer.email,
            referred_user_id: user.id,
            referred_user_email: user.email,
            ad_view_id: adView.id,
            bonus_amount: bonusAmount
          });
          await base44.entities.User.update(referrer.id, {
            balance: (referrer.balance || 0) + bonusAmount,
            total_earned: (referrer.total_earned || 0) + bonusAmount,
            referral_earnings: (referrer.referral_earnings || 0) + bonusAmount
          });
        }
      }
    }

    queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    setClaiming(false);
  };

  const formatCurrency = (cents) => `$${((cents || 0) / 100).toFixed(2)}`;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-2">Ad not found</h1>
          <p className="text-slate-400">This advertisement doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  if (existingView) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center text-white">
          <CheckCircle className="w-16 h-16 mx-auto text-emerald-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Already Viewed</h1>
          <p className="text-slate-400">You've already earned from this advertisement.</p>
          <Button 
            onClick={() => window.close()} 
            className="mt-6 bg-emerald-500 hover:bg-emerald-600"
          >
            Close Tab
          </Button>
        </div>
      </div>
    );
  }

  const progress = ad ? ((ad.view_duration - timeLeft) / ad.view_duration) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Timer Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-white">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              <span className="font-bold text-lg">{formatCurrency(ad.reward_amount)}</span>
            </div>
            <span className="text-slate-400">|</span>
            <span className="text-slate-300">{ad.title}</span>
          </div>

          {!completed ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-white">
                <Clock className="w-5 h-5 text-amber-500" />
                <span className="font-mono text-xl font-bold">{timeLeft}s</span>
              </div>
              <div className="w-32">
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          ) : (
            <Button
              onClick={claimReward}
              disabled={claiming}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            >
              {claiming ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Claim {formatCurrency(ad.reward_amount)}
            </Button>
          )}
        </div>
      </div>

      {/* Ad Content */}
      <div className="flex-1 flex flex-col">
        {ad.url ? (
          <iframe
            src={ad.url}
            className="flex-1 w-full border-0"
            title={ad.title}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-2xl text-center">
              {ad.image_url && (
                <img 
                  src={ad.image_url} 
                  alt={ad.title}
                  className="w-full max-h-96 object-contain rounded-xl mb-6"
                />
              )}
              <h1 className="text-3xl font-bold text-white mb-4">{ad.title}</h1>
              <p className="text-slate-300 text-lg">{ad.description}</p>
            </div>
          </div>
        )}
      </div>

      {/* Completion Overlay */}
      {completed && !claiming && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-800 rounded-2xl p-8 text-center max-w-md mx-4"
          >
            <div className="w-20 h-20 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Time Complete!</h2>
            <p className="text-slate-400 mb-6">
              Click the button above to claim your {formatCurrency(ad.reward_amount)} reward
            </p>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}