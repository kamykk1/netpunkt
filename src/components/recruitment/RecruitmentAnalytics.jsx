import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Users, Briefcase, Clock } from 'lucide-react';

const STATUS_LABELS = {
  cv_received: 'CV przesłano',
  screening: 'Screening',
  interview: 'Rozmowa',
  offer_sent: 'Oferta',
  hired: 'Zatrudniony',
  rejected: 'Odrzucony',
};

const SOURCE_LABELS = {
  linkedin: 'LinkedIn', pracuj: 'Pracuj.pl', indeed: 'Indeed',
  referral: 'Polecenie', direct: 'Bezpośrednio', other: 'Inne'
};

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#ef4444'];

export default function RecruitmentAnalytics({ offers, applications }) {
  // Aplikacje na ofertę
  const appsPerOffer = offers.slice(0, 8).map(o => ({
    name: o.title.length > 16 ? o.title.slice(0, 16) + '…' : o.title,
    kandydaci: applications.filter(a => a.job_offer_id === o.id).length
  }));

  // Status pipeline
  const statusData = Object.entries(STATUS_LABELS).map(([k, v]) => ({
    name: v,
    count: applications.filter(a => a.status === k).length
  })).filter(d => d.count > 0);

  // Źródła
  const sourceData = Object.entries(SOURCE_LABELS).map(([k, v]) => ({
    name: v,
    value: applications.filter(a => a.source === k).length
  })).filter(d => d.value > 0);

  const activeOffers = offers.filter(o => o.status === 'open').length;
  const totalApps = applications.length;
  const hiredCount = applications.filter(a => a.status === 'hired').length;
  const conversionRate = totalApps > 0 ? Math.round((hiredCount / totalApps) * 100) : 0;

  const tooltipStyle = { backgroundColor: '#1a1a2e', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8, color: '#fff' };

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Aktywne oferty', value: activeOffers, icon: Briefcase, color: 'text-purple-400' },
          { label: 'Wszystkich kandydatów', value: totalApps, icon: Users, color: 'text-cyan-400' },
          { label: 'Zatrudnionych', value: hiredCount, icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Konwersja', value: `${conversionRate}%`, icon: Clock, color: 'text-amber-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
            <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-slate-500 text-xs">{label}</p>
          </div>
        ))}
      </div>

      {/* Aplikacje na ofertę */}
      {appsPerOffer.length > 0 && (
        <div>
          <p className="text-slate-400 text-xs mb-2 uppercase tracking-wide">Kandydaci wg oferty</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={appsPerOffer} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="kandydaci" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Status pipeline */}
        {statusData.length > 0 && (
          <div>
            <p className="text-slate-400 text-xs mb-2 uppercase tracking-wide">Pipeline rekrutacyjny</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={statusData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} width={80} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#06b6d4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Źródła */}
        {sourceData.length > 0 && (
          <div>
            <p className="text-slate-400 text-xs mb-2 uppercase tracking-wide">Źródła kandydatów</p>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={sourceData} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false}>
                  {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}