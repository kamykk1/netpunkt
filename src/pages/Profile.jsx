import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, Mail, Phone, MapPin, Building2, Globe, CreditCard, 
  Users, LogOut, Camera, Smile, Save, Crown, Coins, Trophy, Gamepad2
} from 'lucide-react';
import { toast } from 'sonner';
import AvatarPicker from '@/components/profile/AvatarPicker.jsx';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Profile() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(false);

  React.useEffect(() => {
    if (user && !editing) {
      setForm({
        phone: user.phone || '',
        city: user.city || '',
        country: user.country || '',
        company_name: user.company_name || '',
        company_nip: user.company_nip || '',
        company_address: user.company_address || '',
        website: user.website || '',
      });
    }
  }, [user]);

  const saveMutation = useMutation({
    mutationFn: () => base44.auth.updateMe(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setEditing(false);
      toast.success('Dane zapisane!');
    }
  });

  const getMembershipBadge = (level) => {
    const badges = {
      1: { name: 'Bronze', color: 'bg-amber-600' },
      2: { name: 'Silver', color: 'bg-slate-400' },
      3: { name: 'Gold', color: 'bg-yellow-500' },
      4: { name: 'Platinum', color: 'bg-cyan-400' },
      5: { name: 'Diamond', color: 'bg-purple-500' },
    };
    return badges[level] || badges[1];
  };

  const badge = getMembershipBadge(user?.membership_level);

  if (isLoading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-white mb-6">Moje dane</h1>

        {/* Profile header */}
        <Card className="bg-[#1a1a2e]/50 border-purple-500/20 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-5 flex-wrap">
              <AvatarPicker user={user} onUpdated={() => queryClient.invalidateQueries({ queryKey: ['currentUser'] })} size="lg" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">{user?.full_name}</h2>
                <p className="text-slate-400">{user?.email}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge className={`${badge.color} text-white`}><Crown className="w-3 h-3 mr-1" />{badge.name}</Badge>
                  {user?.is_advertiser && <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Reklamodawca</Badge>}
                  {user?.role === 'admin' && <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Admin</Badge>}
                </div>
              </div>
              <div className="flex flex-col gap-2 text-right">
                <div className="flex items-center gap-2 text-yellow-400">
                  <Coins className="w-4 h-4" />
                  <span className="font-bold text-white">{(user?.points_balance || 0).toLocaleString()} pkt</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <Trophy className="w-4 h-4" />
                  <span className="text-white text-sm">{user?.games_won || 0} wygranych gier</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="data">
          <TabsList className="bg-slate-800/50 border border-purple-500/20 mb-6 w-full">
            <TabsTrigger value="data" className="flex-1 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <User className="w-4 h-4 mr-2" /> Dane osobowe
            </TabsTrigger>
            <TabsTrigger value="avatar" className="flex-1 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Camera className="w-4 h-4 mr-2" /> Zdjęcie / Emoji
            </TabsTrigger>
            <TabsTrigger value="quick" className="flex-1 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <CreditCard className="w-4 h-4 mr-2" /> Szybkie linki
            </TabsTrigger>
          </TabsList>

          {/* Personal data */}
          <TabsContent value="data">
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-400" /> Dane konta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Read-only */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-400 text-xs">Imię i nazwisko</Label>
                    <div className="mt-1 px-3 py-2 bg-slate-800/60 rounded-md text-white text-sm border border-slate-700">{user?.full_name || '—'}</div>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-xs">Adres email</Label>
                    <div className="mt-1 px-3 py-2 bg-slate-800/60 rounded-md text-white text-sm border border-slate-700 flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />{user?.email}
                    </div>
                  </div>
                </div>

                <hr className="border-purple-500/20" />

                {/* Editable fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Telefon</Label>
                    <Input value={form.phone || ''} onChange={e => { setEditing(true); setForm(f => ({ ...f, phone: e.target.value })); }}
                      className="bg-slate-800 border-purple-500/30 text-white" placeholder="+48 000 000 000" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Miasto</Label>
                    <Input value={form.city || ''} onChange={e => { setEditing(true); setForm(f => ({ ...f, city: e.target.value })); }}
                      className="bg-slate-800 border-purple-500/30 text-white" placeholder="Warszawa" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Kraj</Label>
                    <Input value={form.country || ''} onChange={e => { setEditing(true); setForm(f => ({ ...f, country: e.target.value })); }}
                      className="bg-slate-800 border-purple-500/30 text-white" placeholder="Polska" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Strona www</Label>
                    <Input value={form.website || ''} onChange={e => { setEditing(true); setForm(f => ({ ...f, website: e.target.value })); }}
                      className="bg-slate-800 border-purple-500/30 text-white" placeholder="https://..." />
                  </div>
                </div>

                {user?.is_advertiser && (
                  <>
                    <hr className="border-purple-500/20" />
                    <p className="text-cyan-400 text-sm font-medium flex items-center gap-2"><Building2 className="w-4 h-4" /> Dane reklamodawcy / firmy</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-slate-300">Nazwa firmy</Label>
                        <Input value={form.company_name || ''} onChange={e => { setEditing(true); setForm(f => ({ ...f, company_name: e.target.value })); }}
                          className="bg-slate-800 border-purple-500/30 text-white" placeholder="Firma Sp. z o.o." />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-slate-300">NIP</Label>
                        <Input value={form.company_nip || ''} onChange={e => { setEditing(true); setForm(f => ({ ...f, company_nip: e.target.value })); }}
                          className="bg-slate-800 border-purple-500/30 text-white" placeholder="000-000-00-00" />
                      </div>
                      <div className="sm:col-span-2 space-y-1.5">
                        <Label className="text-slate-300">Adres firmy</Label>
                        <Input value={form.company_address || ''} onChange={e => { setEditing(true); setForm(f => ({ ...f, company_address: e.target.value })); }}
                          className="bg-slate-800 border-purple-500/30 text-white" placeholder="ul. Przykładowa 1, 00-000 Warszawa" />
                      </div>
                    </div>
                  </>
                )}

                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !editing}
                  className="w-full bg-gradient-to-r from-purple-600 to-cyan-600">
                  <Save className="w-4 h-4 mr-2" />
                  {saveMutation.isPending ? 'Zapisywanie...' : 'Zapisz dane'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Avatar tab */}
          <TabsContent value="avatar">
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Smile className="w-5 h-5 text-purple-400" /> Zdjęcie profilowe / Emoji
                </CardTitle>
                <p className="text-slate-400 text-sm">Kliknij w awatar poniżej aby zmienić emoji lub wgrać zdjęcie.</p>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-6 py-8">
                <AvatarPicker user={user} onUpdated={() => queryClient.invalidateQueries({ queryKey: ['currentUser'] })} size="xl" />
                <p className="text-slate-500 text-sm text-center">Twoje zdjęcie/emoji jest widoczne w górnym pasku i przy grach multiplayer.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quick links */}
          <TabsContent value="quick">
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">Szybkie akcje</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Wypłaty i płatności', icon: CreditCard, page: 'Payments', color: 'text-emerald-400' },
                  { label: 'Program poleceń', icon: Users, page: 'Referrals', color: 'text-cyan-400' },
                  { label: 'Historia punktów', icon: Coins, page: 'PointsHistory', color: 'text-yellow-400' },
                  { label: 'Gry', icon: Gamepad2, page: 'Games', color: 'text-purple-400' },
                ].map(item => (
                  <Link key={item.page} to={createPageUrl(item.page)}>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-purple-500/10 hover:border-purple-500/40 transition-colors cursor-pointer">
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                      <span className="text-white">{item.label}</span>
                    </div>
                  </Link>
                ))}
                <hr className="border-purple-500/20" />
                <button onClick={() => base44.auth.logout()} className="w-full flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 hover:border-red-500/40 transition-colors text-red-400">
                  <LogOut className="w-5 h-5" />
                  Wyloguj się
                </button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}