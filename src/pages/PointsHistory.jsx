import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Coins, Eye, Users, Gift, Target, Star, Clock, 
  ShoppingBag, CreditCard, Mail, Loader2, TrendingUp, TrendingDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TYPE_CONFIG = {
  ad_view: { icon: Eye, color: 'text-cyan-400', bg: 'bg-cyan-500/20', label: 'Reklama' },
  referral_bonus: { icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/20', label: 'Polecenie' },
  withdrawal: { icon: CreditCard, color: 'text-red-400', bg: 'bg-red-500/20', label: 'Wypłata' },
  purchase: { icon: ShoppingBag, color: 'text-pink-400', bg: 'bg-pink-500/20', label: 'Zakup' },
  cashback: { icon: Gift, color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'Cashback' },
  mission: { icon: Target, color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Misja' },
  daily_bonus: { icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Bonus dzienny' },
  event_bonus: { icon: Star, color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'Event' },
  admin_adjustment: { icon: Coins, color: 'text-slate-400', bg: 'bg-slate-500/20', label: 'Korekta' },
  shop_purchase: { icon: ShoppingBag, color: 'text-pink-400', bg: 'bg-pink-500/20', label: 'Sklep' },
  email_read: { icon: Mail, color: 'text-cyan-400', bg: 'bg-cyan-500/20', label: 'Email' },
};

export default function PointsHistory() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['fullPointsHistory', user?.id],
    queryFn: () => base44.entities.PointsHistory.filter({ user_id: user?.id }, '-created_date', 100),
    enabled: !!user?.id
  });

  const totalEarned = history.filter(h => h.amount > 0).reduce((sum, h) => sum + h.amount, 0);
  const totalSpent = history.filter(h => h.amount < 0).reduce((sum, h) => sum + Math.abs(h.amount), 0);

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white">Historia punktów</h1>
          <p className="text-slate-400 mt-1">Pełna historia Twoich transakcji punktowych</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-[#1a1a2e]/50 border border-purple-500/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Aktualne saldo</p>
                <p className="text-3xl font-bold text-white mt-1">{(user?.points_balance || 0).toLocaleString()}</p>
              </div>
              <Coins className="w-10 h-10 text-yellow-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Zdobyte</p>
                <p className="text-3xl font-bold text-emerald-400 mt-1">+{totalEarned.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-emerald-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Wydane</p>
                <p className="text-3xl font-bold text-red-400 mt-1">-{totalSpent.toLocaleString()}</p>
              </div>
              <TrendingDown className="w-10 h-10 text-red-400" />
            </div>
          </motion.div>
        </div>

        {/* History List */}
        <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              Ostatnie transakcje
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              </div>
            ) : history.length > 0 ? (
              <div className="space-y-3">
                {history.map((entry, index) => {
                  const config = TYPE_CONFIG[entry.type] || TYPE_CONFIG.ad_view;
                  const Icon = config.icon;
                  const isPositive = entry.amount > 0;
                  
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-purple-500/20"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${config.bg}`}>
                          <Icon className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <div>
                          <p className="text-white font-medium">{entry.description || config.label}</p>
                          <p className="text-slate-400 text-sm flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(entry.created_date).toLocaleDateString('pl-PL', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-lg ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isPositive ? '+' : ''}{entry.amount.toLocaleString()} pkt
                        </p>
                        <p className="text-slate-500 text-xs">
                          Saldo: {entry.balance_after?.toLocaleString() || '—'}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Coins className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Brak historii punktów</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}