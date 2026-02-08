import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, Loader2, Download, ArrowUpRight, ArrowDownLeft,
  Filter, Calendar, Coins, TrendingUp
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';

export default function AdminTransactionHistory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState('week');

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['allPointsHistory'],
    queryFn: () => base44.entities.PointsHistory.list('-created_date', 500)
  });

  const typeConfig = {
    ad_view: { label: 'Reklama', color: 'bg-cyan-500/20 text-cyan-400', icon: '👁️' },
    referral_bonus: { label: 'Polecenie', color: 'bg-purple-500/20 text-purple-400', icon: '👥' },
    withdrawal: { label: 'Wypłata', color: 'bg-red-500/20 text-red-400', icon: '💸' },
    purchase: { label: 'Zakup', color: 'bg-amber-500/20 text-amber-400', icon: '🛒' },
    cashback: { label: 'Cashback', color: 'bg-emerald-500/20 text-emerald-400', icon: '💰' },
    mission: { label: 'Misja', color: 'bg-pink-500/20 text-pink-400', icon: '🎯' },
    daily_bonus: { label: 'Bonus', color: 'bg-yellow-500/20 text-yellow-400', icon: '🎁' },
    admin_adjustment: { label: 'Admin', color: 'bg-slate-500/20 text-slate-400', icon: '⚙️' },
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = !searchQuery || 
      tx.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Agregacja do wykresu
  const aggregateByDay = () => {
    const days = dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 365;
    const result = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayKey = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric' });
      
      const dayTx = transactions.filter(tx => 
        new Date(tx.created_date).toISOString().split('T')[0] === dayKey
      );
      
      const income = dayTx.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
      const expense = dayTx.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
      
      result.push({ name: dayName, income, expense, count: dayTx.length });
    }
    return result;
  };

  const chartData = aggregateByDay();
  
  const stats = {
    totalIn: transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0),
    totalOut: transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0),
    count: transactions.length,
    avgPerDay: Math.round(transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0) / 7)
  };

  const exportCSV = () => {
    const csv = [
      ['Data', 'Email', 'Typ', 'Kwota', 'Opis'].join(','),
      ...filteredTransactions.map(tx => [
        new Date(tx.created_date).toLocaleDateString('pl-PL'),
        tx.user_email,
        tx.type,
        tx.amount,
        `"${tx.description || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Punkty wydane', value: stats.totalIn, color: 'text-emerald-400', icon: ArrowUpRight },
          { label: 'Punkty wypłacone', value: stats.totalOut, color: 'text-red-400', icon: ArrowDownLeft },
          { label: 'Transakcji', value: stats.count, color: 'text-cyan-400', icon: Coins },
          { label: 'Śr. dziennie', value: stats.avgPerDay, color: 'text-purple-400', icon: TrendingUp },
        ].map((stat, i) => (
          <Card key={i} className="bg-[#1a1a2e]/50 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value.toLocaleString()}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color} opacity-50`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Przepływ punktów</CardTitle>
            <div className="flex gap-2">
              {['week', 'month'].map((range) => (
                <Button
                  key={range}
                  size="sm"
                  variant={dateRange === range ? 'default' : 'outline'}
                  onClick={() => setDateRange(range)}
                  className={dateRange === range ? 'bg-purple-600' : 'border-purple-500/30 text-slate-300'}
                >
                  {range === 'week' ? '7 dni' : '30 dni'}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #6366f1',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="income" fill="#10b981" name="Przyznane" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#ef4444" name="Wypłacone" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <CardTitle className="text-white">Historia transakcji</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Szukaj..."
                  className="pl-10 w-48 bg-slate-800 border-purple-500/30 text-white"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-36 bg-slate-800 border-purple-500/30 text-white">
                  <SelectValue placeholder="Typ" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-purple-500/30">
                  <SelectItem value="all">Wszystkie</SelectItem>
                  {Object.entries(typeConfig).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.icon} {cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={exportCSV}
                className="border-purple-500/30 text-purple-400"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredTransactions.slice(0, 50).map((tx) => {
                const config = typeConfig[tx.type] || typeConfig.ad_view;
                const isPositive = tx.amount > 0;
                
                return (
                  <div 
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{config.icon}</span>
                      <div>
                        <p className="text-white text-sm">{tx.description || config.label}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 text-xs">{tx.user_email}</span>
                          <span className="text-slate-500 text-xs">
                            {new Date(tx.created_date).toLocaleString('pl-PL')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={config.color}>{config.label}</Badge>
                      <span className={`font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isPositive ? '+' : ''}{tx.amount}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}