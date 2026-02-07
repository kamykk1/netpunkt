import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Users, Coins, Gift, Copy, Check, Share2, Link, Bell,
  Loader2, TrendingUp, UserPlus, Award, Layers
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Referrals() {
  const [copied, setCopied] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: referredUsers = [], isLoading } = useQuery({
    queryKey: ['referredUsers', user?.id],
    queryFn: () => base44.entities.User.filter({ referred_by: user?.id }),
    enabled: !!user?.id
  });

  // Poziom 2 - poleceni przez poleconych
  const { data: level2Users = [] } = useQuery({
    queryKey: ['level2Users', user?.id],
    queryFn: () => base44.entities.User.filter({ referred_by_level2: user?.id }),
    enabled: !!user?.id
  });

  // Poziom 3
  const { data: level3Users = [] } = useQuery({
    queryKey: ['level3Users', user?.id],
    queryFn: () => base44.entities.User.filter({ referred_by_level3: user?.id }),
    enabled: !!user?.id
  });

  const { data: referralBonuses = [] } = useQuery({
    queryKey: ['referralBonuses', user?.id],
    queryFn: () => base44.entities.ReferralBonus.filter({ referrer_id: user?.id }, '-created_date', 50),
    enabled: !!user?.id
  });

  const { data: settings = [] } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: () => base44.entities.SiteSettings.list()
  });

  const getSetting = (key, defaultValue) => {
    const setting = settings.find(s => s.setting_key === key);
    return setting ? setting.setting_value : defaultValue;
  };

  const referralBonusPercent = parseFloat(getSetting('referral_bonus_percent', '10'));
  const referralBonusLevel2 = parseFloat(getSetting('referral_bonus_level2', '5'));
  const referralBonusLevel3 = parseFloat(getSetting('referral_bonus_level3', '2'));

  const referralLink = `${window.location.origin}?ref=${user?.referral_code}`;

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Link skopiowany!');
    setTimeout(() => setCopied(false), 2000);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const totalLevel1 = user?.referral_earnings || 0;
  const totalLevel2 = user?.referral_earnings_level2 || 0;
  const totalLevel3 = user?.referral_earnings_level3 || 0;
  const totalEarnings = totalLevel1 + totalLevel2 + totalLevel3;

  const renderUserList = (users, level, bonusPercent) => (
    <div className="space-y-3">
      {users.length > 0 ? users.map((refUser) => {
        const userBonuses = referralBonuses.filter(b => b.referred_user_id === refUser.id);
        const totalFromUser = userBonuses.reduce((sum, b) => sum + (b.bonus_amount || 0), 0);
        
        return (
          <motion.div
            key={refUser.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-purple-500/20"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-cyan-500 text-white">
                  {getInitials(refUser.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white font-medium">{refUser.full_name || 'Użytkownik'}</p>
                <p className="text-slate-400 text-sm">{refUser.email}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-yellow-400 font-bold flex items-center gap-1">
                <Coins className="w-4 h-4" />
                +{totalFromUser.toLocaleString()}
              </p>
              <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-xs">
                Poziom {level}
              </Badge>
            </div>
          </motion.div>
        );
      }) : (
        <div className="text-center py-8 text-slate-400">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>Brak poleceń na poziomie {level}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white">Program poleceń</h1>
          <p className="text-slate-400 mt-1">Wielopoziomowy system nagród za polecenia</p>
        </motion.div>

        {/* Multi-level Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-500/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Łączne zarobki</p>
                <p className="text-3xl font-bold text-white mt-1">{totalEarnings.toLocaleString()}</p>
                <p className="text-yellow-400 text-sm">punktów</p>
              </div>
              <Gift className="w-10 h-10 text-purple-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-5 rounded-2xl bg-[#1a1a2e]/50 border border-purple-500/20"
          >
            <p className="text-slate-400 text-xs mb-1">Poziom 1 ({referralBonusPercent}%)</p>
            <p className="text-2xl font-bold text-emerald-400">{referredUsers.length}</p>
            <p className="text-xs text-slate-500">+{totalLevel1.toLocaleString()} pkt</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-5 rounded-2xl bg-[#1a1a2e]/50 border border-purple-500/20"
          >
            <p className="text-slate-400 text-xs mb-1">Poziom 2 ({referralBonusLevel2}%)</p>
            <p className="text-2xl font-bold text-cyan-400">{level2Users.length}</p>
            <p className="text-xs text-slate-500">+{totalLevel2.toLocaleString()} pkt</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-5 rounded-2xl bg-[#1a1a2e]/50 border border-purple-500/20"
          >
            <p className="text-slate-400 text-xs mb-1">Poziom 3 ({referralBonusLevel3}%)</p>
            <p className="text-2xl font-bold text-pink-400">{level3Users.length}</p>
            <p className="text-xs text-slate-500">+{totalLevel3.toLocaleString()} pkt</p>
          </motion.div>
        </div>

        {/* How it works */}
        <Card className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border-purple-500/20 mb-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-400" />
              Jak działają poziomy poleceń?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Poziom 1</span>
                </div>
                <p className="text-white text-2xl font-bold">{referralBonusPercent}%</p>
                <p className="text-slate-400 text-sm">od zarobków poleconego</p>
              </div>
              <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-cyan-400" />
                  <span className="text-cyan-400 font-bold">Poziom 2</span>
                </div>
                <p className="text-white text-2xl font-bold">{referralBonusLevel2}%</p>
                <p className="text-slate-400 text-sm">od poleconych przez Twoich poleconych</p>
              </div>
              <div className="p-4 rounded-lg bg-pink-500/10 border border-pink-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-pink-400" />
                  <span className="text-pink-400 font-bold">Poziom 3</span>
                </div>
                <p className="text-white text-2xl font-bold">{referralBonusLevel3}%</p>
                <p className="text-slate-400 text-sm">od 3. poziomu sieci</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral Link */}
        <Card className="bg-[#1a1a2e]/50 border-purple-500/20 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Link className="w-5 h-5 text-purple-400" />
              Twój link polecający
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={referralLink}
                readOnly
                className="bg-slate-800 border-purple-500/30 text-white"
              />
              <Button
                onClick={copyToClipboard}
                className={copied 
                  ? 'bg-emerald-600 hover:bg-emerald-700' 
                  : 'bg-gradient-to-r from-purple-600 to-cyan-600'}
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </Button>
            </div>
            <div className="mt-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <p className="text-slate-300 text-sm">
                <strong className="text-purple-400">Twój kod:</strong>{' '}
                <code className="bg-purple-500/20 px-2 py-1 rounded text-white">{user?.referral_code}</code>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Referral Lists by Level */}
        <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-cyan-400" />
              Twoja sieć poleceń
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="level1">
              <TabsList className="bg-slate-800 border border-purple-500/20 mb-4">
                <TabsTrigger value="level1" className="data-[state=active]:bg-emerald-500">
                  Poziom 1 ({referredUsers.length})
                </TabsTrigger>
                <TabsTrigger value="level2" className="data-[state=active]:bg-cyan-500">
                  Poziom 2 ({level2Users.length})
                </TabsTrigger>
                <TabsTrigger value="level3" className="data-[state=active]:bg-pink-500">
                  Poziom 3 ({level3Users.length})
                </TabsTrigger>
                <TabsTrigger value="history" className="data-[state=active]:bg-purple-500">
                  Historia
                </TabsTrigger>
              </TabsList>

              <TabsContent value="level1">
                {renderUserList(referredUsers, 1, referralBonusPercent)}
              </TabsContent>

              <TabsContent value="level2">
                {renderUserList(level2Users, 2, referralBonusLevel2)}
              </TabsContent>

              <TabsContent value="level3">
                {renderUserList(level3Users, 3, referralBonusLevel3)}
              </TabsContent>

              <TabsContent value="history">
                {referralBonuses.length > 0 ? (
                  <div className="space-y-3">
                    {referralBonuses.slice(0, 20).map((bonus) => (
                      <div
                        key={bonus.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50"
                      >
                        <div className="flex items-center gap-3">
                          <Bell className="w-4 h-4 text-yellow-400" />
                          <div>
                            <p className="text-white text-sm">Bonus od {bonus.referred_user_email}</p>
                            <p className="text-slate-500 text-xs">
                              {new Date(bonus.created_date).toLocaleDateString('pl-PL')}
                            </p>
                          </div>
                        </div>
                        <span className="text-yellow-400 font-bold">+{bonus.bonus_amount} pkt</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>Brak historii bonusów</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}