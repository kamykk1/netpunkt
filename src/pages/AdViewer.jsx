import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, Clock, CheckCircle, Coins, ExternalLink, AlertTriangle, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function AdViewer() {
  const [timeLeft, setTimeLeft] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [started, setStarted] = useState(false);
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const adId = urlParams.get('id');

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: ad, isLoading: adLoading } = useQuery({
    queryKey: ['ad', adId],
    queryFn: async () => {
      const ads = await base44.entities.Advertisement.filter({ id: adId });
      return ads[0] || null;
    },
    enabled: !!adId
  });

  const { data: existingView, isLoading: viewLoading } = useQuery({
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

  const { data: settings = [] } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: () => base44.entities.SiteSettings.list()
  });

  const getSetting = (key, defaultValue) => {
    const setting = settings.find(s => s.setting_key === key);
    return setting ? setting.setting_value : defaultValue;
  };

  const eventMultiplier = parseFloat(getSetting('event_multiplier', '1'));
  const referralBonusPercent = parseFloat(getSetting('referral_bonus_percent', '10'));

  useEffect(() => {
    if (!started || timeLeft === null || timeLeft <= 0 || completed) return;

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
  }, [started, timeLeft, completed]);

  const startViewing = () => {
    if (ad) {
      setTimeLeft(ad.view_duration || 30);
      setStarted(true);
      if (ad.url) {
        window.open(ad.url, '_blank');
      }
    }
  };

  const claimReward = async () => {
    if (!ad || !user || claiming) return;
    setClaiming(true);

    const basePoints = ad.points_reward || 0;
    const multiplier = eventMultiplier * (user.active_boost_multiplier || 1) * (ad.event_multiplier || 1);
    const finalPoints = Math.floor(basePoints * multiplier);
    const newBalance = (user.points_balance || 0) + finalPoints;

    // Zapisz wyświetlenie
    const adView = await base44.entities.AdView.create({
      user_id: user.id,
      user_email: user.email,
      advertisement_id: ad.id,
      advertisement_title: ad.title,
      reward_earned: finalPoints,
      completed: true
    });

    // Aktualizuj reklamę
    await base44.entities.Advertisement.update(ad.id, {
      current_views: (ad.current_views || 0) + 1
    });

    // Aktualizuj użytkownika
    await base44.auth.updateMe({
      points_balance: newBalance,
      total_points_earned: (user.total_points_earned || 0) + finalPoints,
      ads_viewed: (user.ads_viewed || 0) + 1
    });

    // Zapisz historię punktów
    await base44.entities.PointsHistory.create({
      user_id: user.id,
      user_email: user.email,
      amount: finalPoints,
      balance_after: newBalance,
      type: 'ad_view',
      description: `Obejrzenie reklamy: ${ad.title}`,
      reference_id: adView.id
    });

    // Bonus za polecenie
    if (user.referred_by) {
      const bonusAmount = Math.floor(finalPoints * referralBonusPercent / 100);
      if (bonusAmount > 0) {
        const referrers = await base44.entities.User.filter({ id: user.referred_by });
        if (referrers.length > 0) {
          const referrer = referrers[0];
          const referrerNewBalance = (referrer.points_balance || 0) + bonusAmount;
          
          await base44.entities.ReferralBonus.create({
            referrer_id: referrer.id,
            referrer_email: referrer.email,
            referred_user_id: user.id,
            referred_user_email: user.email,
            ad_view_id: adView.id,
            bonus_amount: bonusAmount
          });
          
          await base44.entities.User.update(referrer.id, {
            points_balance: referrerNewBalance,
            total_points_earned: (referrer.total_points_earned || 0) + bonusAmount,
            referral_earnings: (referrer.referral_earnings || 0) + bonusAmount
          });

          await base44.entities.PointsHistory.create({
            user_id: referrer.id,
            user_email: referrer.email,
            amount: bonusAmount,
            balance_after: referrerNewBalance,
            type: 'referral_bonus',
            description: `Bonus za polecenie: ${user.email}`,
            reference_id: adView.id
          });
        }
      }
    }

    queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    setClaiming(false);
    setClaimed(true);
  };

  const isLoading = userLoading || adLoading || viewLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-slate-400">Ładowanie reklamy...</p>
        </div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center text-white p-8">
          <AlertTriangle className="w-16 h-16 mx-auto text-amber-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Nie znaleziono reklamy</h1>
          <p className="text-slate-400">Ta reklama nie istnieje lub została usunięta.</p>
        </div>
      </div>
    );
  }

  if (existingView) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center text-white p-8">
          <CheckCircle className="w-16 h-16 mx-auto text-emerald-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Już obejrzane</h1>
          <p className="text-slate-400 mb-6">Już zarobiłeś punkty za tę reklamę.</p>
          <Button 
            onClick={() => window.close()} 
            className="bg-purple-600 hover:bg-purple-700"
          >
            Zamknij kartę
          </Button>
        </div>
      </div>
    );
  }

  if (claimed) {
    const basePoints = ad.points_reward || 0;
    const multiplier = eventMultiplier * (user?.active_boost_multiplier || 1);
    const finalPoints = Math.floor(basePoints * multiplier);

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center text-white p-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-full flex items-center justify-center mb-6 border border-purple-500/30"
          >
            <Zap className="w-12 h-12 text-yellow-400" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-2">Gratulacje!</h1>
          <p className="text-4xl text-yellow-400 font-bold mb-2">+{finalPoints} pkt</p>
          <p className="text-slate-400 mb-6">Punkty zostały dodane do Twojego salda.</p>
          <Button 
            onClick={() => window.close()} 
            className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
          >
            Zamknij kartę
          </Button>
        </motion.div>
      </div>
    );
  }

  const basePoints = ad.points_reward || 0;
  const multiplier = eventMultiplier * (user?.active_boost_multiplier || 1);
  const finalPoints = Math.floor(basePoints * multiplier);
  const progress = ad && timeLeft !== null ? ((ad.view_duration - timeLeft) / ad.view_duration) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-lg bg-[#1a1a2e]/80 backdrop-blur-xl rounded-3xl border border-purple-500/30 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 p-6 border-b border-purple-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Nagroda za obejrzenie</p>
              <p className="text-3xl font-bold text-white flex items-center gap-2">
                <Coins className="w-8 h-8 text-yellow-400" />
                {finalPoints} pkt
              </p>
              {multiplier > 1 && (
                <p className="text-yellow-400 text-sm">🔥 Mnożnik x{multiplier}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm">Czas oglądania</p>
              <p className="text-xl font-semibold text-white">{ad.view_duration || 30}s</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {ad.image_url && (
            <img 
              src={ad.image_url} 
              alt={ad.title}
              className="w-full h-48 object-cover rounded-xl mb-4"
            />
          )}
          <h2 className="text-xl font-bold text-white mb-2">{ad.title}</h2>
          <p className="text-slate-400 mb-6">{ad.description}</p>

          {!started ? (
            <Button
              onClick={startViewing}
              className="w-full h-14 text-lg bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Rozpocznij oglądanie
            </Button>
          ) : !completed ? (
            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-2xl p-6 text-center border border-purple-500/20">
                <Clock className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                <p className="text-slate-400 mb-2">Pozostały czas</p>
                <p className="text-5xl font-mono font-bold text-white mb-4">{timeLeft}s</p>
                <Progress value={progress} className="h-3 bg-slate-700" />
                <p className="text-sm text-slate-500 mt-3">
                  Przeglądaj stronę reklamową w nowej karcie...
                </p>
              </div>
            </div>
          ) : (
            <Button
              onClick={claimReward}
              disabled={claiming}
              className="w-full h-14 text-lg bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
            >
              {claiming ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <CheckCircle className="w-5 h-5 mr-2" />
              )}
              Odbierz {finalPoints} pkt
            </Button>
          )}
        </div>
      </motion.div>

      {started && !completed && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-slate-500 text-sm mt-6 text-center max-w-md"
        >
          💡 Strona reklamowa została otwarta w nowej karcie. Poczekaj aż licznik się skończy, 
          następnie wróć tutaj aby odebrać punkty.
        </motion.p>
      )}
    </div>
  );
}