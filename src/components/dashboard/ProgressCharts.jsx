import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, Coins, Eye, Calendar } from 'lucide-react';

const COLORS = ['#8b5cf6', '#06b6d4', '#ec4899', '#10b981', '#f59e0b'];

export default function ProgressCharts({ pointsHistory = [], adViews = [], period = 'week' }) {
  // Agregacja danych dziennych
  const aggregateByDay = (data, valueKey = 'amount') => {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
    const result = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayKey = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric' });
      
      const dayData = data.filter(d => 
        new Date(d.created_date).toISOString().split('T')[0] === dayKey
      );
      
      result.push({
        name: dayName,
        value: dayData.reduce((sum, d) => sum + Math.abs(d[valueKey] || 1), 0),
        count: dayData.length
      });
    }
    return result;
  };

  const pointsData = aggregateByDay(pointsHistory, 'amount');
  const viewsData = aggregateByDay(adViews, 'points_earned');

  // Dane do wykresu kołowego (typy zarobków)
  const earningsByType = pointsHistory.reduce((acc, h) => {
    const type = h.type || 'other';
    acc[type] = (acc[type] || 0) + Math.abs(h.amount || 0);
    return acc;
  }, {});

  const pieData = Object.entries(earningsByType).map(([name, value]) => ({
    name: name === 'ad_view' ? 'Reklamy' : 
          name === 'referral_bonus' ? 'Polecenia' :
          name === 'cashback' ? 'Cashback' :
          name === 'mission' ? 'Misje' : 'Inne',
    value
  })).slice(0, 5);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-purple-500/30 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium">{label}</p>
          <p className="text-purple-400">{payload[0].value.toLocaleString()} pkt</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Wykres liniowy - punkty w czasie */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex items-center gap-2 text-base">
              <Coins className="w-5 h-5 text-yellow-400" />
              Zarobione punkty
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={pointsData}>
                  <defs>
                    <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    fill="url(#colorPoints)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Wykres słupkowy - wyświetlenia */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex items-center gap-2 text-base">
              <Eye className="w-5 h-5 text-cyan-400" />
              Obejrzane reklamy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={viewsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="count" 
                    fill="#06b6d4" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Wykres kołowy - źródła zarobków */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex items-center gap-2 text-base">
              <TrendingUp className="w-5 h-5 text-pink-400" />
              Źródła zarobków
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 min-w-32">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-slate-400 text-xs">{entry.name}</span>
                    <span className="text-white text-xs font-medium ml-auto">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Statystyki tygodniowe */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex items-center gap-2 text-base">
              <Calendar className="w-5 h-5 text-emerald-400" />
              Podsumowanie tygodnia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'Punkty zdobyte', value: pointsData.reduce((s, d) => s + d.value, 0), color: 'text-purple-400', bg: 'bg-purple-500/20' },
                { label: 'Reklamy obejrzane', value: viewsData.reduce((s, d) => s + d.count, 0), color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
                { label: 'Średnia dzienna', value: Math.round(pointsData.reduce((s, d) => s + d.value, 0) / 7), color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
              ].map((stat, i) => (
                <div key={i} className={`p-4 rounded-xl ${stat.bg}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">{stat.label}</span>
                    <span className={`text-2xl font-bold ${stat.color}`}>{stat.value.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}