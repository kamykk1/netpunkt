import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Eye, MousePointer, DollarSign,
  Target, Users, Globe, Calendar, Download, RefreshCw
} from 'lucide-react';

const COLORS = ['#8b5cf6', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];

// Mock data - w produkcji pobierane z API
const generatePerformanceData = (days = 30) => {
  const data = [];
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' }),
      impressions: Math.floor(Math.random() * 10000) + 5000,
      clicks: Math.floor(Math.random() * 500) + 100,
      conversions: Math.floor(Math.random() * 50) + 10,
      ctr: (Math.random() * 3 + 1).toFixed(2),
      cpc: (Math.random() * 0.5 + 0.1).toFixed(2),
      spend: Math.floor(Math.random() * 500) + 100,
    });
  }
  return data;
};

const demographicData = [
  { name: '18-24', male: 25, female: 30 },
  { name: '25-34', male: 35, female: 40 },
  { name: '35-44', male: 20, female: 25 },
  { name: '45-54', male: 12, female: 15 },
  { name: '55+', male: 8, female: 10 },
];

const deviceData = [
  { name: 'Mobile', value: 65 },
  { name: 'Desktop', value: 28 },
  { name: 'Tablet', value: 7 },
];

const geoData = [
  { region: 'Mazowieckie', impressions: 45000, clicks: 2250, ctr: 5.0, spend: 450 },
  { region: 'Małopolskie', impressions: 28000, clicks: 1120, ctr: 4.0, spend: 280 },
  { region: 'Śląskie', impressions: 25000, clicks: 1000, ctr: 4.0, spend: 250 },
  { region: 'Wielkopolskie', impressions: 22000, clicks: 880, ctr: 4.0, spend: 220 },
  { region: 'Dolnośląskie', impressions: 18000, clicks: 720, ctr: 4.0, spend: 180 },
  { region: 'Pomorskie', impressions: 15000, clicks: 600, ctr: 4.0, spend: 150 },
];

export default function AdvancedCampaignReporting({ campaigns = [] }) {
  const [dateRange, setDateRange] = useState('30d');
  const [selectedCampaign, setSelectedCampaign] = useState('all');
  
  const performanceData = generatePerformanceData(dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90);
  
  const totalImpressions = performanceData.reduce((s, d) => s + d.impressions, 0);
  const totalClicks = performanceData.reduce((s, d) => s + d.clicks, 0);
  const totalConversions = performanceData.reduce((s, d) => s + d.conversions, 0);
  const totalSpend = performanceData.reduce((s, d) => s + d.spend, 0);
  const avgCtr = (totalClicks / totalImpressions * 100).toFixed(2);
  const avgCpc = (totalSpend / totalClicks).toFixed(2);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-purple-500/30 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium mb-2">{label}</p>
          {payload.map((entry, i) => (
            <p key={i} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-36 bg-slate-800 border-purple-500/30 text-white">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-purple-500/30">
                  <SelectItem value="7d">7 dni</SelectItem>
                  <SelectItem value="30d">30 dni</SelectItem>
                  <SelectItem value="90d">90 dni</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger className="w-48 bg-slate-800 border-purple-500/30 text-white">
                  <SelectValue placeholder="Kampania" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-purple-500/30">
                  <SelectItem value="all">Wszystkie kampanie</SelectItem>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" className="border-purple-500/30 text-purple-400">
                <RefreshCw className="w-4 h-4 mr-2" />
                Odśwież
              </Button>
              <Button variant="outline" className="border-cyan-500/30 text-cyan-400">
                <Download className="w-4 h-4 mr-2" />
                Eksport PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Wyświetlenia', value: totalImpressions, icon: Eye, color: 'text-cyan-400', trend: '+12%' },
          { label: 'Kliknięcia', value: totalClicks, icon: MousePointer, color: 'text-pink-400', trend: '+8%' },
          { label: 'Konwersje', value: totalConversions, icon: Target, color: 'text-emerald-400', trend: '+15%' },
          { label: 'CTR', value: `${avgCtr}%`, icon: TrendingUp, color: 'text-purple-400', trend: '+0.3%' },
          { label: 'CPC', value: `${avgCpc} zł`, icon: DollarSign, color: 'text-yellow-400', trend: '-5%' },
          { label: 'Wydatki', value: `${totalSpend} zł`, icon: DollarSign, color: 'text-red-400', trend: '+10%' },
        ].map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                  <Badge className={kpi.trend.startsWith('+') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}>
                    {kpi.trend}
                  </Badge>
                </div>
                <p className={`text-2xl font-bold ${kpi.color}`}>
                  {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
                </p>
                <p className="text-slate-400 text-xs">{kpi.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Performance Chart */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            Wydajność w czasie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="impressions" name="Wyświetlenia" stroke="#8b5cf6" fill="url(#colorImpressions)" />
                <Area type="monotone" dataKey="clicks" name="Kliknięcia" stroke="#06b6d4" fill="url(#colorClicks)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demographics */}
        <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-pink-400" />
              Demografia odbiorców
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demographicData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="male" name="Mężczyźni" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="female" name="Kobiety" fill="#ec4899" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Devices */}
        <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white">Urządzenia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {deviceData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Geographic Performance */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            Wydajność geograficzna
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-purple-500/20">
                  <th className="text-left text-slate-400 pb-3 font-medium">Region</th>
                  <th className="text-right text-slate-400 pb-3 font-medium">Wyświetlenia</th>
                  <th className="text-right text-slate-400 pb-3 font-medium">Kliknięcia</th>
                  <th className="text-right text-slate-400 pb-3 font-medium">CTR</th>
                  <th className="text-right text-slate-400 pb-3 font-medium">Wydatki</th>
                  <th className="text-right text-slate-400 pb-3 font-medium">Udział</th>
                </tr>
              </thead>
              <tbody>
                {geoData.map((row, i) => {
                  const totalGeoImpressions = geoData.reduce((s, g) => s + g.impressions, 0);
                  const share = ((row.impressions / totalGeoImpressions) * 100).toFixed(1);
                  
                  return (
                    <tr key={i} className="border-b border-purple-500/10">
                      <td className="py-3 text-white font-medium">{row.region}</td>
                      <td className="py-3 text-right text-slate-300">{row.impressions.toLocaleString()}</td>
                      <td className="py-3 text-right text-slate-300">{row.clicks.toLocaleString()}</td>
                      <td className="py-3 text-right text-cyan-400">{row.ctr}%</td>
                      <td className="py-3 text-right text-emerald-400">{row.spend} zł</td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-cyan-500"
                              style={{ width: `${share}%` }}
                            />
                          </div>
                          <span className="text-slate-400 text-sm w-12">{share}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Comparison */}
      {campaigns.length > 1 && (
        <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white">Porównanie kampanii</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-purple-500/20">
                    <th className="text-left text-slate-400 pb-3 font-medium">Kampania</th>
                    <th className="text-center text-slate-400 pb-3 font-medium">Status</th>
                    <th className="text-right text-slate-400 pb-3 font-medium">Budżet</th>
                    <th className="text-right text-slate-400 pb-3 font-medium">Wydano</th>
                    <th className="text-right text-slate-400 pb-3 font-medium">Wyświetlenia</th>
                    <th className="text-right text-slate-400 pb-3 font-medium">CTR</th>
                    <th className="text-right text-slate-400 pb-3 font-medium">ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.slice(0, 5).map((campaign) => (
                    <tr key={campaign.id} className="border-b border-purple-500/10">
                      <td className="py-3">
                        <p className="text-white font-medium">{campaign.name}</p>
                        <p className="text-slate-500 text-xs">{campaign.campaign_type?.toUpperCase()}</p>
                      </td>
                      <td className="py-3 text-center">
                        <Badge className={
                          campaign.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                          campaign.status === 'paused' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-slate-500/20 text-slate-400'
                        }>
                          {campaign.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-right text-white">{((campaign.budget_total || 0) / 100).toFixed(0)} zł</td>
                      <td className="py-3 text-right text-emerald-400">{((campaign.budget_spent || 0) / 100).toFixed(0)} zł</td>
                      <td className="py-3 text-right text-slate-300">{(campaign.current_views || 0).toLocaleString()}</td>
                      <td className="py-3 text-right text-cyan-400">{(Math.random() * 3 + 1).toFixed(1)}%</td>
                      <td className="py-3 text-right">
                        <span className={Math.random() > 0.3 ? 'text-emerald-400' : 'text-red-400'}>
                          {Math.random() > 0.3 ? '+' : '-'}{(Math.random() * 50 + 10).toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}