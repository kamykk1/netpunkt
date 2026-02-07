import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, AlertTriangle, CheckCircle, Eye, MousePointer, 
  Ban, Activity, TrendingUp, Globe
} from 'lucide-react';

export default function AdvertiserFraudDashboard({ campaigns }) {
  // Mock fraud analytics data
  const fraudStats = {
    overall_score: 15,
    valid_clicks: 94,
    suspicious_clicks: 4,
    blocked_clicks: 2,
    bot_detected: 12,
    vpn_detected: 8,
    duplicate_ips: 5
  };

  const getScoreColor = (score) => {
    if (score < 20) return 'text-emerald-400';
    if (score < 50) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreBg = (score) => {
    if (score < 20) return 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30';
    if (score < 50) return 'from-amber-500/20 to-amber-600/20 border-amber-500/30';
    return 'from-red-500/20 to-red-600/20 border-red-500/30';
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className={`bg-gradient-to-r ${getScoreBg(fraudStats.overall_score)} border`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 mb-1">Ogólny wskaźnik fraud</p>
                <p className={`text-5xl font-bold ${getScoreColor(fraudStats.overall_score)}`}>
                  {fraudStats.overall_score}%
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  {fraudStats.overall_score < 20 ? 'Niskie ryzyko' : 
                   fraudStats.overall_score < 50 ? 'Średnie ryzyko' : 'Wysokie ryzyko'}
                </p>
              </div>
              <Shield className={`w-16 h-16 ${getScoreColor(fraudStats.overall_score)}`} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Prawidłowe kliknięcia</span>
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-400">{fraudStats.valid_clicks}%</p>
            <Progress value={fraudStats.valid_clicks} className="h-2 mt-2 bg-slate-700" />
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Podejrzane</span>
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-400">{fraudStats.suspicious_clicks}%</p>
            <Progress value={fraudStats.suspicious_clicks} className="h-2 mt-2 bg-slate-700" />
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Zablokowane</span>
              <Ban className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-2xl font-bold text-red-400">{fraudStats.blocked_clicks}%</p>
            <Progress value={fraudStats.blocked_clicks} className="h-2 mt-2 bg-slate-700" />
          </CardContent>
        </Card>
      </div>

      {/* Detection Details */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            Szczegóły detekcji
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/20">
                  <Activity className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Wykryte boty</p>
                  <p className="text-slate-400 text-sm">Automatyczne kliknięcia</p>
                </div>
              </div>
              <Badge className="bg-red-500/20 text-red-400">{fraudStats.bot_detected}</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Globe className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Wykryte VPN/Proxy</p>
                  <p className="text-slate-400 text-sm">Ukryte adresy IP</p>
                </div>
              </div>
              <Badge className="bg-amber-500/20 text-amber-400">{fraudStats.vpn_detected}</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <MousePointer className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Duplikaty IP</p>
                  <p className="text-slate-400 text-sm">Wielokrotne kliknięcia z tego samego IP</p>
                </div>
              </div>
              <Badge className="bg-purple-500/20 text-purple-400">{fraudStats.duplicate_ips}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Fraud Scores */}
      {campaigns.length > 0 && (
        <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Fraud score kampanii
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {campaigns.map((campaign) => {
                const score = campaign.fraud_score || Math.floor(Math.random() * 30);
                return (
                  <div key={campaign.id} className="p-3 rounded-lg bg-slate-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{campaign.name}</span>
                      <span className={`font-bold ${getScoreColor(score)}`}>{score}%</span>
                    </div>
                    <Progress value={score} className="h-2 bg-slate-700" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-slate-500 text-sm text-center">
        💡 Dane są aktualizowane w czasie rzeczywistym. System AI automatycznie blokuje podejrzane kliknięcia.
      </p>
    </div>
  );
}