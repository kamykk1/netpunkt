import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Download, TrendingUp, TrendingDown, Minus, BarChart3, FileText } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, subQuarters, subYears, eachMonthOfInterval } from 'date-fns';
import { pl } from 'date-fns/locale';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a2e] border border-purple-500/30 rounded-lg p-3 text-xs">
      <p className="text-slate-300 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {(p.value / 100).toFixed(2)} zł</p>
      ))}
    </div>
  );
};

export default function BillingReports({ user }) {
  const [period, setPeriod] = useState('monthly');
  const [count, setCount] = useState('6');

  const { data: invoices = [] } = useQuery({
    queryKey: ['advertiserInvoices', user?.id],
    queryFn: () => base44.entities.Invoice.filter({ user_id: user?.id }, '-created_date'),
    enabled: !!user?.id
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['advertiserCampaigns', user?.id],
    queryFn: () => base44.entities.AdvertiserCampaign.filter({ advertiser_id: user?.id }, '-created_date'),
    enabled: !!user?.id
  });

  const periodLabel = { monthly: 'Miesiąc', quarterly: 'Kwartał', yearly: 'Rok' };

  const generatePeriods = () => {
    const n = parseInt(count);
    const now = new Date();
    const periods = [];
    for (let i = n - 1; i >= 0; i--) {
      let start, end, label;
      if (period === 'monthly') {
        start = startOfMonth(subMonths(now, i));
        end = endOfMonth(subMonths(now, i));
        label = format(start, 'MMM yyyy', { locale: pl });
      } else if (period === 'quarterly') {
        start = startOfQuarter(subQuarters(now, i));
        end = endOfQuarter(subQuarters(now, i));
        label = `Q${Math.ceil((start.getMonth() + 1) / 3)} ${start.getFullYear()}`;
      } else {
        start = startOfYear(subYears(now, i));
        end = endOfYear(subYears(now, i));
        label = start.getFullYear().toString();
      }
      periods.push({ start, end, label });
    }
    return periods;
  };

  const periods = generatePeriods();

  const chartData = useMemo(() => {
    return periods.map(({ start, end, label }) => {
      const periodInvoices = invoices.filter(inv => {
        const d = new Date(inv.created_date);
        return d >= start && d <= end;
      });
      const revenue = periodInvoices.filter(i => i.invoice_type !== 'expense').reduce((s, i) => s + (i.total || 0), 0);
      const expenses = campaigns.filter(c => {
        const d = new Date(c.created_date);
        return d >= start && d <= end;
      }).reduce((s, c) => s + (c.budget_spent || 0), 0);
      return { label, revenue, expenses, profit: revenue - expenses };
    });
  }, [invoices, campaigns, period, count]);

  const totals = useMemo(() => chartData.reduce((acc, d) => ({
    revenue: acc.revenue + d.revenue,
    expenses: acc.expenses + d.expenses,
    profit: acc.profit + d.profit,
  }), { revenue: 0, expenses: 0, profit: 0 }), [chartData]);

  const campaignBreakdown = useMemo(() => {
    return campaigns.map(c => ({
      name: c.name,
      type: c.campaign_type?.toUpperCase(),
      budget: c.budget_total || 0,
      spent: c.budget_spent || 0,
      views: c.current_views || 0,
      status: c.status,
    })).sort((a, b) => b.spent - a.spent);
  }, [campaigns]);

  const exportCSV = () => {
    const rows = [
      ['Okres', 'Przychody (zł)', 'Wydatki (zł)', 'Zysk (zł)'],
      ...chartData.map(d => [d.label, (d.revenue / 100).toFixed(2), (d.expenses / 100).toFixed(2), (d.profit / 100).toFixed(2)])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `raport_${period}.csv`; a.click();
  };

  const exportPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Raport Finansowy - Zapunktowani.eu', 14, 20);
    doc.setFontSize(10);
    doc.text(`Wygenerowano: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`, 14, 28);
    doc.text(`Okres: ${periodLabel[period]}, ostatnie ${count}`, 14, 34);

    let y = 45;
    doc.setFontSize(12);
    doc.text('Podsumowanie', 14, y); y += 8;
    doc.setFontSize(9);
    doc.text(`Przychody: ${(totals.revenue / 100).toFixed(2)} zł`, 14, y); y += 6;
    doc.text(`Wydatki: ${(totals.expenses / 100).toFixed(2)} zł`, 14, y); y += 6;
    doc.text(`Zysk: ${(totals.profit / 100).toFixed(2)} zł`, 14, y); y += 12;

    doc.setFontSize(12);
    doc.text('Dane okresowe', 14, y); y += 8;
    doc.setFontSize(9);
    chartData.forEach(d => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(`${d.label}: przychody ${(d.revenue / 100).toFixed(2)} zł, wydatki ${(d.expenses / 100).toFixed(2)} zł, zysk ${(d.profit / 100).toFixed(2)} zł`, 14, y);
      y += 6;
    });

    doc.save(`raport_${period}.pdf`);
  };

  const fmt = (v) => (v / 100).toFixed(2) + ' zł';
  const statusColors = {
    draft: 'bg-slate-500/20 text-slate-400', active: 'bg-emerald-500/20 text-emerald-400',
    paused: 'bg-amber-500/20 text-amber-400', completed: 'bg-blue-500/20 text-blue-400',
    pending_review: 'bg-purple-500/20 text-purple-400', rejected: 'bg-red-500/20 text-red-400'
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40 bg-slate-800 border-purple-500/30 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a2e] border-purple-500/30">
            <SelectItem value="monthly">Miesięcznie</SelectItem>
            <SelectItem value="quarterly">Kwartalnie</SelectItem>
            <SelectItem value="yearly">Rocznie</SelectItem>
          </SelectContent>
        </Select>
        <Select value={count} onValueChange={setCount}>
          <SelectTrigger className="w-36 bg-slate-800 border-purple-500/30 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a2e] border-purple-500/30">
            {period === 'monthly' && <><SelectItem value="3">3 miesiące</SelectItem><SelectItem value="6">6 miesięcy</SelectItem><SelectItem value="12">12 miesięcy</SelectItem></>}
            {period === 'quarterly' && <><SelectItem value="4">4 kwartały</SelectItem><SelectItem value="8">8 kwartałów</SelectItem></>}
            {period === 'yearly' && <><SelectItem value="3">3 lata</SelectItem><SelectItem value="5">5 lat</SelectItem></>}
          </SelectContent>
        </Select>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} className="border-purple-500/30 text-white bg-transparent">
            <Download className="w-4 h-4 mr-1" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF} className="border-cyan-500/30 text-cyan-400 bg-transparent">
            <FileText className="w-4 h-4 mr-1" /> PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Przychody', value: totals.revenue, color: 'text-emerald-400', icon: TrendingUp, bg: 'from-emerald-500/10 to-emerald-500/5' },
          { label: 'Wydatki', value: totals.expenses, color: 'text-red-400', icon: TrendingDown, bg: 'from-red-500/10 to-red-500/5' },
          { label: 'Zysk netto', value: totals.profit, color: totals.profit >= 0 ? 'text-cyan-400' : 'text-red-400', icon: Minus, bg: 'from-cyan-500/10 to-cyan-500/5' },
        ].map((kpi, i) => (
          <Card key={i} className={`bg-gradient-to-br ${kpi.bg} border-purple-500/20`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-slate-400 text-sm">{kpi.label}</p>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <p className={`text-2xl font-bold ${kpi.color}`}>{fmt(kpi.value)}</p>
              <p className="text-slate-500 text-xs mt-1">Łącznie za wybrany okres</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" /> Wykres przychodów i wydatków
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tickFormatter={v => (v / 100).toFixed(0) + ' zł'} tick={{ fill: '#94a3b8', fontSize: 11 }} width={70} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
              <Bar dataKey="revenue" name="Przychody" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Wydatki" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="Zysk" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Period Table */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white text-base">Tabela danych okresowych</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-purple-500/20">
                <TableHead className="text-slate-400">Okres</TableHead>
                <TableHead className="text-slate-400">Przychody</TableHead>
                <TableHead className="text-slate-400">Wydatki</TableHead>
                <TableHead className="text-slate-400">Zysk</TableHead>
                <TableHead className="text-slate-400">Marża</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chartData.map((d, i) => {
                const margin = d.revenue > 0 ? ((d.profit / d.revenue) * 100).toFixed(1) : '—';
                return (
                  <TableRow key={i} className="border-purple-500/20">
                    <TableCell className="text-white font-medium">{d.label}</TableCell>
                    <TableCell className="text-emerald-400">{fmt(d.revenue)}</TableCell>
                    <TableCell className="text-red-400">{fmt(d.expenses)}</TableCell>
                    <TableCell className={d.profit >= 0 ? 'text-cyan-400' : 'text-red-400'}>{fmt(d.profit)}</TableCell>
                    <TableCell className="text-slate-300">{margin !== '—' ? `${margin}%` : '—'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Campaign Breakdown */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white text-base">Podział wydatków wg kampanii</CardTitle>
        </CardHeader>
        <CardContent>
          {campaignBreakdown.length === 0 ? (
            <p className="text-slate-400 text-center py-4">Brak kampanii</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-purple-500/20">
                  <TableHead className="text-slate-400">Kampania</TableHead>
                  <TableHead className="text-slate-400">Typ</TableHead>
                  <TableHead className="text-slate-400">Budżet</TableHead>
                  <TableHead className="text-slate-400">Wydano</TableHead>
                  <TableHead className="text-slate-400">Wyświetlenia</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaignBreakdown.map((c, i) => (
                  <TableRow key={i} className="border-purple-500/20">
                    <TableCell className="text-white font-medium">{c.name}</TableCell>
                    <TableCell><Badge variant="outline" className="border-purple-500/30 text-purple-400 text-xs">{c.type}</Badge></TableCell>
                    <TableCell className="text-slate-300">{fmt(c.budget)}</TableCell>
                    <TableCell className="text-red-400">{fmt(c.spent)}</TableCell>
                    <TableCell className="text-slate-300">{c.views.toLocaleString()}</TableCell>
                    <TableCell><Badge className={statusColors[c.status] || 'bg-slate-500/20 text-slate-400'}>{c.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}