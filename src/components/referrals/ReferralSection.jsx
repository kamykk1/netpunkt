import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { Copy, Users, Gift, TrendingUp, Check } from 'lucide-react';
import { format } from 'date-fns';

const REFERRAL_BONUS_PERCENT = 10; // 10% of ad reward goes to referrer

export default function ReferralSection({ user, referredUsers, referralBonuses }) {
  const [copied, setCopied] = useState(false);

  const formatCurrency = (cents) => `$${((cents || 0) / 100).toFixed(2)}`;

  const referralLink = `${window.location.origin}?ref=${user?.referral_code}`;

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const totalReferralEarnings = user?.referral_earnings || 0;
  const activeReferrals = referredUsers?.length || 0;

  return (
    <div className="space-y-6">
      {/* Referral Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Referral Earnings</p>
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
              <p className="text-slate-500 text-sm">Total Referrals</p>
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
              <p className="text-slate-500 text-sm">Bonus Rate</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{REFERRAL_BONUS_PERCENT}%</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Referral Link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Referral Link</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 mb-4">
            Share your link and earn {REFERRAL_BONUS_PERCENT}% of every ad view your referrals complete!
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
              <strong>Your referral code:</strong> <code className="bg-purple-100 px-2 py-1 rounded">{user?.referral_code}</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Referred Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Referrals</CardTitle>
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
                        <p className="font-medium text-slate-900">{referredUser.full_name || 'User'}</p>
                        <p className="text-sm text-slate-500">{referredUser.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-600">{formatCurrency(totalFromUser)}</p>
                      <p className="text-xs text-slate-400">earned from this referral</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No referrals yet</p>
              <p className="text-sm text-slate-400">Share your link to start earning!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}