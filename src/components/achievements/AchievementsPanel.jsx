import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Lock, Gift } from 'lucide-react';
import { toast } from 'sonner';

const RARITY_COLORS = {
  common: 'border-slate-500/40 bg-slate-500/10',
  rare: 'border-blue-500/40 bg-blue-500/10',
  epic: 'border-purple-500/40 bg-purple-500/10',
  legendary: 'border-yellow-500/40 bg-yellow-500/10',
};
const RARITY_BADGE = {
  common: 'bg-slate-500/20 text-slate-300',
  rare: 'bg-blue-500/20 text-blue-300',
  epic: 'bg-purple-500/20 text-purple-300',
  legendary: 'bg-yellow-500/20 text-yellow-300',
};
const RARITY_NAMES = { common: 'Pospolite', rare: 'Rzadkie', epic: 'Epickie', legendary: 'Legendarne' };

export default function AchievementsPanel({ user }) {
  const queryClient = useQueryClient();

  const { data: achievements = [] } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => base44.entities.Achievement.filter({ is_active: true, is_visible: true }, 'sort_order')
  });

  const { data: userAchievements = [] } = useQuery({
    queryKey: ['userAchievements', user?.id],
    queryFn: () => base44.entities.UserAchievement.filter({ user_id: user?.id }),
    enabled: !!user?.id
  });

  const claimMutation = useMutation({
    mutationFn: async (ua) => {
      await base44.entities.UserAchievement.update(ua.id, { reward_claimed: true });
      // Find achievement for reward
      const ach = achievements.find(a => a.key === ua.achievement_key);
      if (ach?.reward_type === 'points' && ach.reward_value) {
        await base44.auth.updateMe({ points_balance: (user.points_balance || 0) + ach.reward_value });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userAchievements', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Nagroda odebrana!');
    }
  });

  const unlockedKeys = new Set(userAchievements.map(u => u.achievement_key));

  const getUserValue = (reqType) => {
    switch (reqType) {
      case 'games_played': return user?.games_played || 0;
      case 'games_won': return user?.games_won || 0;
      case 'points_earned': return user?.total_points_earned || 0;
      case 'referrals_count': return user?.referral_count || 0;
      default: return 0;
    }
  };

  const categories = ['games', 'referrals', 'points', 'social', 'special'];

  return (
    <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" /> Osiągnięcia
          <Badge className="bg-yellow-500/20 text-yellow-400 ml-2">{userAchievements.length}/{achievements.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {achievements.length === 0 ? (
          <p className="text-slate-400 text-center py-6">Brak osiągnięć do odblokowania</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {achievements.map(ach => {
              const unlocked = unlockedKeys.has(ach.key);
              const ua = userAchievements.find(u => u.achievement_key === ach.key);
              const progress = getUserValue(ach.requirement_type);
              const pct = Math.min(100, Math.round((progress / ach.requirement_value) * 100));

              return (
                <div key={ach.key} className={`p-4 rounded-xl border transition-all ${unlocked ? RARITY_COLORS[ach.rarity] || RARITY_COLORS.common : 'border-slate-700/50 bg-slate-800/30 opacity-70'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`text-2xl ${!unlocked ? 'grayscale opacity-50' : ''}`}>{ach.icon || '🏅'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-semibold text-sm ${unlocked ? 'text-white' : 'text-slate-400'}`}>{ach.name}</p>
                        {unlocked ? (
                          <Badge className={`text-xs ${RARITY_BADGE[ach.rarity] || RARITY_BADGE.common}`}>{RARITY_NAMES[ach.rarity]}</Badge>
                        ) : (
                          <Lock className="w-3 h-3 text-slate-500" />
                        )}
                      </div>
                      <p className="text-slate-400 text-xs mt-0.5">{ach.description}</p>
                      {!unlocked && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>Postęp</span><span>{progress}/{ach.requirement_value}</span>
                          </div>
                          <div className="h-1.5 bg-slate-700 rounded-full"><div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${pct}%` }} /></div>
                        </div>
                      )}
                      {unlocked && ach.reward_value > 0 && (
                        <p className="text-emerald-400 text-xs mt-1 flex items-center gap-1"><Gift className="w-3 h-3" /> Nagroda: {ach.reward_description || `${ach.reward_value} pkt`}</p>
                      )}
                    </div>
                  </div>
                  {unlocked && ua && !ua.reward_claimed && ach.reward_type === 'points' && ach.reward_value > 0 && (
                    <Button size="sm" onClick={() => claimMutation.mutate(ua)} disabled={claimMutation.isPending}
                      className="w-full mt-3 bg-gradient-to-r from-yellow-600 to-amber-500 text-white text-xs h-7">
                      <Gift className="w-3 h-3 mr-1" /> Odbierz {ach.reward_value} pkt
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}