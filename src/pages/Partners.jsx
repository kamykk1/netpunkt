import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Handshake, Coins, ExternalLink, CheckCircle, Clock, 
  Loader2, TrendingUp, CreditCard, Gift, Building
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PARTNER_PROGRAMS = [
  {
    slug: 'systempartnerski',
    name: 'SystemPartnerski.pl',
    logo: '🏦',
    description: 'Zakładaj konta, lokaty, pożyczki i zarabiaj punkty',
    actions: ['Założenie konta bankowego', 'Lokata', 'Pożyczka', 'Kredyt'],
    color: 'from-blue-500 to-indigo-600'
  },
  {
    slug: 'mylead',
    name: 'MyLead.global',
    logo: '🎯',
    description: 'Mobile Rewards - wykonuj zadania na telefonie',
    actions: ['Instalacja aplikacji', 'Rejestracja', 'Zakupy in-app'],
    color: 'from-emerald-500 to-teal-600'
  },
  {
    slug: 'vivnetwork',
    name: 'VivNetwork.com.pl',
    logo: '💼',
    description: 'Program partnerski z wieloma ofertami',
    actions: ['Lead generation', 'Sprzedaż', 'Rejestracja'],
    color: 'from-purple-500 to-pink-600'
  },
  {
    slug: 'superpartners',
    name: 'SuperPartners.pl',
    logo: '⭐',
    description: 'Programy lojalnościowe i cashback',
    actions: ['Zakupy online', 'Cashback', 'Ankiety'],
    color: 'from-yellow-500 to-orange-600'
  },
  {
    slug: 'temu',
    name: 'Temu',
    logo: '🛒',
    description: 'Zakupy z cashbackiem i punktami',
    actions: ['Zakupy', 'Cashback za zamówienia'],
    color: 'from-orange-500 to-red-600'
  },
  {
    slug: 'aliexpress',
    name: 'AliExpress',
    logo: '📦',
    description: 'Międzynarodowy marketplace z cashbackiem',
    actions: ['Zakupy', 'Cashback', 'Promocje'],
    color: 'from-red-500 to-pink-600'
  }
];

export default function Partners() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: programs = [], isLoading: programsLoading } = useQuery({
    queryKey: ['partnerPrograms'],
    queryFn: () => base44.entities.PartnerProgram.list()
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['myPartnerTransactions', user?.id],
    queryFn: () => base44.entities.PartnerTransaction.filter({ user_id: user?.id }, '-created_date', 20),
    enabled: !!user?.id
  });

  const pendingPoints = transactions
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + (t.points_earned || 0), 0);

  const confirmedPoints = transactions
    .filter(t => t.status === 'confirmed' || t.status === 'paid')
    .reduce((sum, t) => sum + (t.points_earned || 0), 0);

  const statusConfig = {
    pending: { color: 'bg-amber-500/20 text-amber-400', icon: Clock, label: 'Oczekuje' },
    confirmed: { color: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle, label: 'Potwierdzone' },
    paid: { color: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle, label: 'Wypłacone' },
    rejected: { color: 'bg-red-500/20 text-red-400', icon: CheckCircle, label: 'Odrzucone' },
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white">Programy partnerskie</h1>
          <p className="text-slate-400 mt-1">Wykonuj zadania i zarabiaj dodatkowe punkty</p>
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
                <p className="text-slate-400 text-sm">Zarobione punkty</p>
                <p className="text-3xl font-bold text-white mt-1">{confirmedPoints.toLocaleString()}</p>
              </div>
              <Coins className="w-10 h-10 text-emerald-400" />
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
                <p className="text-slate-400 text-sm">Oczekujące</p>
                <p className="text-3xl font-bold text-amber-400 mt-1">{pendingPoints.toLocaleString()}</p>
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
                <p className="text-slate-400 text-sm">Wykonanych zadań</p>
                <p className="text-3xl font-bold text-white mt-1">{transactions.length}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-400" />
            </div>
          </motion.div>
        </div>

        {/* Partner Programs */}
        <Card className="bg-[#1a1a2e]/50 border-purple-500/20 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Handshake className="w-5 h-5 text-cyan-400" />
              Dostępne programy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PARTNER_PROGRAMS.map((program, index) => {
                const dbProgram = programs.find(p => p.slug === program.slug);
                const isEnabled = dbProgram?.is_enabled || false;
                
                return (
                  <motion.div
                    key={program.slug}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`rounded-xl overflow-hidden ${!isEnabled ? 'opacity-50' : ''}`}
                  >
                    <div className={`p-4 bg-gradient-to-r ${program.color}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-3xl">{program.logo}</span>
                        {isEnabled ? (
                          <Badge className="bg-white/20 text-white">Aktywny</Badge>
                        ) : (
                          <Badge className="bg-black/20 text-white/60">Wkrótce</Badge>
                        )}
                      </div>
                      <h3 className="text-white font-bold mt-2">{program.name}</h3>
                    </div>
                    <div className="p-4 bg-slate-800/50">
                      <p className="text-slate-400 text-sm mb-3">{program.description}</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {program.actions.map((action, i) => (
                          <Badge key={i} variant="outline" className="border-purple-500/30 text-purple-400 text-xs">
                            {action}
                          </Badge>
                        ))}
                      </div>
                      {isEnabled ? (
                        <Button className={`w-full bg-gradient-to-r ${program.color}`}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Przejdź
                        </Button>
                      ) : (
                        <Button disabled className="w-full bg-slate-700">
                          Niedostępne
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-yellow-400" />
              Historia zadań partnerskich
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
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
                          <p className="text-white font-medium">{tx.action_description || tx.action_type}</p>
                          <p className="text-slate-400 text-sm">{tx.partner_slug}</p>
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
                <Handshake className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Brak transakcji partnerskich</p>
                <p className="text-sm">Wykonaj zadanie w jednym z programów partnerskich</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}