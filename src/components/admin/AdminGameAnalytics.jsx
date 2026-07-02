import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Gamepad2, Clock, Users, Trophy } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const GAME_LABELS = {
  battleship: 'Okręty',
  tictactoe: 'Kółko i Krzyżyk',
  connect4: 'Cztery w rzędzie',
  quiz: 'Quiz',
  memory: 'Memory',
  minesweeper: 'Saper',
  snake: 'Snake',
  scratch: 'Zdrapka',
  wheel: 'Koło Fortuny',
};

const PIE_COLORS = ['#8b5cf6', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7', '#14b8a6'];

export default function AdminGameAnalytics() {
  const { data: scores = [], isLoading } = useQuery({
    queryKey: ['gameAnalyticsScores'],
    queryFn: () => base44.entities.GameScore.list('-created_date', 500),
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['gameAnalyticsRooms'],
    queryFn: () => base44.entities.GameRoom.list('-created_date', 200),
  });

  const stats = useMemo(() => {
    // Game popularity (by sessions played)
    const popularity = {};
    const durationByGame = {};
    const privateRoomCount = { total: 0, totalTime: 0 };
    let totalSessions = 0;

    scores.forEach(s => {
      let extra = {}; try { extra = s.extra ? JSON.parse(s.extra) : {}; } catch {}
      const game = s.game_type;
      if (!game) return;
      totalSessions++;
      popularity[game] = (popularity[game] || 0) + 1;
      const dur = extra.duration_seconds || 0;
      durationByGame[game] = (durationByGame[game] || 0) + dur;
      if (extra.is_private) {
        privateRoomCount.total++;
        privateRoomCount.totalTime += dur;
      }
    });

    const popularityData = Object.entries(popularity)
      .map(([game, count]) => ({ game: GAME_LABELS[game] || game, count }))
      .sort((a, b) => b.count - a.count);

    const avgDurationData = Object.entries(durationByGame).map(([game, totalDur]) => ({
      game: GAME_LABELS[game] || game,
      avgMinutes: popularity[game] ? Math.round((totalDur / popularity[game]) / 60 * 10) / 10 : 0,
    }));

    const privateAvg = privateRoomCount.total > 0
      ? Math.round((privateRoomCount.totalTime / privateRoomCount.total) / 60 * 10) / 10
      : 0;

    // Room status breakdown
    const roomStatuses = {};
    rooms.forEach(r => {
      roomStatuses[r.status] = (roomStatuses[r.status] || 0) + 1;
    });
    const roomStatusData = Object.entries(roomStatuses).map(([status, count]) => ({ name: status, value: count }));

    return { popularityData, avgDurationData, totalSessions, privateAvg, privateRoomCount, roomStatusData };
  }, [scores, rooms]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Rozegrane sesje</p>
              <p className="text-2xl font-bold text-white">{stats.totalSessions}</p>
            </div>
            <Gamepad2 className="w-8 h-8 text-purple-400" />
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Pokoje prywatne</p>
              <p className="text-2xl font-bold text-white">{stats.privateRoomCount.total}</p>
            </div>
            <Users className="w-8 h-8 text-cyan-400" />
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Śr. czas w pryw. pokoju</p>
              <p className="text-2xl font-bold text-white">{stats.privateAvg}<span className="text-sm text-slate-400"> min</span></p>
            </div>
            <Clock className="w-8 h-8 text-amber-400" />
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Najpopularniejsza</p>
              <p className="text-lg font-bold text-emerald-400">{stats.popularityData[0]?.game || '—'}</p>
            </div>
            <Trophy className="w-8 h-8 text-emerald-400" />
          </CardContent>
        </Card>
      </div>

      {/* Popularity chart */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white">Popularność gier (liczba sesji)</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.popularityData.length === 0 ? (
            <p className="text-slate-400 text-center py-8">Brak danych</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.popularityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="game" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" />
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #8b5cf6', borderRadius: 8 }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} name="Sesje" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Avg duration chart */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white">Średni czas gry (minuty)</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.avgDurationData.length === 0 ? (
            <p className="text-slate-400 text-center py-8">Brak danych</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.avgDurationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="game" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" />
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #06b6d4', borderRadius: 8 }} />
                <Bar dataKey="avgMinutes" fill="#06b6d4" radius={[8, 8, 0, 0]} name="Śr. minuty" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Room status pie */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white">Status pokoi gier</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.roomStatusData.length === 0 ? (
            <p className="text-slate-400 text-center py-8">Brak danych</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={stats.roomStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {stats.roomStatusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #8b5cf6', borderRadius: 8 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}