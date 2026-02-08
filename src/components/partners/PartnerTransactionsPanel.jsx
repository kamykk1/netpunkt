import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  RefreshCw, Loader2, CheckCircle, XCircle, Clock, 
  DollarSign, Download, Filter, Search, ExternalLink,
  TrendingUp, AlertTriangle, Coins
} from 'lucide-react';

const PARTNER_LOGOS = {
  systempartnerski: { name: 'SystemPartnerski', color: 'bg-blue-500' },
  mylead: { name: 'MyLead', color: 'bg-orange-500' },
  vivnetwork: { name: 'VivNetwork', color: 'bg-purple-500' },
  superpartners: { name: 'SuperPartners', color: 'bg-green-500' },
  temu: { name: 'Temu', color: 'bg-orange-600' },
  aliexpress: { name: 'AliExpress', color: 'bg-red-500' },
};

export default function PartnerTransactionsPanel({ userId }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [syncing, setSyncing] = useState(false);
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['partnerTransactions', userId],
    queryFn: () => base44.entities.PartnerTransaction.filter(
      { user_id: userId }, 
      '-created_date'
    ),
    enabled: !!userId
  });

  const { data: programs = [] } = useQuery({
    queryKey: ['partnerPrograms'],
    queryFn: () => base44.entities.PartnerProgram.filter({ is_enabled: true })
  });

  const claimMutation = useMutation({
    mutationFn: async (transaction) => {
      // Aktualizuj transakcję
      await base44.entities.PartnerTransaction.update(transaction.id, { 
        status: 'paid' 
      });
      
      // Dodaj punkty użytkownikowi
      const user = await base44.auth.me();
      await base44.auth.updateMe({ 
        points_balance: (user.points_balance || 0) + transaction.points_earned 
      });
      
      // Zapisz w historii
      await base44.entities.PointsHistory.create({
        user_id: userId,
        amount: transaction.points_earned,
        type: 'cashback',
        description: `Prowizja od ${PARTNER_LOGOS[transaction.partner_slug]?.name || transaction.partner_slug}`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnerTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Prowizja wypłacona!');
    }
  });

  const syncTransactions = async () => {
    setSyncing(true);
    
    // Symulacja pobierania z API partnerów
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Dodaj przykładowe transakcje
    const mockTransactions = [
      {
        user_id: userId,
        partner_slug: 'mylead',
        action_type: 'registration',
        action_description: 'Rejestracja w serwisie XYZ',
        commission_value: 1500,
        points_earned: 150,
        status: 'pending'
      },
      {
        user_id: userId,
        partner_slug: 'systempartnerski',
        action_type: 'purchase',
        action_description: 'Zakup produktu w sklepie ABC',
        commission_value: 2340,
        points_earned: 234,
        status: 'confirmed'
      }
    ];

    for (const tx of mockTransactions) {
      await base44.entities.PartnerTransaction.create(tx);
    }
    
    queryClient.invalidateQueries({ queryKey: ['partnerTransactions'] });
    setSyncing(false);
    toast.success('Zsynchronizowano transakcje!');
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = !searchQuery || 
      tx.action_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.partner_slug?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    pending: transactions.filter(t => t.status === 'pending').reduce((s, t) => s + (t.points_earned || 0), 0),
    confirmed: transactions.filter(t => t.status === 'confirmed').reduce((s, t) => s + (t.points_earned || 0), 0),
    paid: transactions.filter(t => t.status === 'paid').reduce((s, t) => s + (t.points_earned || 0), 0),
    total: transactions.reduce((s, t) => s + (t.points_earned || 0), 0),
  };

  const statusConfig = {
    pending: { color: 'bg-amber-500/20 text-amber-400', icon: Clock, label: 'Oczekuje' },
    confirmed: { color: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle, label: 'Potwierdzona' },
    paid: { color: 'bg-blue-500/20 text-blue-400', icon: DollarSign, label: 'Wypłacona' },
    rejected: { color: 'bg-red-500/20 text-red-400', icon: XCircle, label: 'Odrzucona' },
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Oczekujące', value: stats.pending, color: 'text-amber-400', icon: Clock },
          { label: 'Do wypłaty', value: stats.confirmed, color: 'text-emerald-400', icon: CheckCircle },
          { label: 'Wypłacone', value: stats.paid, color: 'text-blue-400', icon: DollarSign },
          { label: 'Łącznie', value: stats.total, color: 'text-purple-400', icon: TrendingUp },
        ].map((stat, i) => (
          <Card key={i} className="bg-[#1a1a2e]/50 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-slate-500 text-xs">punktów</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color} opacity-50`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Sync */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <CardTitle className="text-white flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-400" />
              Transakcje partnerskie
            </CardTitle>
            <Button
              onClick={syncTransactions}
              disabled={syncing}
              className="bg-gradient-to-r from-purple-600 to-cyan-600"
            >
              {syncing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Synchronizuj z API
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Szukaj transakcji..."
                className="pl-10 bg-slate-800 border-purple-500/30 text-white"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'pending', 'confirmed', 'paid'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className={statusFilter === status 
                    ? 'bg-purple-600' 
                    : 'border-purple-500/30 text-slate-300'}
                >
                  {status === 'all' ? 'Wszystkie' : statusConfig[status]?.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Transactions List */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="space-y-3">
              {filteredTransactions.map((tx, i) => {
                const config = statusConfig[tx.status] || statusConfig.pending;
                const Icon = config.icon;
                const partner = PARTNER_LOGOS[tx.partner_slug];
                
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="p-4 rounded-xl bg-slate-800/50 border border-purple-500/20"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg ${partner?.color || 'bg-slate-600'} flex items-center justify-center text-white font-bold text-xs`}>
                          {partner?.name?.slice(0, 2) || 'PP'}
                        </div>
                        <div>
                          <p className="text-white font-medium">{tx.action_description || 'Transakcja'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                              {partner?.name || tx.partner_slug}
                            </Badge>
                            <span className="text-slate-500 text-xs">
                              {new Date(tx.created_date).toLocaleDateString('pl-PL')}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-xl font-bold text-emerald-400">+{tx.points_earned} pkt</p>
                        <Badge className={config.color}>
                          <Icon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>
                    </div>
                    
                    {tx.status === 'confirmed' && (
                      <div className="mt-3 pt-3 border-t border-slate-700">
                        <Button
                          size="sm"
                          onClick={() => claimMutation.mutate(tx)}
                          disabled={claimMutation.isPending}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          {claimMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-1" />
                          ) : (
                            <Download className="w-4 h-4 mr-1" />
                          )}
                          Wypłać punkty
                        </Button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Coins className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Brak transakcji</p>
              <p className="text-sm">Kliknij "Synchronizuj" aby pobrać dane</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}