import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { 
  Coins, Eye, TrendingUp, Users, Gift, Target, Trophy,
  Zap, ArrowRight, Clock, Star, Crown, Loader2, BarChart3, Globe
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProgressCharts from '@/components/dashboard/ProgressCharts.jsx';
import GeographicReachMap from '@/components/dashboard/GeographicReachMap.jsx';
import PartnerTransactionsPanel from '@/components/partners/PartnerTransactionsPanel.jsx';
import TournamentLeaderboard from '@/components/tournaments/TournamentLeaderboard.jsx';

export default function Dashboard() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: settings = [] } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: () => base44.entities.SiteSettings.list()
  });

  const { data: pointsHistory = [] } = useQuery({
    queryKey: ['pointsHistory', user?.id],
    queryFn: () => base44.entities.PointsHistory.filter({ user_id: user?.id }, '-created_date', 100),
    enabled: !!user?.id
  });

  const { data: adViews = [] } = useQuery({
    queryKey: ['adViews', user?.id],
    queryFn: () => base44.entities.AdView.filter({ user_id: user?.id }, '-created_date', 100),
    enabled: !!user?.id
  });

  const { data: levels = [] } = useQuery({
    queryKey: ['membershipLevels'],
    queryFn: () => base44.entities.MembershipLevel.list('level')
  });

  const { data: missions = [] } = useQuery({
    queryKey: ['activeMissions'],
    queryFn: () => base44.entities.Mission.filter({ status: 'active' }, null, 5)
  });

  // Generuj kod polecający
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

  const getSetting = (key, defaultValue) => {
    const setting = settings.find(s => s.setting_key === key);
    return setting ? setting.setting_value : defaultValue;
  };

  const pointRate = parseFloat(getSetting('point_rate', '0.10'));

  const currentLevel = levels.find(l => l.level === user?.membership_level) || { name: 'Bronze', level: 1 };
  const nextLevel = levels.find(l => l.level === (user?.membership_level || 1) + 1);
  const progressToNext = nextLevel 
    ? ((user?.total_points_earned || 0) / nextLevel.min_points_earned) * 100 
    : 100;

  const typeIcons = {
    ad_view: <Eye className="w-4 h-4" />,
    referral_bonus: <Users className="w-4 h-4" />,
    withdrawal: <TrendingUp className="w-4 h-4" />,
    mission: <Target className="w-4 h-4" />,
    cashback: <Gift className="w-4 h-4" />,
    daily_bonus: <Star className="w-4 h-4" />,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
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
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white">
            Witaj,{' '}<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
              {user?.full_name?.split(' ')[0] || 'Użytkowniku'}
            </span>
          </h1>
          <p className="text-slate-400 mt-1">Zarabiaj punkty oglądając reklamy</p>
        </motion.div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-500/30 p-6"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <Coins className="w-8 h-8 text-yellow-400" />
                <span className="text-xs text-slate-400">1 pkt = {pointRate.toFixed(2)} zł</span>
              </div>
              <p className="text-4xl font-bold text-white mb-1">
                {(user?.points_balance || 0).toLocaleString()}
              </p>
              <p className="text-slate-400 text-sm">Saldo punktów</p>
              <p className="text-emerald-400 text-sm mt-2">
                ≈ {((user?.points_balance || 0) * pointRate).toFixed(2)} zł
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600/20 to-cyan-900/20 border border-cyan-500/30 p-6"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl" />
            <div className="relative">
              <TrendingUp className="w-8 h-8 text-cyan-400 mb-4" />
              <p className="text-4xl font-bold text-white mb-1">
                {(user?.total_points_earned || 0).toLocaleString()}
              </p>
              <p className="text-slate-400 text-sm">Łącznie zarobionych</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-600/20 to-pink-900/20 border border-pink-500/30 p-6"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl" />
            <div className="relative">
              <Eye className="w-8 h-8 text-pink-400 mb-4" />
              <p className="text-4xl font-bold text-white mb-1">
                {user?.ads_viewed || 0}
              </p>
              <p className="text-slate-400 text-sm">Obejrzanych reklam</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600/20 to-emerald-900/20 border border-emerald-500/30 p-6"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="relative">
              <Users className="w-8 h-8 text-emerald-400 mb-4" />
              <p className="text-4xl font-bold text-white mb-1">
                {user?.referral_count || 0}
              </p>
              <p className="text-slate-400 text-sm">Poleconych użytkowników</p>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Level Progress */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            {/* Tournament Leaderboard */}
            <div className="mb-6">
              <TournamentLeaderboard limit={5} />
            </div>
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-400" />
                  Poziom członkostwa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">{currentLevel.level}</span>
                    </div>
                    <div>
                      <p className="text-white font-semibold">{currentLevel.name}</p>
                      <p className="text-slate-400 text-sm">Mnożnik: x{currentLevel.points_multiplier || 1}</p>
                    </div>
                  </div>
                  {nextLevel && (
                    <div className="text-right">
                      <p className="text-slate-400 text-sm">Następny poziom</p>
                      <p className="text-white font-semibold">{nextLevel.name}</p>
                    </div>
                  )}
                </div>
                <Progress value={Math.min(progressToNext, 100)} className="h-3 bg-slate-700" />
                <p className="text-slate-400 text-sm mt-2">
                  {nextLevel 
                    ? `${(user?.total_points_earned || 0).toLocaleString()} / ${nextLevel.min_points_earned.toLocaleString()} pkt`
                    : 'Maksymalny poziom osiągnięty!'}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">Szybkie akcje</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to={createPageUrl('EarnAds')} className="block">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 cursor-pointer transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">Zarabiaj punkty</p>
                        <p className="text-white/70 text-xs">Oglądaj reklamy i zbieraj punkty</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
                <Link to={createPageUrl('Missions')} className="block">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-purple-500/20 cursor-pointer transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Target className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">Misje dzienne</p>
                        <p className="text-slate-400 text-xs">Wykonuj zadania i zdobywaj bonusy</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
                <Link to={createPageUrl('Shop')} className="block">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-purple-500/20 cursor-pointer transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-pink-500/20 flex items-center justify-center">
                        <Gift className="w-5 h-5 text-pink-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">Sklep z nagrodami</p>
                        <p className="text-slate-400 text-xs">Wydaj punkty na nagrody i VIP</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
                <Link to={createPageUrl('Referrals')} className="block">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-purple-500/20 cursor-pointer transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">Zaproś znajomych</p>
                        <p className="text-slate-400 text-xs">Kod: {user?.referral_code || '...'}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Points History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Historia punktów</CardTitle>
              <Link to={createPageUrl('PointsHistory')}>
                <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
                  Zobacz wszystko
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {pointsHistory.length > 0 ? (
                <div className="space-y-3">
                  {pointsHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${entry.amount > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {typeIcons[entry.type] || <Coins className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-white font-medium">{entry.description || entry.type}</p>
                          <p className="text-slate-400 text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(entry.created_date).toLocaleDateString('pl-PL')}
                          </p>
                        </div>
                      </div>
                      <span className={`font-bold ${entry.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {entry.amount > 0 ? '+' : ''}{entry.amount} pkt
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Coins className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Brak historii punktów</p>
                  <p className="text-sm">Zacznij zarabiać oglądając reklamy!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
        {/* Analytics Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Tabs defaultValue="charts" className="space-y-6">
            <TabsList className="bg-[#1a1a2e] border border-purple-500/20 p-1">
              <TabsTrigger value="charts" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                <BarChart3 className="w-4 h-4 mr-2" /> Statystyki
              </TabsTrigger>
              <TabsTrigger value="map" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                <Globe className="w-4 h-4 mr-2" /> Mapa zasięgu
              </TabsTrigger>
              <TabsTrigger value="partners" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                <Users className="w-4 h-4 mr-2" /> Transakcje partnerskie
              </TabsTrigger>
            </TabsList>

            <TabsContent value="charts">
              <ProgressCharts pointsHistory={pointsHistory} adViews={adViews} />
            </TabsContent>

            <TabsContent value="map">
              <GeographicReachMap />
            </TabsContent>

            <TabsContent value="partners">
              <PartnerTransactionsPanel userId={user?.id} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}