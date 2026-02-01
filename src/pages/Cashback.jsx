import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Gift, Coins, Clock, CheckCircle, XCircle, ShoppingBag,
  Loader2, ExternalLink, TrendingUp
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const CASHBACK_SHOPS = [
  { name: 'AliExpress', logo: '🛒', cashback: '5%', url: 'https://aliexpress.com', network: 'admitad' },
  { name: 'Amazon', logo: '📦', cashback: '3%', url: 'https://amazon.com', network: 'awin' },
  { name: 'Allegro', logo: '🏪', cashback: '2%', url: 'https://allegro.pl', network: 'tradedoubler' },
  { name: 'Media Expert', logo: '📺', cashback: '4%', url: 'https://mediaexpert.pl', network: 'awin' },
  { name: 'RTV Euro AGD', logo: '🔌', cashback: '3.5%', url: 'https://euro.com.pl', network: 'admitad' },
  { name: 'Zalando', logo: '👗', cashback: '6%', url: 'https://zalando.pl', network: 'awin' },
];

export default function Cashback() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['cashbackTransactions', user?.id],
    queryFn: () => base44.entities.CashbackTransaction.filter({ user_id: user?.id }, '-created_date'),
    enabled: !!user?.id
  });

  const statusConfig = {
    pending: { color: 'bg-amber-500/20 text-amber-400', icon: Clock, label: 'Oczekuje' },
    confirmed: { color: 'bg-blue-500/20 text-blue-400', icon: CheckCircle, label: 'Potwierdzone' },
    paid: { color: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle, label: 'Wypłacone' },
    rejected: { color: 'bg-red-500/20 text-red-400', icon: XCircle, label: 'Odrzucone' },
  };

  const pendingTotal = transactions
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + (t.points_earned || 0), 0);

  const confirmedTotal = transactions
    .filter(t => t.status === 'confirmed' || t.status === 'paid')
    .reduce((sum, t) => sum + (t.points_earned || 0), 0);

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white">Cashback</h1>
          <p className="text-slate-400 mt-1">Rób zakupy i otrzymuj punkty zwrotne</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-emerald-600/20 to-emerald-900/20 border border-emerald-500/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Całkowity cashback</p>
                <p className="text-3xl font-bold text-white mt-1">{(user?.cashback_confirmed || 0).toLocaleString()}</p>
                <p className="text-emerald-400 text-sm">punktów</p>
              </div>
              <Gift className="w-10 h-10 text-emerald-400" />
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
                <p className="text-slate-400 text-sm">Oczekujący cashback</p>
                <p className="text-3xl font-bold text-white mt-1">{pendingTotal.toLocaleString()}</p>
                <p className="text-amber-400 text-sm">punktów</p>
              </div>
              <Clock className="w-10 h-10 text-amber-400" />
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
                <p className="text-slate-400 text-sm">Transakcji</p>
                <p className="text-3xl font-bold text-white mt-1">{transactions.length}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-400" />
            </div>
          </motion.div>
        </div>

        {/* How it works */}
        <Card className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border-purple-500/20 mb-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Jak działa cashback?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">1</div>
                <div>
                  <p className="text-white font-medium">Kliknij w sklep</p>
                  <p className="text-slate-400 text-sm">Wybierz sklep z listy poniżej</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">2</div>
                <div>
                  <p className="text-white font-medium">Zrób zakupy</p>
                  <p className="text-slate-400 text-sm">Kup co chcesz w sklepie</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">3</div>
                <div>
                  <p className="text-white font-medium">Otrzymaj punkty</p>
                  <p className="text-slate-400 text-sm">Cashback zostanie naliczony automatycznie</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shops */}
        <Card className="bg-[#1a1a2e]/50 border-purple-500/20 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-cyan-400" />
              Sklepy z cashbackiem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {CASHBACK_SHOPS.map((shop, index) => (
                <motion.a
                  key={shop.name}
                  href={shop.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-purple-500/20 hover:border-purple-500/40 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{shop.logo}</span>
                    <div>
                      <p className="text-white font-medium group-hover:text-purple-400 transition-colors">{shop.name}</p>
                      <p className="text-slate-500 text-xs">{shop.network}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-emerald-500/20 text-emerald-400">{shop.cashback}</Badge>
                    <ExternalLink className="w-4 h-4 text-slate-500 mt-1 group-hover:text-purple-400 transition-colors" />
                  </div>
                </motion.a>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-400" />
              Historia cashbacku
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              </div>
            ) : transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((tx) => {
                  const config = statusConfig[tx.status] || statusConfig.pending;
                  const Icon = config.icon;
                  
                  return (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-purple-500/20"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${config.color.split(' ')[0]}`}>
                          <Icon className={`w-5 h-5 ${config.color.split(' ')[1]}`} />
                        </div>
                        <div>
                          <p className="text-white font-medium">{tx.shop_name}</p>
                          <p className="text-slate-400 text-sm">
                            Zamówienie: {(tx.order_amount / 100).toFixed(2)} zł • {tx.cashback_percent}%
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-yellow-400 font-bold">+{tx.points_earned} pkt</p>
                        <Badge className={config.color}>{config.label}</Badge>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Brak transakcji cashbackowych</p>
                <p className="text-sm">Zrób zakupy przez nasze linki, aby otrzymać punkty!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}