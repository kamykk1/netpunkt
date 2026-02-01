import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Users, Coins, Gift, Copy, Check, Share2, Link,
  Loader2, TrendingUp, UserPlus
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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

  const totalEarnings = user?.referral_earnings || 0;
  const totalReferrals = referredUsers.length;

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
          <p className="text-slate-400 mt-1">Zapraszaj znajomych i zarabiaj razem</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-500/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Zarobki z poleceń</p>
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
            className="p-6 rounded-2xl bg-[#1a1a2e]/50 border border-purple-500/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Poleconych użytkowników</p>
                <p className="text-3xl font-bold text-white mt-1">{totalReferrals}</p>
              </div>
              <Users className="w-10 h-10 text-cyan-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl bg-[#1a1a2e]/50 border border-purple-500/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Twoja prowizja</p>
                <p className="text-3xl font-bold text-white mt-1">{referralBonusPercent}%</p>
              </div>
              <TrendingUp className="w-10 h-10 text-emerald-400" />
            </div>
          </motion.div>
        </div>

        {/* Referral Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-[#1a1a2e]/50 border-purple-500/20 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Link className="w-5 h-5 text-purple-400" />
                Twój link polecający
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm mb-4">
                Udostępnij ten link znajomym. Za każdą reklamę obejrzaną przez poleconą osobę otrzymasz {referralBonusPercent}% punktów jako bonus!
              </p>
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
        </motion.div>

        {/* Referred Users */}
        <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-cyan-400" />
              Twoje polecenia
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              </div>
            ) : referredUsers.length > 0 ? (
              <div className="space-y-3">
                {referredUsers.map((refUser) => {
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
                        <p className="text-xs text-slate-500">punktów z polecenia</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Brak poleconych użytkowników</p>
                <p className="text-sm">Udostępnij swój link, aby zacząć zarabiać!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}