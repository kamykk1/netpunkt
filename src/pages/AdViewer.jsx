import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, Clock, CheckCircle, DollarSign, ExternalLink, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const REFERRAL_BONUS_PERCENT = 10;

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

  // Sprawdź czy już obejrzane
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

  // Timer effect
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
      // Otwórz stronę reklamową w nowej karcie
      if (ad.url) {
        window.open(ad.url, '_blank');
      }
    }
  };

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

    // Bonus za polecenie
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
    setClaimed(true);
  };

  const formatCurrency = (cents) => `${((cents || 0) / 100).toFixed(2)} zł`;

  const isLoading = userLoading || adLoading || viewLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-slate-400">Ładowanie reklamy...</p>
        </div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center text-white p-8">
          <CheckCircle className="w-16 h-16 mx-auto text-emerald-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Już obejrzane</h1>
          <p className="text-slate-400 mb-6">Już zarobiłeś na tej reklamie.</p>
          <Button 
            onClick={() => window.close()} 
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            Zamknij kartę
          </Button>
        </div>
      </div>
    );
  }

  if (claimed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center text-white p-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-24 h-24 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center mb-6"
          >
            <CheckCircle className="w-12 h-12 text-emerald-500" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-2">Gratulacje!</h1>
          <p className="text-2xl text-emerald-400 font-semibold mb-2">+{formatCurrency(ad.reward_amount)}</p>
          <p className="text-slate-400 mb-6">Nagroda została dodana do Twojego salda.</p>
          <Button 
            onClick={() => window.close()} 
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            Zamknij kartę
          </Button>
        </motion.div>
      </div>
    );
  }

  const progress = ad && timeLeft !== null ? ((ad.view_duration - timeLeft) / ad.view_duration) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-lg bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700 overflow-hidden"
      >
        {/* Nagłówek z nagrodą */}
        <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Nagroda za obejrzenie</p>
              <p className="text-3xl font-bold text-white flex items-center gap-2">
                <DollarSign className="w-8 h-8 text-emerald-500" />
                {formatCurrency(ad.reward_amount)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm">Czas oglądania</p>
              <p className="text-xl font-semibold text-white">{ad.view_duration || 30}s</p>
            </div>
          </div>
        </div>

        {/* Treść reklamy */}
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
              className="w-full h-14 text-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Rozpocznij oglądanie
            </Button>
          ) : !completed ? (
            <div className="space-y-4">
              <div className="bg-slate-700/50 rounded-2xl p-6 text-center">
                <Clock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                <p className="text-slate-400 mb-2">Pozostały czas</p>
                <p className="text-5xl font-mono font-bold text-white mb-4">{timeLeft}s</p>
                <Progress value={progress} className="h-3" />
                <p className="text-sm text-slate-500 mt-3">
                  Przeglądaj stronę reklamową w nowej karcie...
                </p>
              </div>
            </div>
          ) : (
            <Button
              onClick={claimReward}
              disabled={claiming}
              className="w-full h-14 text-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            >
              {claiming ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <CheckCircle className="w-5 h-5 mr-2" />
              )}
              Odbierz {formatCurrency(ad.reward_amount)}
            </Button>
          )}
        </div>
      </motion.div>

      {/* Instrukcja */}
      {started && !completed && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-slate-500 text-sm mt-6 text-center max-w-md"
        >
          💡 Strona reklamowa została otwarta w nowej karcie. Poczekaj aż licznik się skończy, 
          następnie wróć tutaj aby odebrać nagrodę.
        </motion.p>
      )}
    </div>
  );
}