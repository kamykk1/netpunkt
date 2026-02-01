import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Zap, Crown, Gift, Lock, CheckCircle, Star,
  Loader2, Coins, ArrowRight
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function BattlePass() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: battlePasses = [], isLoading } = useQuery({
    queryKey: ['battlePasses'],
    queryFn: () => base44.entities.BattlePass.filter({ status: 'active' })
  });

  const { data: userBattlePass } = useQuery({
    queryKey: ['userBattlePass', user?.id],
    queryFn: async () => {
      const passes = await base44.entities.UserBattlePass.filter({ user_id: user?.id });
      return passes[0] || null;
    },
    enabled: !!user?.id
  });

  const currentBP = battlePasses[0];

  const upgradeMutation = useMutation({
    mutationFn: async () => {
      if (!currentBP) return;
      
      const price = currentBP.premium_price_points || 5000;
      if ((user?.points_balance || 0) < price) {
        throw new Error('Niewystarczająca ilość punktów');
      }

      if (userBattlePass) {
        await base44.entities.UserBattlePass.update(userBattlePass.id, { is_premium: true });
      } else {
        await base44.entities.UserBattlePass.create({
          user_id: user.id,
          battlepass_id: currentBP.id,
          current_level: user?.battlepass_level || 1,
          current_xp: user?.battlepass_xp || 0,
          is_premium: true
        });
      }

      await base44.auth.updateMe({
        points_balance: (user.points_balance || 0) - price
      });

      await base44.entities.PointsHistory.create({
        user_id: user.id,
        user_email: user.email,
        amount: -price,
        balance_after: (user.points_balance || 0) - price,
        type: 'purchase',
        description: 'Zakup Battle Pass Premium'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['userBattlePass'] });
      toast.success('Battle Pass Premium aktywowany! 🎉');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  // Sample rewards
  const rewards = [
    { level: 1, free: '100 pkt', premium: '250 pkt' },
    { level: 2, free: 'Badge "Nowicjusz"', premium: 'x1.1 Boost 24h' },
    { level: 3, free: '150 pkt', premium: '400 pkt' },
    { level: 4, free: null, premium: 'VIP 1 dzień' },
    { level: 5, free: '200 pkt', premium: '500 pkt + Badge' },
    { level: 6, free: null, premium: 'x1.2 Boost 48h' },
    { level: 7, free: '250 pkt', premium: '600 pkt' },
    { level: 8, free: 'Badge "Weteran"', premium: 'VIP 3 dni' },
    { level: 9, free: '300 pkt', premium: '750 pkt' },
    { level: 10, free: '500 pkt', premium: '1500 pkt + VIP 7 dni' },
  ];

  const currentLevel = user?.battlepass_level || 1;
  const currentXP = user?.battlepass_xp || 0;
  const xpPerLevel = currentBP?.points_per_level || 1000;
  const progress = (currentXP / xpPerLevel) * 100;
  const isPremium = userBattlePass?.is_premium || false;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!currentBP) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <Zap className="w-16 h-16 mx-auto text-slate-600 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Brak aktywnego Battle Pass</h2>
          <p className="text-slate-400">Nowy sezon już wkrótce!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <Zap className="w-8 h-8 text-yellow-400" />
                {currentBP.name}
              </h1>
              <p className="text-slate-400 mt-1">Sezon {currentBP.season}</p>
            </div>
            {!isPremium && (
              <Button
                onClick={() => upgradeMutation.mutate()}
                disabled={upgradeMutation.isPending || (user?.points_balance || 0) < (currentBP.premium_price_points || 5000)}
                className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700"
              >
                {upgradeMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Crown className="w-5 h-5 mr-2" />
                )}
                Ulepsz do Premium ({currentBP.premium_price_points || 5000} pkt)
              </Button>
            )}
            {isPremium && (
              <Badge className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-4 py-2">
                <Crown className="w-4 h-4 mr-1" />
                PREMIUM
              </Badge>
            )}
          </div>
        </motion.div>

        {/* Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-slate-400">Twój poziom</p>
                  <p className="text-4xl font-bold text-white">Lv. {currentLevel}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400">Do następnego poziomu</p>
                  <p className="text-xl text-white">{currentXP} / {xpPerLevel} XP</p>
                </div>
              </div>
              <Progress value={progress} className="h-4 bg-slate-700" />
              <p className="text-slate-400 text-sm mt-2">
                Zdobywaj XP oglądając reklamy i wykonując misje
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Rewards Track */}
        <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-pink-400" />
              Ścieżka nagród
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rewards.map((reward, index) => {
                const isUnlocked = currentLevel >= reward.level;
                const isCurrent = currentLevel === reward.level;
                
                return (
                  <motion.div
                    key={reward.level}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center gap-4 p-4 rounded-xl border ${
                      isCurrent 
                        ? 'bg-purple-500/20 border-purple-500/50' 
                        : isUnlocked 
                          ? 'bg-slate-800/50 border-emerald-500/30' 
                          : 'bg-slate-800/30 border-slate-700/50'
                    }`}
                  >
                    {/* Level Badge */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${
                      isUnlocked 
                        ? 'bg-gradient-to-br from-purple-600 to-cyan-500 text-white' 
                        : 'bg-slate-700 text-slate-400'
                    }`}>
                      {reward.level}
                    </div>

                    {/* Free Reward */}
                    <div className="flex-1">
                      <p className="text-slate-400 text-xs mb-1">Nagroda darmowa</p>
                      {reward.free ? (
                        <div className="flex items-center gap-2">
                          {isUnlocked ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Gift className="w-4 h-4 text-slate-500" />
                          )}
                          <span className={isUnlocked ? 'text-white' : 'text-slate-500'}>{reward.free}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </div>

                    {/* Premium Reward */}
                    <div className="flex-1">
                      <p className="text-yellow-400 text-xs mb-1 flex items-center gap-1">
                        <Crown className="w-3 h-3" /> Premium
                      </p>
                      <div className="flex items-center gap-2">
                        {isPremium && isUnlocked ? (
                          <CheckCircle className="w-4 h-4 text-yellow-400" />
                        ) : isPremium ? (
                          <Star className="w-4 h-4 text-slate-500" />
                        ) : (
                          <Lock className="w-4 h-4 text-slate-600" />
                        )}
                        <span className={isPremium ? (isUnlocked ? 'text-yellow-400' : 'text-slate-400') : 'text-slate-600'}>
                          {reward.premium}
                        </span>
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      {isUnlocked ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Odblokowane
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-700 text-slate-400">
                          <Lock className="w-3 h-3 mr-1" />
                          Zablokowane
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}