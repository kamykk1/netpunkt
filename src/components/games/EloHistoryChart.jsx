import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#1a1a2e] border border-purple-500/30 rounded-lg p-3 text-xs">
      <p className="text-white font-bold">{d.elo} ELO</p>
      <p className={d.change >= 0 ? 'text-emerald-400' : 'text-red-400'}>{d.change >= 0 ? '+' : ''}{d.change}</p>
      <p className="text-slate-400">{d.opponent}</p>
      <p className="text-slate-500">{d.date}</p>
    </div>
  );
};

export default function EloHistoryChart({ userId, compact = false }) {
  const { data: history = [] } = useQuery({
    queryKey: ['eloHistory', userId],
    queryFn: () => base44.entities.EloHistory.filter({ user_id: userId }, 'created_date', 50),
    enabled: !!userId,
  });

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <p className="text-3xl mb-2">📈</p>
        <p className="text-sm">Brak historii ELO. Zagraj gry rankingowe!</p>
      </div>
    );
  }

  const chartData = history.map((h, i) => ({
    idx: i + 1,
    elo: h.elo_after,
    change: h.elo_change,
    result: h.result,
    opponent: h.opponent_name || 'Przeciwnik',
    date: h.created_date ? format(new Date(h.created_date), 'dd.MM HH:mm') : '',
  }));

  const current = history[history.length - 1]?.elo_after || 1000;
  const first = history[0]?.elo_before || 1000;
  const totalChange = current - first;
  const wins = history.filter(h => h.result === 'win').length;
  const losses = history.filter(h => h.result === 'loss').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-white">{current}</span>
          <span className="text-slate-400 text-sm">ELO</span>
          <Badge className={totalChange >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}>
            {totalChange >= 0 ? <TrendingUp className="w-3 h-3 mr-1 inline" /> : <TrendingDown className="w-3 h-3 mr-1 inline" />}
            {totalChange >= 0 ? '+' : ''}{totalChange}
          </Badge>
        </div>
        <div className="flex gap-3 text-xs">
          <span className="text-emerald-400">✓ {wins}W</span>
          <span className="text-red-400">✗ {losses}L</span>
          <span className="text-yellow-400">≈ {history.length - wins - losses}D</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={compact ? 120 : 200}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <XAxis dataKey="idx" tick={{ fill: '#64748b', fontSize: 10 }} />
          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} domain={['auto', 'auto']} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={1000} stroke="#64748b" strokeDasharray="4 4" />
          <Line
            type="monotone"
            dataKey="elo"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={(props) => {
              const { cx, cy, payload } = props;
              const color = payload.result === 'win' ? '#10b981' : payload.result === 'loss' ? '#ef4444' : '#f59e0b';
              return <circle key={`dot-${props.index}`} cx={cx} cy={cy} r={4} fill={color} stroke="#0a0a0f" strokeWidth={2} />;
            }}
          />
        </LineChart>
      </ResponsiveContainer>

      {!compact && (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {[...history].reverse().map((h, i) => (
            <div key={h.id || i} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 text-xs">
              <div className="flex items-center gap-2">
                <span>{h.result === 'win' ? '✅' : h.result === 'loss' ? '❌' : '🤝'}</span>
                <span className="text-slate-300">{h.opponent_name || 'Gracz'}</span>
                <span className="text-slate-500">{h.game_type ? `• ${h.game_type}` : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={h.elo_change >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                  {h.elo_change >= 0 ? '+' : ''}{h.elo_change}
                </span>
                <span className="text-slate-400">{h.elo_after} ELO</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}