import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Trophy, Medal, Crown, Coins, Loader2, Shield, ChevronUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const LEAGUES = [
  { key: 'all',      name: 'Wszystkie',  icon: '🏆', color: 'from-purple-500 to-cyan-500',  minElo: 0 },
  { key: 'bronze',   name: 'Brązowa',    icon: '🥉', color: 'from-amber-700 to-amber-600',  minElo: 0,    maxElo: 1199 },
  { key: 'silver',   name: 'Srebrna',    icon: '🥈', color: 'from-slate-400 to-slate-500',  minElo: 1200, maxElo: 1399 },
  { key: 'gold',     name: 'Złota',      icon: '🥇', color: 'from-yellow-400 to-amber-500', minElo: 1400, maxElo: 1599 },
  { key: 'platinum', name: 'Platynowa',  icon: '💠', color: 'from-cyan-400 to-blue-500',     minElo: 1600, maxElo: 1799 },
  { key: 'diamond',  name: 'Diamentowa', icon: '💎', color: 'from-purple-400 to-pink-500',   minElo: 1800, maxElo: 99999 },
];

const LEAGUE_BADGES = {
  bronze:   { name: 'Brązowa',   icon: '🥉', color: 'bg-amber-700',   text: 'text-amber-400' },
  silver:   { name: 'Srebrna',   icon: '🥈', color: 'bg-slate-500',   text: 'text-slate-300' },
  gold:     { name: 'Złota',     icon: '🥇', color: 'bg-yellow-600',   text: 'text-yellow-400' },
  platinum: { name: 'Platynowa', icon: '💠', color: 'bg-cyan-600',     text: 'text-cyan-400' },
  diamond:  { name: 'Diamentowa',icon: '💎', color: 'bg-purple-600',   text: 'text-purple-400' },
};

function getLeagueForUser(elo) {
  return LEAGUES.find(l => l.key !== 'all' && elo >= l.minElo && elo <= l.maxElo) || LEAGUES[1];
}

export default function Ranking() {
  const [activeLeague, setActiveLeague] = useState('all');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['rankingUsers'],
    queryFn: () => base44.entities.User.list('-elo_rating', 100)
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

  const sortedUsers = [...users].sort((a, b) => (b.elo_rating || 1000) - (a.elo_rating || 1000));
  const filteredUsers = activeLeague === 'all' ? sortedUsers : sortedUsers.filter(u => {
    const league = getLeagueForUser(u.elo_rating || 1000);
    return league.key === activeLeague;
  });

  const userPosition = sortedUsers.findIndex(u => u.id === user?.id) + 1;
  const userLeague = user ? getLeagueForUser(user.elo_rating || 1000) : null;
  const userLeagueBadge = LEAGUE_BADGES[user?.current_league || userLeague?.key] || LEAGUE_BADGES.bronze;

  // Top 3 from ALL users (not filtered)
  const top3 = sortedUsers.slice(0, 3);
  const restUsers = filteredUsers.slice(3);

  const getLeagueBadge = (elo) => {
    const league = getLeagueForUser(elo || 1000);
    return LEAGUE_BADGES[league.key] || LEAGUE_BADGES.bronze;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-3xl font-bold text-white">Ranking Sezonowy</h1>
          <p className="text-slate-400 mt-1">Ligi oparte na rankingu ELO • Awansuj i zdobywaj nagrody</p>
        </motion.div>

        {/* League Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {LEAGUES.filter(l => l.key !== 'all').map(league => {
            const leagueBadge = LEAGUE_BADGES[league.key];
            const count = sortedUsers.filter(u => {
              const ul = getLeagueForUser(u.elo_rating || 1000);
              return ul.key === league.key;
            }).length;
            return (
              <motion.div
                key={league.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                className={`p-3 rounded-xl bg-gradient-to-br ${league.color} cursor-pointer ${activeLeague === league.key ? 'ring-2 ring-white' : 'opacity-80'}`}
                onClick={() => setActiveLeague(activeLeague === league.key ? 'all' : league.key)}
              >
                <div className="text-center text-white">
                  <span className="text-2xl block">{league.icon}</span>
                  <p className="text-xs font-bold mt-1">{league.name}</p>
                  <p className="text-xs opacity-80">{league.minElo}{league.key !== 'diamond' ? `-${league.maxElo}` : '+'}</p>
                  <p className="text-xs mt-1 opacity-90">{count} graczy</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* User's Position */}
        {user && userPosition > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border-purple-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-white font-bold">
                      {getInitials(user.full_name)}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{user.full_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`${userLeagueBadge.color} text-white`}>
                          {userLeagueBadge.icon} {userLeagueBadge.name}
                        </Badge>
                        <span className="text-slate-400 text-sm">ELO: {user.elo_rating || 1000}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-sm">Twoja pozycja</p>
                    <p className="text-2xl font-bold text-purple-400">#{userPosition}</p>
                    <p className="text-xs text-slate-500">z {sortedUsers.length} graczy</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* League Filter Tabs */}
        <Tabs value={activeLeague} onValueChange={setActiveLeague} className="mb-4">
          <TabsList className="bg-[#1a1a2e] border border-purple-500/20 p-1 flex-wrap h-auto">
            {LEAGUES.map(league => (
              <TabsTrigger
                key={league.key}
                value={league.key}
                className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-xs"
                onClick={() => setActiveLeague(league.key)}
              >
                {league.icon} {league.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : (
          <>
            {/* Podium - Top 3 (only when viewing all leagues) */}
            {activeLeague === 'all' && top3.length >= 3 && (
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
                  <p className="text-cyan-400 text-sm font-bold">ELO {top3[1]?.elo_rating || 1000}</p>
                  <Badge className={`${getLeagueBadge(top3[1]?.elo_rating).color} text-white text-xs mt-1`}>
                    {getLeagueBadge(top3[1]?.elo_rating).icon} {getLeagueBadge(top3[1]?.elo_rating).name}
                  </Badge>
                  <div className="w-20 h-24 mt-2 bg-gradient-to-t from-slate-500/50 to-slate-400/20 rounded-t-lg" />
                </div>

                {/* 1st Place */}
                <div className="text-center -mt-8">
                  <Crown className="w-10 h-10 mx-auto text-yellow-400 mb-2" />
                  <div className="w-24 h-24 mx-auto mb-2 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white font-bold text-2xl border-4 border-yellow-300">
                    {getInitials(top3[0]?.full_name)}
                  </div>
                  <p className="text-white font-semibold truncate max-w-[120px]">{top3[0]?.full_name}</p>
                  <p className="text-cyan-400 font-bold">ELO {top3[0]?.elo_rating || 1000}</p>
                  <Badge className={`${getLeagueBadge(top3[0]?.elo_rating).color} text-white text-xs mt-1`}>
                    {getLeagueBadge(top3[0]?.elo_rating).icon} {getLeagueBadge(top3[0]?.elo_rating).name}
                  </Badge>
                  <div className="w-24 h-32 mt-2 bg-gradient-to-t from-yellow-500/50 to-yellow-400/20 rounded-t-lg" />
                </div>

                {/* 3rd Place */}
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center text-white font-bold text-xl border-4 border-amber-500">
                    {getInitials(top3[2]?.full_name)}
                  </div>
                  <Medal className="w-8 h-8 mx-auto text-amber-600 mb-1" />
                  <p className="text-white font-semibold text-sm truncate max-w-[100px]">{top3[2]?.full_name}</p>
                  <p className="text-cyan-400 text-sm font-bold">ELO {top3[2]?.elo_rating || 1000}</p>
                  <Badge className={`${getLeagueBadge(top3[2]?.elo_rating).color} text-white text-xs mt-1`}>
                    {getLeagueBadge(top3[2]?.elo_rating).icon} {getLeagueBadge(top3[2]?.elo_rating).name}
                  </Badge>
                  <div className="w-20 h-16 mt-2 bg-gradient-to-t from-amber-600/50 to-amber-500/20 rounded-t-lg" />
                </div>
              </motion.div>
            )}

            {/* Ranking List */}
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  {activeLeague === 'all' ? 'Pełny ranking' : `Liga ${LEAGUES.find(l => l.key === activeLeague)?.name}`}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>Brak graczy w tej lidze</p>
                  </div>
                ) : (
                  filteredUsers.map((u, index) => {
                    const globalPosition = sortedUsers.findIndex(su => su.id === u.id) + 1;
                    const isCurrentUser = u.id === user?.id;
                    const leagueBadge = getLeagueBadge(u.elo_rating);

                    return (
                      <motion.div
                        key={u.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className={`flex items-center justify-between p-4 rounded-xl border ${getPositionStyle(globalPosition)} ${isCurrentUser ? 'ring-2 ring-purple-500' : ''}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 flex justify-center">
                            {getMedalIcon(globalPosition)}
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
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge className={`${leagueBadge.color} text-white text-xs`}>
                                {leagueBadge.icon} {leagueBadge.name}
                              </Badge>
                              <span className="text-slate-400 text-xs">Lv.{u.membership_level || 1}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-cyan-400 font-bold flex items-center gap-1 justify-end">
                            <ChevronUp className="w-4 h-4" />
                            {u.elo_rating || 1000}
                          </p>
                          <p className="text-yellow-400 text-xs">{(u.total_points_earned || 0).toLocaleString()} pkt</p>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Rewards Info */}
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20 mt-4">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-base">
                  <Trophy className="w-4 h-4 text-yellow-400" /> Nagrody za awans ligi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                  {LEAGUES.filter(l => l.key !== 'all').map(league => (
                    <div key={league.key} className="p-2 rounded-lg bg-slate-800/50 border border-slate-700">
                      <span className="text-xl block">{league.icon}</span>
                      <p className="text-white text-xs font-bold">{league.name}</p>
                      <p className="text-yellow-400 text-xs mt-1">
                        {league.key === 'bronze' ? 'Liga startowa' : `+${[0, 100, 250, 500, 1000][LEAGUES.findIndex(l => l.key === league.key) - 1]} pkt za awans`}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-slate-500 text-xs mt-3 text-center">
                  Ligi są aktualizowane automatycznie. Walcz w grach multiplayer, aby podnieść swoje ELO!
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}