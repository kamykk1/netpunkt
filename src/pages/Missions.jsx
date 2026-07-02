import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Target, Coins, Eye, Users, Gift, Star, Clock, 
  CheckCircle, Loader2, Trophy, Zap, Gamepad2, Award
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const MISSION_ICONS = {
  view_ads: Eye,
  earn_points: Coins,
  refer_users: Users,
  make_purchase: Gift,
  cashback: Star,
  consecutive_login: Clock,
  play_games: Gamepad2,
  win_games: Trophy,
  play_multiplayer: Gamepad2,
  win_tournament: Trophy,
};

const MISSION_TYPE_COLORS = {
  daily: 'from-emerald-500 to-teal-500',
  weekly: 'from-blue-500 to-indigo-500',
  special: 'from-purple-500 to-pink-500',
  achievement: 'from-yellow-500 to-orange-500',
};

export default function Missions() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: missions = [], isLoading } = useQuery({
    queryKey: ['missions'],
    queryFn: () => base44.entities.Mission.filter({ status: 'active' })
  });

  const { data: userMissions = [] } = useQuery({
    queryKey: ['userMissions', user?.id],
    queryFn: () => base44.entities.UserMission.filter({ user_id: user?.id }),
    enabled: !!user?.id
  });

  const claimMutation = useMutation({
    mutationFn: async (mission) => {
      const userMission = userMissions.find(um => um.mission_id === mission.id);
      
      if (userMission) {
        await base44.entities.UserMission.update(userMission.id, { claimed: true, badge_awarded: !!mission.badge_reward });
      } else {
        await base44.entities.UserMission.create({
          user_id: user.id,
          mission_id: mission.id,
          progress: mission.requirement_value,
          completed: true,
          claimed: true,
          badge_awarded: !!mission.badge_reward,
          completed_date: new Date().toISOString()
        });
      }

      const newBalance = (user.points_balance || 0) + mission.points_reward;
      const updateData = {
        points_balance: newBalance,
        total_points_earned: (user.total_points_earned || 0) + mission.points_reward
      };
      // Award badge if mission has badge_reward
      if (mission.badge_reward) {
        let currentBadges = [];
        try { currentBadges = JSON.parse(user.badges || '[]'); } catch { currentBadges = []; }
        if (!currentBadges.includes(mission.badge_reward)) {
          updateData.badges = JSON.stringify([...currentBadges, mission.badge_reward]);
        }
      }
      await base44.auth.updateMe(updateData);

      await base44.entities.PointsHistory.create({
        user_id: user.id,
        user_email: user.email,
        amount: mission.points_reward,
        balance_after: newBalance,
        type: 'mission',
        description: `Misja: ${mission.title}`,
        reference_id: mission.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['userMissions'] });
      toast.success('Nagroda odebrana! 🎉');
    }
  });

  const getMissionProgress = (mission) => {
    const userMission = userMissions.find(um => um.mission_id === mission.id);
    if (userMission) return { progress: userMission.progress, completed: userMission.completed, claimed: userMission.claimed };
    
    // Oblicz postęp na podstawie danych użytkownika
    let progress = 0;
    switch (mission.requirement_type) {
      case 'view_ads':
        progress = user?.ads_viewed || 0;
        break;
      case 'earn_points':
        progress = user?.total_points_earned || 0;
        break;
      case 'refer_users':
        progress = user?.referral_count || 0;
        break;
      case 'consecutive_login':
        progress = user?.consecutive_logins || 0;
        break;
      case 'play_games':
        progress = user?.games_played || 0;
        break;
      case 'win_games':
        progress = user?.games_won || 0;
        break;
      case 'play_multiplayer':
        progress = user?.games_played || 0;
        break;
      case 'win_tournament':
        progress = user?.tournaments_won || 0;
        break;
      default:
        progress = 0;
    }
    
    return { 
      progress: Math.min(progress, mission.requirement_value), 
      completed: progress >= mission.requirement_value,
      claimed: false
    };
  };

  const groupedMissions = {
    daily: missions.filter(m => m.mission_type === 'daily'),
    weekly: missions.filter(m => m.mission_type === 'weekly'),
    special: missions.filter(m => m.mission_type === 'special'),
    achievement: missions.filter(m => m.mission_type === 'achievement'),
  };

  const renderMissionCard = (mission, index) => {
    const Icon = MISSION_ICONS[mission.requirement_type] || Target;
    const { progress, completed, claimed } = getMissionProgress(mission);
    const progressPercent = (progress / mission.requirement_value) * 100;
    const colorClass = MISSION_TYPE_COLORS[mission.mission_type];

    return (
      <motion.div
        key={mission.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Card className={`bg-[#1a1a2e]/50 border-purple-500/20 ${claimed ? 'opacity-50' : ''}`}>
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClass}`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-white">{mission.title}</h3>
                    <p className="text-slate-400 text-sm">{mission.description}</p>
                  </div>
                  <Badge className={`bg-gradient-to-r ${colorClass} text-white`}>
                    +{mission.points_reward} pkt
                  </Badge>
                </div>
                
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <span className="text-slate-400">
                      {progress} / {mission.requirement_value}
                    </span>
                    <span className="text-slate-400">{Math.round(progressPercent)}%</span>
                  </div>
                  <Progress value={progressPercent} className="h-2 bg-slate-700" />
                </div>

                {completed && !claimed && (
                  <Button
                    onClick={() => claimMutation.mutate(mission)}
                    disabled={claimMutation.isPending}
                    className={`w-full mt-4 bg-gradient-to-r ${colorClass}`}
                  >
                    {claimMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Gift className="w-4 h-4 mr-2" />
                    )}
                    Odbierz nagrodę
                  </Button>
                )}

                {mission.badge_reward && (
                  <div className="flex items-center gap-2 mt-3 text-amber-400 text-sm">
                    <Award className="w-4 h-4" />
                    <span>Nagroda: odznaka "{mission.badge_reward}"</span>
                  </div>
                )}

                {claimed && (
                  <div className="flex items-center justify-center gap-2 mt-4 text-emerald-400">
                    <CheckCircle className="w-5 h-5" />
                    <span>Odebrano{mission.badge_reward ? ' + odznaka' : ''}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white">Misje</h1>
          <p className="text-slate-400 mt-1">Wykonuj zadania i zdobywaj dodatkowe punkty</p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Daily Missions */}
            {groupedMissions.daily.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-400" />
                  Misje dzienne
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedMissions.daily.map((m, i) => renderMissionCard(m, i))}
                </div>
              </div>
            )}

            {/* Weekly Missions */}
            {groupedMissions.weekly.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  Misje tygodniowe
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedMissions.weekly.map((m, i) => renderMissionCard(m, i))}
                </div>
              </div>
            )}

            {/* Special Missions */}
            {groupedMissions.special.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-purple-400" />
                  Misje specjalne
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedMissions.special.map((m, i) => renderMissionCard(m, i))}
                </div>
              </div>
            )}

            {/* Achievements */}
            {groupedMissions.achievement.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  Osiągnięcia
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedMissions.achievement.map((m, i) => renderMissionCard(m, i))}
                </div>
              </div>
            )}

            {missions.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <Target className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Brak dostępnych misji</h3>
                <p className="text-slate-400">Sprawdź później, aby znaleźć nowe wyzwania</p>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}