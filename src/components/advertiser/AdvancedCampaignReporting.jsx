import React, { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  TrendingUp, Eye, MousePointer, DollarSign,
  Target, Users, Globe, Calendar, Download, RefreshCw, FileText
} from 'lucide-react';

const COLORS = ['#8b5cf6', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];

const generatePerformanceData = (days = 30, seed = 1) => {
  const data = [];
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const base = seed * 1000;
    data.push({
      date: date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' }),
      impressions: Math.floor(Math.abs(Math.sin(i + seed) * base) + base / 2),
      clicks: Math.floor(Math.abs(Math.sin(i + seed) * 200) + 100),
      conversions: Math.floor(Math.abs(Math.sin(i * 0.5 + seed) * 30) + 10),
      ctr: parseFloat((Math.abs(Math.sin(i + seed)) * 3 + 1).toFixed(2)),
      cpc: parseFloat((Math.abs(Math.sin(i * 0.3 + seed)) * 0.5 + 0.1).toFixed(2)),
      spend: Math.floor(Math.abs(Math.sin(i + seed) * 400) + 100),
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

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-purple-500/30 rounded-lg p-3 shadow-xl">
        <p className="text-white font-medium mb-2">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdvancedCampaignReporting({ campaigns = [] }) {
  const [dateRange, setDateRange] = useState('30d');
  const [activeMetric, setActiveMetric] = useState('impressions');
  const [compareCampaigns, setCompareCampaigns] = useState([]);

  const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
  const performanceData = useMemo(() => generatePerformanceData(days, 1), [days]);

  // For comparison: generate separate data per campaign
  const campaignDataMap = useMemo(() => {
    const map = {};
    campaigns.forEach((c, idx) => {
      map[c.id] = generatePerformanceData(days, idx + 1);
    });
    return map;
  }, [campaigns, days]);

  const totalImpressions = performanceData.reduce((s, d) => s + d.impressions, 0);
  const totalClicks = performanceData.reduce((s, d) => s + d.clicks, 0);
  const totalConversions = performanceData.reduce((s, d) => s + d.conversions, 0);
  const totalSpend = performanceData.reduce((s, d) => s + d.spend, 0);
  const avgCtr = (totalClicks / totalImpressions * 100).toFixed(2);
  const avgCpc = (totalSpend / totalClicks).toFixed(2);

  const metrics = [
    { key: 'impressions', label: 'Wyświetlenia', color: '#8b5cf6' },
    { key: 'clicks', label: 'Kliknięcia', color: '#06b6d4' },
    { key: 'ctr', label: 'CTR %', color: '#ec4899' },
    { key: 'cpc', label: 'CPC zł', color: '#f59e0b' },
    { key: 'conversions', label: 'Konwersje', color: '#10b981' },
    { key: 'spend', label: 'Wydatki zł', color: '#ef4444' },
  ];

  const selectedMetric = metrics.find(m => m.key === activeMetric);

  // Compare chart data - merge all selected campaign data by date
  const compareChartData = useMemo(() => {
    if (compareCampaigns.length === 0) return [];
    const baseData = campaignDataMap[compareCampaigns[0]] || [];
    return baseData.map((point, idx) => {
      const row = { date: point.date };
      compareCampaigns.forEach(cid => {
        const campaign = campaigns.find(c => c.id === cid);
        const data = campaignDataMap[cid] || [];
        row[cid] = data[idx]?.[activeMetric] || 0;
        row[`${cid}_name`] = campaign?.name || cid;
      });
      return row;
    });
  }, [compareCampaigns, campaignDataMap, activeMetric, campaigns]);

  const toggleCompareCampaign = (id) => {
    setCompareCampaigns(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id].slice(0, 4)
    );
  };

  // CSV Export
  const exportCSV = () => {
    const headers = ['Data', 'Wyświetlenia', 'Kliknięcia', 'Konwersje', 'CTR', 'CPC', 'Wydatki'];
    const rows = performanceData.map(d => [
      d.date, d.impressions, d.clicks, d.conversions, d.ctr, d.cpc, d.spend
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `raport-kampanii-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // PDF Export (simple print)
  const exportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Filters & Export */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
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

              <Select value={activeMetric} onValueChange={setActiveMetric}>
                <SelectTrigger className="w-44 bg-slate-800 border-purple-500/30 text-white">
                  <SelectValue placeholder="Metryka" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-purple-500/30">
                  {metrics.map(m => (
                    <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="border-emerald-500/30 text-emerald-400" onClick={exportCSV}>
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" className="border-cyan-500/30 text-cyan-400" onClick={exportPDF}>
                <FileText className="w-4 h-4 mr-2" />
                PDF
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
          { label: 'Wydatki', value: `${totalSpend.toLocaleString()} zł`, icon: DollarSign, color: 'text-red-400', trend: '+10%' },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                  <Badge className={kpi.trend.startsWith('+') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}>
                    {kpi.trend}
                  </Badge>
                </div>
                <p className={`text-xl font-bold ${kpi.color}`}>
                  {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
                </p>
                <p className="text-slate-400 text-xs">{kpi.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Interactive Line Chart */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            {selectedMetric?.label} w czasie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} interval={Math.floor(days / 7)} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey={activeMetric}
                  name={selectedMetric?.label}
                  stroke={selectedMetric?.color || '#8b5cf6'}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Multi-metric Area Chart */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white">Wyświetlenia vs Kliknięcia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="gImpressions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} interval={Math.floor(days / 7)} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="impressions" name="Wyświetlenia" stroke="#8b5cf6" fill="url(#gImpressions)" />
                <Area type="monotone" dataKey="clicks" name="Kliknięcia" stroke="#06b6d4" fill="url(#gClicks)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Comparison */}
      {campaigns.length > 1 && (
        <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white">Porównanie kampanii (wybierz do 4)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Campaign selector */}
            <div className="flex flex-wrap gap-3">
              {campaigns.map((c, idx) => (
                <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={compareCampaigns.includes(c.id)}
                    onCheckedChange={() => toggleCompareCampaign(c.id)}
                  />
                  <span className="text-sm" style={{ color: COLORS[idx % COLORS.length] }}>
                    {c.name}
                  </span>
                </label>
              ))}
            </div>

            {/* Comparison line chart */}
            {compareCampaigns.length > 0 && (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={compareChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} interval={Math.floor(days / 7)} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {compareCampaigns.map((cid, idx) => {
                      const c = campaigns.find(x => x.id === cid);
                      return (
                        <Line
                          key={cid}
                          type="monotone"
                          dataKey={cid}
                          name={c?.name || cid}
                          stroke={COLORS[idx % COLORS.length]}
                          strokeWidth={2}
                          dot={false}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Comparison table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-purple-500/20">
                    <th className="text-left text-slate-400 pb-3">Kampania</th>
                    <th className="text-center text-slate-400 pb-3">Status</th>
                    <th className="text-right text-slate-400 pb-3">Budżet</th>
                    <th className="text-right text-slate-400 pb-3">Wydano</th>
                    <th className="text-right text-slate-400 pb-3">Wyświetlenia</th>
                    <th className="text-right text-slate-400 pb-3">CTR</th>
                    <th className="text-right text-slate-400 pb-3">CPC</th>
                    <th className="text-right text-slate-400 pb-3">Konwersje</th>
                    <th className="text-right text-slate-400 pb-3">ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign, idx) => {
                    const cData = campaignDataMap[campaign.id] || [];
                    const totalCtr = cData.length > 0 
                      ? (cData.reduce((s, d) => s + d.ctr, 0) / cData.length).toFixed(2)
                      : '0';
                    const totalCpc = cData.length > 0 
                      ? (cData.reduce((s, d) => s + d.cpc, 0) / cData.length).toFixed(2)
                      : '0';
                    const totalConv = cData.reduce((s, d) => s + d.conversions, 0);
                    const roi = ((Math.random() - 0.2) * 60 + 20).toFixed(0);
                    const isSelected = compareCampaigns.includes(campaign.id);

                    return (
                      <tr 
                        key={campaign.id} 
                        className={`border-b border-purple-500/10 transition-colors ${isSelected ? 'bg-purple-500/5' : ''}`}
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: COLORS[idx % COLORS.length] }} />
                            <p className="text-white font-medium">{campaign.name}</p>
                          </div>
                          <p className="text-slate-500 text-xs ml-4">{campaign.campaign_type?.toUpperCase()}</p>
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
                        <td className="py-3 text-right text-cyan-400">{totalCtr}%</td>
                        <td className="py-3 text-right text-yellow-400">{totalCpc} zł</td>
                        <td className="py-3 text-right text-purple-400">{totalConv}</td>
                        <td className="py-3 text-right">
                          <span className={parseFloat(roi) >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {parseFloat(roi) >= 0 ? '+' : ''}{roi}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

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
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demographicData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={40} />
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
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deviceData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
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

      {/* Geographic */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            Wydajność geograficzna
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-purple-500/20">
                  <th className="text-left text-slate-400 pb-3">Region</th>
                  <th className="text-right text-slate-400 pb-3">Wyświetlenia</th>
                  <th className="text-right text-slate-400 pb-3">Kliknięcia</th>
                  <th className="text-right text-slate-400 pb-3">CTR</th>
                  <th className="text-right text-slate-400 pb-3">Wydatki</th>
                  <th className="text-right text-slate-400 pb-3">Udział</th>
                </tr>
              </thead>
              <tbody>
                {geoData.map((row, i) => {
                  const total = geoData.reduce((s, g) => s + g.impressions, 0);
                  const share = ((row.impressions / total) * 100).toFixed(1);
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
                            <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-500" style={{ width: `${share}%` }} />
                          </div>
                          <span className="text-slate-400 w-10">{share}%</span>
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
    </div>
  );
}