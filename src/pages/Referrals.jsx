import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Users, Coins, Gift, Copy, Check, Share2, Link, Bell,
  Loader2, TrendingUp, UserPlus, Award, Layers, Search,
  ArrowUpDown, Filter, Zap, Hash
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subDays, isAfter } from 'date-fns';

const PERIOD_OPTIONS = [
  { label: 'Ostatnie 7 dni', value: '7' },
  { label: 'Ostatnie 30 dni', value: '30' },
  { label: 'Ostatnie 90 dni', value: '90' },
  { label: 'Wszystkie', value: 'all' },
];

function generatePromoCode(prefix = 'PROMO') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = prefix + '-';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function Referrals() {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [period, setPeriod] = useState('all');
  const [promoCode, setPromoCode] = useState('');

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: referredUsers = [], isLoading } = useQuery({
    queryKey: ['referredUsers', user?.id],
    queryFn: () => base44.entities.User.filter({ referred_by: user?.id }),
    enabled: !!user?.id
  });

  const { data: level2Users = [] } = useQuery({
    queryKey: ['level2Users', user?.id],
    queryFn: () => base44.entities.User.filter({ referred_by_level2: user?.id }),
    enabled: !!user?.id
  });

  const { data: level3Users = [] } = useQuery({
    queryKey: ['level3Users', user?.id],
    queryFn: () => base44.entities.User.filter({ referred_by_level3: user?.id }),
    enabled: !!user?.id
  });

  const { data: referralBonuses = [] } = useQuery({
    queryKey: ['referralBonuses', user?.id],
    queryFn: () => base44.entities.ReferralBonus.filter({ referrer_id: user?.id }, '-created_date', 100),
    enabled: !!user?.id
  });

  const { data: settings = [] } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: () => base44.entities.SiteSettings.list()
  });

  const getSetting = (key, def) => (settings.find(s => s.setting_key === key)?.setting_value ?? def);
  const referralBonusPercent = parseFloat(getSetting('referral_bonus_percent', '10'));
  const referralBonusLevel2 = parseFloat(getSetting('referral_bonus_level2', '5'));
  const referralBonusLevel3 = parseFloat(getSetting('referral_bonus_level3', '2'));

  const referralLink = `${window.location.origin}?ref=${user?.referral_code}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true); toast.success('Link skopiowany!');
    setTimeout(() => setCopied(false), 2000);
  };

  const copyCode = async (code) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code); toast.success('Kod skopiowany!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const savePromoMutation = useMutation({
    mutationFn: () => { let codes = []; try { codes = user?.promo_codes ? JSON.parse(user.promo_codes) : []; } catch {} return base44.auth.updateMe({ promo_codes: JSON.stringify([...codes, promoCode]) }); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['currentUser'] }); setPromoCode(''); toast.success('Kod promocyjny zapisany!'); }
  });

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  // Period filter helper
  const inPeriod = (dateStr) => {
    if (period === 'all') return true;
    return isAfter(new Date(dateStr), subDays(new Date(), parseInt(period)));
  };

  // Bonuses per user map
  const bonusMap = useMemo(() => {
    const map = {};
    referralBonuses.forEach(b => {
      if (!map[b.referred_user_id]) map[b.referred_user_id] = 0;
      map[b.referred_user_id] += b.bonus_amount || 0;
    });
    return map;
  }, [referralBonuses]);

  // Period-filtered bonuses
  const periodBonuses = referralBonuses.filter(b => inPeriod(b.created_date));
  const periodEarnings = periodBonuses.reduce((s, b) => s + (b.bonus_amount || 0), 0);

  const totalEarnings = (user?.referral_earnings || 0) + (user?.referral_earnings_level2 || 0) + (user?.referral_earnings_level3 || 0);
  const activeReferreds = referredUsers.filter(u => (u.points_balance || 0) > 0);

  // Filter + sort a user list
  const filterSort = (list) => {
    let res = list.filter(u =>
      (!search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
    );
    switch (sortBy) {
      case 'name_asc': res = [...res].sort((a, b) => (a.full_name||'').localeCompare(b.full_name||'')); break;
      case 'name_desc': res = [...res].sort((a, b) => (b.full_name||'').localeCompare(a.full_name||'')); break;
      case 'earnings_desc': res = [...res].sort((a, b) => (bonusMap[b.id]||0) - (bonusMap[a.id]||0)); break;
      case 'earnings_asc': res = [...res].sort((a, b) => (bonusMap[a.id]||0) - (bonusMap[b.id]||0)); break;
      case 'date_desc': default: break;
    }
    return res;
  };

  const promoCodes = useMemo(() => {
    try { return user?.promo_codes ? JSON.parse(user.promo_codes) : []; } catch { return []; }
  }, [user?.promo_codes]);

  const renderUserList = (users, level) => {
    const filtered = filterSort(users);
    return (
      <div className="space-y-3">
        {filtered.length > 0 ? filtered.map((refUser) => {
          const earning = bonusMap[refUser.id] || 0;
          return (
            <div key={refUser.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-purple-500/20">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-cyan-500 text-white text-sm">{getInitials(refUser.full_name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white font-medium text-sm">{refUser.full_name || 'Użytkownik'}</p>
                  <p className="text-slate-400 text-xs">{refUser.email}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-yellow-400 font-bold text-sm flex items-center gap-1"><Coins className="w-3.5 h-3.5" />+{earning.toLocaleString()}</p>
                <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-xs">Poz. {level}</Badge>
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-8 text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>{search ? 'Brak wyników' : `Brak poleceń na poziomie ${level}`}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-white">Program poleceń</h1>
          <p className="text-slate-400 mt-1">Wielopoziomowy system nagród za polecenia</p>
        </motion.div>

        {/* Dashboard stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Łączne zarobki', value: totalEarnings.toLocaleString() + ' pkt', icon: Gift, color: 'text-purple-400', bg: 'from-purple-600/20 to-purple-900/20 border-purple-500/30' },
            { label: `Zarobki (${PERIOD_OPTIONS.find(o=>o.value===period)?.label || ''})`, value: periodEarnings.toLocaleString() + ' pkt', icon: TrendingUp, color: 'text-emerald-400', bg: 'from-emerald-600/10 to-emerald-900/10 border-emerald-500/20' },
            { label: 'Poleceni łącznie', value: referredUsers.length + level2Users.length + level3Users.length, icon: Users, color: 'text-cyan-400', bg: 'bg-[#1a1a2e]/50 border-purple-500/20' },
            { label: 'Aktywni poleceni', value: activeReferreds.length, icon: Zap, color: 'text-yellow-400', bg: 'bg-[#1a1a2e]/50 border-purple-500/20' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className={`p-5 rounded-2xl bg-gradient-to-br ${s.bg} border`}>
              <s.icon className={`w-6 h-6 ${s.color} mb-2`} />
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-slate-400 text-xs mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-3 mb-6">
          <Filter className="w-4 h-4 text-slate-400" />
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-44 bg-slate-800 border-purple-500/30 text-white"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-purple-500/30 text-white">
              {PERIOD_OPTIONS.map(o => <SelectItem key={o.value} value={o.value} className="text-white">{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* How it works */}
        <Card className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border-purple-500/20 mb-6">
          <CardContent className="p-5">
            <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2"><Layers className="w-4 h-4 text-purple-400" /> Jak działają poziomy?</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Poziom 1', pct: referralBonusPercent, color: 'emerald', desc: 'od zarobków poleconego' },
                { label: 'Poziom 2', pct: referralBonusLevel2, color: 'cyan', desc: 'od poleconych poleconych' },
                { label: 'Poziom 3', pct: referralBonusLevel3, color: 'pink', desc: 'od 3. poziomu sieci' },
              ].map(({ label, pct, color, desc }) => (
                <div key={label} className={`p-3 rounded-lg bg-${color}-500/10 border border-${color}-500/20`}>
                  <p className={`text-${color}-400 font-bold text-sm`}>{label}</p>
                  <p className="text-white text-xl font-bold">{pct}%</p>
                  <p className="text-slate-400 text-xs">{desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Referral link */}
        <Card className="bg-[#1a1a2e]/50 border-purple-500/20 mb-6">
          <CardHeader><CardTitle className="text-white flex items-center gap-2"><Link className="w-5 h-5 text-purple-400" /> Twój link polecający</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input value={referralLink} readOnly className="bg-slate-800 border-purple-500/30 text-white" />
              <Button onClick={copyLink} className={copied ? 'bg-emerald-600' : 'bg-gradient-to-r from-purple-600 to-cyan-600'}>
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </Button>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-2">
              <span className="text-slate-300 text-sm"><strong className="text-purple-400">Kod:</strong></span>
              <code className="bg-purple-500/20 px-2 py-0.5 rounded text-white text-sm">{user?.referral_code}</code>
            </div>
          </CardContent>
        </Card>

        {/* Promo codes */}
        <Card className="bg-[#1a1a2e]/50 border-purple-500/20 mb-6">
          <CardHeader><CardTitle className="text-white flex items-center gap-2"><Hash className="w-5 h-5 text-amber-400" /> Kody promocyjne</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-400 text-sm">Generuj unikalne kody promocyjne dla nowych użytkowników. Kod kieruje ich do Twojego linku polecającego.</p>
            <div className="flex gap-2">
              <Input value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())}
                className="bg-slate-800 border-purple-500/30 text-white font-mono" placeholder="TWOJ-KOD" />
              <Button variant="outline" className="border-purple-500/30 text-purple-300 bg-transparent whitespace-nowrap"
                onClick={() => setPromoCode(generatePromoCode())}>
                <Zap className="w-4 h-4 mr-1" /> Generuj
              </Button>
              <Button onClick={() => promoCode && savePromoMutation.mutate()} disabled={!promoCode || savePromoMutation.isPending}
                className="bg-amber-600 hover:bg-amber-700 whitespace-nowrap">
                <Check className="w-4 h-4 mr-1" /> Zapisz
              </Button>
            </div>
            {promoCodes.length > 0 && (
              <div className="space-y-2">
                <p className="text-slate-400 text-xs">Twoje kody:</p>
                <div className="flex flex-wrap gap-2">
                  {promoCodes.map((c, i) => (
                    <button key={i} onClick={() => copyCode(c)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-sm hover:bg-amber-500/20 transition-colors">
                      {copiedCode === c ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Referral network */}
        <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2"><UserPlus className="w-5 h-5 text-cyan-400" /> Twoja sieć poleceń</CardTitle>
            {/* Search + sort */}
            <div className="flex gap-2 mt-3 flex-wrap">
              <div className="relative flex-1 min-w-36">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input value={search} onChange={e => setSearch(e.target.value)}
                  className="bg-slate-800 border-purple-500/30 text-white pl-9" placeholder="Szukaj..." />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-44 bg-slate-800 border-purple-500/30 text-white"><ArrowUpDown className="w-3.5 h-3.5 mr-2" /><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-purple-500/30 text-white">
                  <SelectItem value="date_desc" className="text-white">Najnowsi</SelectItem>
                  <SelectItem value="name_asc" className="text-white">Nazwa A-Z</SelectItem>
                  <SelectItem value="name_desc" className="text-white">Nazwa Z-A</SelectItem>
                  <SelectItem value="earnings_desc" className="text-white">Zarobki ↓</SelectItem>
                  <SelectItem value="earnings_asc" className="text-white">Zarobki ↑</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="level1">
              <TabsList className="bg-slate-800 border border-purple-500/20 mb-4 w-full">
                <TabsTrigger value="level1" className="flex-1 data-[state=active]:bg-emerald-500 text-xs">Poziom 1 ({referredUsers.length})</TabsTrigger>
                <TabsTrigger value="level2" className="flex-1 data-[state=active]:bg-cyan-500 text-xs">Poziom 2 ({level2Users.length})</TabsTrigger>
                <TabsTrigger value="level3" className="flex-1 data-[state=active]:bg-pink-500 text-xs">Poziom 3 ({level3Users.length})</TabsTrigger>
                <TabsTrigger value="history" className="flex-1 data-[state=active]:bg-purple-500 text-xs">Historia</TabsTrigger>
              </TabsList>
              <TabsContent value="level1">{renderUserList(referredUsers, 1)}</TabsContent>
              <TabsContent value="level2">{renderUserList(level2Users, 2)}</TabsContent>
              <TabsContent value="level3">{renderUserList(level3Users, 3)}</TabsContent>
              <TabsContent value="history">
                {referralBonuses.filter(b => inPeriod(b.created_date)).length > 0 ? (
                  <div className="space-y-2">
                    {referralBonuses.filter(b => inPeriod(b.created_date)).map(bonus => (
                      <div key={bonus.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                        <div className="flex items-center gap-3">
                          <Bell className="w-4 h-4 text-yellow-400" />
                          <div>
                            <p className="text-white text-sm">Bonus od {bonus.referred_user_email}</p>
                            <p className="text-slate-500 text-xs">{bonus.created_date ? format(new Date(bonus.created_date), 'dd.MM.yyyy') : ''}</p>
                          </div>
                        </div>
                        <span className="text-yellow-400 font-bold">+{bonus.bonus_amount} pkt</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400"><Bell className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>Brak historii w wybranym okresie</p></div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}