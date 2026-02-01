import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Trophy, Medal, Crown, Coins, Users, TrendingUp,
  Loader2, Star, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Ranking() {
  const [period, setPeriod] = useState('all');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['rankingUsers'],
    queryFn: () => base44.entities.User.list('-total_points_earned', 100)
  });

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getMedalIcon = (position) => {
    if (position === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (position === 2) return <Medal className="w-6 h-6 text-slate-300" />;
    if (position === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="text-slate-400 font-bold">#{position}</span>;
  };

  const getPositionStyle = (position) => {
    if (position === 1) return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
    if (position === 2) return 'bg-gradient-to-r from-slate-400/20 to-slate-500/20 border-slate-400/30';
    if (position === 3) return 'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/30';
    return 'bg-[#1a1a2e]/50 border-purple-500/20';
  };

  const userPosition = users.findIndex(u => u.id === user?.id) + 1;

  // Top 3 for podium
  const top3 = users.slice(0, 3);
  const restUsers = users.slice(3);

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-white">Ranking</h1>
          <p className="text-slate-400 mt-1">Najlepsi gracze platformy</p>
        </motion.div>

        {/* User's Position */}
        {user && userPosition > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border-purple-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-white font-bold">
                      {getInitials(user.full_name)}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{user.full_name}</p>
                      <p className="text-slate-400 text-sm">{(user.total_points_earned || 0).toLocaleString()} pkt</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-sm">Twoja pozycja</p>
                    <p className="text-2xl font-bold text-purple-400">#{userPosition}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : (
          <>
            {/* Podium - Top 3 */}
            {top3.length >= 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-end justify-center gap-4 mb-8"
              >
                {/* 2nd Place */}
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white font-bold text-xl border-4 border-slate-300">
                    {getInitials(top3[1]?.full_name)}
                  </div>
                  <Medal className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                  <p className="text-white font-semibold text-sm truncate max-w-[100px]">{top3[1]?.full_name}</p>
                  <p className="text-yellow-400 text-sm font-bold">{(top3[1]?.total_points_earned || 0).toLocaleString()}</p>
                  <div className="w-20 h-24 mt-2 bg-gradient-to-t from-slate-500/50 to-slate-400/20 rounded-t-lg" />
                </div>

                {/* 1st Place */}
                <div className="text-center -mt-8">
                  <Crown className="w-10 h-10 mx-auto text-yellow-400 mb-2" />
                  <div className="w-24 h-24 mx-auto mb-2 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white font-bold text-2xl border-4 border-yellow-300">
                    {getInitials(top3[0]?.full_name)}
                  </div>
                  <p className="text-white font-semibold truncate max-w-[120px]">{top3[0]?.full_name}</p>
                  <p className="text-yellow-400 font-bold">{(top3[0]?.total_points_earned || 0).toLocaleString()}</p>
                  <div className="w-24 h-32 mt-2 bg-gradient-to-t from-yellow-500/50 to-yellow-400/20 rounded-t-lg" />
                </div>

                {/* 3rd Place */}
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center text-white font-bold text-xl border-4 border-amber-500">
                    {getInitials(top3[2]?.full_name)}
                  </div>
                  <Medal className="w-8 h-8 mx-auto text-amber-600 mb-1" />
                  <p className="text-white font-semibold text-sm truncate max-w-[100px]">{top3[2]?.full_name}</p>
                  <p className="text-yellow-400 text-sm font-bold">{(top3[2]?.total_points_earned || 0).toLocaleString()}</p>
                  <div className="w-20 h-16 mt-2 bg-gradient-to-t from-amber-600/50 to-amber-500/20 rounded-t-lg" />
                </div>
              </motion.div>
            )}

            {/* Rest of Ranking */}
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  Pełny ranking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {users.map((u, index) => {
                  const position = index + 1;
                  const isCurrentUser = u.id === user?.id;
                  
                  return (
                    <motion.div
                      key={u.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={`flex items-center justify-between p-4 rounded-xl border ${getPositionStyle(position)} ${isCurrentUser ? 'ring-2 ring-purple-500' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 flex justify-center">
                          {getMedalIcon(position)}
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-to-br from-purple-600 to-cyan-500 text-white">
                            {getInitials(u.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className={`font-semibold ${isCurrentUser ? 'text-purple-400' : 'text-white'}`}>
                            {u.full_name || 'Użytkownik'}
                            {isCurrentUser && <span className="text-xs ml-2">(Ty)</span>}
                          </p>
                          <p className="text-slate-400 text-sm">
                            Lv.{u.membership_level || 1} • {u.ads_viewed || 0} reklam
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-yellow-400 font-bold flex items-center gap-1">
                          <Coins className="w-4 h-4" />
                          {(u.total_points_earned || 0).toLocaleString()}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}