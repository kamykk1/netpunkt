import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { Copy, Users, Gift, TrendingUp, Check } from 'lucide-react';

const REFERRAL_BONUS_PERCENT = 10;

export default function ReferralSection({ user, referredUsers, referralBonuses }) {
  const [copied, setCopied] = useState(false);

  const formatCurrency = (cents) => `${((cents || 0) / 100).toFixed(2)} zł`;

  const referralLink = `${window.location.origin}?ref=${user?.referral_code}`;

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Link polecający skopiowany!');
    setTimeout(() => setCopied(false), 2000);
  };

  const totalReferralEarnings = user?.referral_earnings || 0;
  const activeReferrals = referredUsers?.length || 0;

  return (
    <div className="space-y-6">
      {/* Statystyki poleceń */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Zarobki z poleceń</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(totalReferralEarnings)}</p>
            </div>
            <Gift className="w-10 h-10 text-purple-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 border border-slate-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">Liczba poleceń</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{activeReferrals}</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 border border-slate-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">Stawka bonusu</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{REFERRAL_BONUS_PERCENT}%</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Link polecający */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Twój link polecający</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 mb-4">
            Udostępnij swój link i zarabiaj {REFERRAL_BONUS_PERCENT}% od każdej obejrzanej reklamy przez polecone osoby!
          </p>
          <div className="flex gap-2">
            <Input
              value={referralLink}
              readOnly
              className="bg-slate-50"
            />
            <Button
              onClick={copyToClipboard}
              className={copied ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <div className="mt-4 p-4 bg-purple-50 rounded-xl">
            <p className="text-sm text-purple-700">
              <strong>Twój kod polecający:</strong> <code className="bg-purple-100 px-2 py-1 rounded">{user?.referral_code}</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Lista poleconych użytkowników */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Twoje polecenia</CardTitle>
        </CardHeader>
        <CardContent>
          {referredUsers && referredUsers.length > 0 ? (
            <div className="space-y-3">
              {referredUsers.map((referredUser) => {
                const userBonuses = referralBonuses?.filter(b => b.referred_user_id === referredUser.id) || [];
                const totalFromUser = userBonuses.reduce((sum, b) => sum + (b.bonus_amount || 0), 0);
                
                return (
                  <div
                    key={referredUser.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold">
                        {referredUser.full_name?.[0]?.toUpperCase() || referredUser.email?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{referredUser.full_name || 'Użytkownik'}</p>
                        <p className="text-sm text-slate-500">{referredUser.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-600">{formatCurrency(totalFromUser)}</p>
                      <p className="text-xs text-slate-400">zarobione z tego polecenia</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">Brak poleceń</p>
              <p className="text-sm text-slate-400">Udostępnij swój link, aby zacząć zarabiać!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}