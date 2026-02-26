import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { 
  User, Mail, Phone, MapPin, Building2, Globe, CreditCard, 
  Users, LogOut, Camera, Smile, Save, Crown, Coins, Trophy, 
  Gamepad2, Hash, FileText, Bell, History, Image
} from 'lucide-react';
import { toast } from 'sonner';
import AvatarPicker from '@/components/profile/AvatarPicker.jsx';
import AchievementsPanel from '@/components/achievements/AchievementsPanel.jsx';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';

export default function Profile() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [notifForm, setNotifForm] = useState({});

  const { data: user, isLoading } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: pointsHistory = [] } = useQuery({
    queryKey: ['profilePointsHistory', user?.id],
    queryFn: () => base44.entities.PointsHistory.filter({ user_id: user?.id }, '-created_date', 30),
    enabled: !!user?.id
  });

  const { data: gameRooms = [] } = useQuery({
    queryKey: ['profileGameRooms', user?.id],
    queryFn: () => base44.entities.GameRoom.filter({ status: 'finished' }, '-created_date', 30),
    enabled: !!user?.id
  });

  useEffect(() => {
    if (user && !editing) {
      setForm({
        phone: user.phone || '',
        postal_code: user.postal_code || '',
        city: user.city || '',
        country: user.country || '',
        address: user.address || '',
        login: user.login || '',
        website: user.website || '',
        company_name: user.company_name || '',
        company_nip: user.company_nip || '',
        company_address: user.company_address || '',
        company_logo_url: user.company_logo_url || '',
        company_description: user.company_description || '',
      });
      setNotifForm({
        notif_email_games: user.notif_email_games !== false,
        notif_email_referrals: user.notif_email_referrals !== false,
        notif_email_points: user.notif_email_points !== false,
        notif_push_games: user.notif_push_games !== false,
        notif_inapp_all: user.notif_inapp_all !== false,
      });
    }
  }, [user]);

  const saveMutation = useMutation({
    mutationFn: () => base44.auth.updateMe(form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['currentUser'] }); setEditing(false); toast.success('Dane zapisane!'); }
  });

  const saveNotifMutation = useMutation({
    mutationFn: () => base44.auth.updateMe(notifForm),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['currentUser'] }); toast.success('Preferencje powiadomień zapisane!'); }
  });

  const field = (key, label, icon, placeholder, opts = {}) => (
    <div className="space-y-1.5">
      <Label className="text-slate-300 flex items-center gap-1.5">
        {icon && React.createElement(icon, { className: 'w-3.5 h-3.5' })} {label}
      </Label>
      <Input value={form[key] || ''} onChange={e => { setEditing(true); setForm(f => ({ ...f, [key]: e.target.value })); }}
        className="bg-slate-800 border-purple-500/30 text-white" placeholder={placeholder} {...opts} />
    </div>
  );

  const getMembershipBadge = (level) => {
    const badges = { 1: { name: 'Bronze', color: 'bg-amber-600' }, 2: { name: 'Silver', color: 'bg-slate-400' }, 3: { name: 'Gold', color: 'bg-yellow-500' }, 4: { name: 'Platinum', color: 'bg-cyan-400' }, 5: { name: 'Diamond', color: 'bg-purple-500' } };
    return badges[level] || badges[1];
  };
  const badge = getMembershipBadge(user?.membership_level);

  const myGameRooms = gameRooms.filter(r => r.player1_id === user?.id || r.player2_id === user?.id);

  if (isLoading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-white mb-6">Moje dane</h1>

        {/* Header card */}
        <Card className="bg-[#1a1a2e]/50 border-purple-500/20 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-5 flex-wrap">
              <AvatarPicker user={user} onUpdated={() => queryClient.invalidateQueries({ queryKey: ['currentUser'] })} size="lg" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">{user?.full_name}</h2>
                <p className="text-slate-400 text-sm">{user?.email}</p>
                {user?.login && <p className="text-slate-500 text-xs">@{user.login}</p>}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge className={`${badge.color} text-white`}><Crown className="w-3 h-3 mr-1" />{badge.name}</Badge>
                  {user?.is_advertiser && <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Reklamodawca</Badge>}
                  {user?.role === 'admin' && <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Admin</Badge>}
                </div>
              </div>
              <div className="flex flex-col gap-2 text-right text-sm">
                <div className="flex items-center gap-2 text-yellow-400"><Coins className="w-4 h-4" /><span className="font-bold text-white">{(user?.points_balance || 0).toLocaleString()} pkt</span></div>
                <div className="flex items-center gap-2 text-emerald-400"><Trophy className="w-4 h-4" /><span className="text-white">{user?.games_won || 0} wygranych</span></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="data">
          <TabsList className="bg-slate-800/50 border border-purple-500/20 mb-6 flex flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="data" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-xs px-3"><User className="w-3.5 h-3.5 mr-1" /> Dane</TabsTrigger>
            <TabsTrigger value="avatar" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-xs px-3"><Camera className="w-3.5 h-3.5 mr-1" /> Zdjęcie</TabsTrigger>
            <TabsTrigger value="company" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white text-xs px-3"><Building2 className="w-3.5 h-3.5 mr-1" /> Firma</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white text-xs px-3"><History className="w-3.5 h-3.5 mr-1" /> Historia</TabsTrigger>
            <TabsTrigger value="notif" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-xs px-3"><Bell className="w-3.5 h-3.5 mr-1" /> Powiadomienia</TabsTrigger>
            <TabsTrigger value="achievements" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white text-xs px-3"><Trophy className="w-3.5 h-3.5 mr-1" /> Osiągnięcia</TabsTrigger>
            <TabsTrigger value="quick" className="data-[state=active]:bg-slate-600 data-[state=active]:text-white text-xs px-3"><CreditCard className="w-3.5 h-3.5 mr-1" /> Linki</TabsTrigger>
          </TabsList>

          {/* --- DANE OSOBOWE --- */}
          <TabsContent value="data">
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
              <CardHeader><CardTitle className="text-white text-lg flex items-center gap-2"><User className="w-5 h-5 text-purple-400" /> Dane konta</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-400 text-xs">Imię i nazwisko</Label>
                    <div className="mt-1 px-3 py-2 bg-slate-800/60 rounded-md text-white text-sm border border-slate-700">{user?.full_name || '—'}</div>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-xs">Adres email</Label>
                    <div className="mt-1 px-3 py-2 bg-slate-800/60 rounded-md text-white text-sm border border-slate-700 flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400" />{user?.email}</div>
                  </div>
                </div>
                <hr className="border-purple-500/20" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {field('login', 'Login / Nazwa użytkownika', Hash, '@mójlogin')}
                  {field('phone', 'Telefon', Phone, '+48 000 000 000')}
                  {field('address', 'Ulica i numer', MapPin, 'ul. Przykładowa 1')}
                  {field('postal_code', 'Kod pocztowy', MapPin, '00-000')}
                  {field('city', 'Miasto', MapPin, 'Warszawa')}
                  {field('country', 'Kraj', Globe, 'Polska')}
                  {field('website', 'Strona www', Globe, 'https://...')}
                </div>
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !editing} className="w-full bg-gradient-to-r from-purple-600 to-cyan-600">
                  <Save className="w-4 h-4 mr-2" />{saveMutation.isPending ? 'Zapisywanie...' : 'Zapisz dane'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- ZDJĘCIE / EMOJI --- */}
          <TabsContent value="avatar">
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2"><Smile className="w-5 h-5 text-purple-400" /> Zdjęcie profilowe / Emoji</CardTitle>
                <p className="text-slate-400 text-sm">Kliknij w awatar aby zmienić emoji lub wgrać zdjęcie.</p>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-6 py-8">
                <AvatarPicker user={user} onUpdated={() => queryClient.invalidateQueries({ queryKey: ['currentUser'] })} size="xl" />
                <p className="text-slate-500 text-sm text-center">Widoczne w górnym pasku i w grach multiplayer.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- FIRMA / REKLAMODAWCA --- */}
          <TabsContent value="company">
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2"><Building2 className="w-5 h-5 text-cyan-400" /> Profil firmowy</CardTitle>
                {!user?.is_advertiser && <p className="text-slate-500 text-sm">Dane reklamodawcy (dostępne po rejestracji jako reklamodawca).</p>}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {field('company_name', 'Nazwa firmy', Building2, 'Firma Sp. z o.o.')}
                  {field('company_nip', 'NIP', Hash, '000-000-00-00')}
                  <div className="sm:col-span-2">{field('company_address', 'Adres firmy', MapPin, 'ul. Przykładowa 1, 00-000 Warszawa')}</div>
                  <div className="sm:col-span-2">{field('company_logo_url', 'URL logo firmy', Image, 'https://...')}</div>
                </div>
                {form.company_logo_url && (
                  <div className="flex items-center gap-3">
                    <img src={form.company_logo_url} alt="logo" className="h-14 w-14 rounded-lg object-contain bg-slate-800 p-1 border border-slate-700" onError={e => e.target.style.display='none'} />
                    <span className="text-slate-400 text-sm">Podgląd logo</span>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-slate-300 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Krótki opis działalności</Label>
                  <Textarea value={form.company_description || ''} onChange={e => { setEditing(true); setForm(f => ({ ...f, company_description: e.target.value })); }}
                    className="bg-slate-800 border-purple-500/30 text-white" placeholder="Opis firmy, czym się zajmujecie..." rows={3} />
                </div>
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !editing} className="w-full bg-gradient-to-r from-cyan-600 to-purple-600">
                  <Save className="w-4 h-4 mr-2" />{saveMutation.isPending ? 'Zapisywanie...' : 'Zapisz dane firmy'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- HISTORIA TRANSAKCJI --- */}
          <TabsContent value="history">
            <div className="space-y-4">
              <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
                <CardHeader><CardTitle className="text-white text-lg flex items-center gap-2"><Gamepad2 className="w-5 h-5 text-purple-400" /> Historia gier multiplayer</CardTitle></CardHeader>
                <CardContent>
                  {myGameRooms.length === 0 ? (
                    <div className="text-center py-8 text-slate-400"><Gamepad2 className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>Brak zakończonych gier</p></div>
                  ) : (
                    <div className="space-y-2">
                      {myGameRooms.slice(0, 20).map(room => {
                        const won = room.winner_id === user?.id;
                        const isP1 = room.player1_id === user?.id;
                        return (
                          <div key={room.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{room.game_type === 'battleship' ? '⚓' : room.game_type === 'tictactoe' ? '⭕' : '🔴'}</span>
                              <div>
                                <p className="text-white text-sm font-medium capitalize">{room.game_type === 'battleship' ? 'Okręty' : room.game_type === 'tictactoe' ? 'Kółko i Krzyżyk' : 'Cztery w rzędzie'}</p>
                                <p className="text-slate-500 text-xs">vs {isP1 ? room.player2_email : room.player1_email}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={won ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}>{won ? '🏆 Wygrana' : '❌ Przegrana'}</Badge>
                              {room.bet_points > 0 && <p className={`text-xs mt-1 ${won ? 'text-emerald-400' : 'text-red-400'}`}>{won ? '+' : '-'}{room.bet_points} pkt</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
                <CardHeader><CardTitle className="text-white text-lg flex items-center gap-2"><Coins className="w-5 h-5 text-yellow-400" /> Historia punktów</CardTitle></CardHeader>
                <CardContent>
                  {pointsHistory.length === 0 ? (
                    <div className="text-center py-8 text-slate-400"><Coins className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>Brak historii</p></div>
                  ) : (
                    <div className="space-y-2">
                      {pointsHistory.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                          <div>
                            <p className="text-white text-sm">{item.description || item.transaction_type}</p>
                            <p className="text-slate-500 text-xs">{item.created_date ? format(new Date(item.created_date), 'dd.MM.yyyy HH:mm') : ''}</p>
                          </div>
                          <span className={`font-bold ${(item.amount || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {(item.amount || 0) >= 0 ? '+' : ''}{item.amount} pkt
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* --- POWIADOMIENIA --- */}
          <TabsContent value="notif">
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
              <CardHeader><CardTitle className="text-white text-lg flex items-center gap-2"><Bell className="w-5 h-5 text-emerald-400" /> Preferencje powiadomień</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'notif_inapp_all', label: '🔔 Powiadomienia w aplikacji (wszystkie)', desc: 'Wyświetlaj powiadomienia in-app' },
                  { key: 'notif_email_games', label: '🎮 Email — gry multiplayer', desc: 'Powiadom emailem o wynikach gier' },
                  { key: 'notif_email_referrals', label: '👥 Email — polecenia', desc: 'Powiadom emailem o nowych poleceniach' },
                  { key: 'notif_email_points', label: '💰 Email — zdobyte punkty', desc: 'Powiadom emailem o transakcjach punktowych' },
                  { key: 'notif_push_games', label: '📲 Push — gry multiplayer', desc: 'Powiadomienia push o dołączeniu gracza / końcu gry' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-purple-500/20">
                    <div>
                      <p className="text-white text-sm">{label}</p>
                      <p className="text-slate-500 text-xs">{desc}</p>
                    </div>
                    <Switch checked={!!notifForm[key]} onCheckedChange={v => setNotifForm(f => ({ ...f, [key]: v }))} />
                  </div>
                ))}
                <Button onClick={() => saveNotifMutation.mutate()} disabled={saveNotifMutation.isPending} className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600">
                  <Save className="w-4 h-4 mr-2" />{saveNotifMutation.isPending ? 'Zapisywanie...' : 'Zapisz preferencje'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- SZYBKIE LINKI --- */}
          <TabsContent value="quick">
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
              <CardHeader><CardTitle className="text-white text-lg">Szybkie akcje</CardTitle></CardHeader>
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
                  <LogOut className="w-5 h-5" /> Wyloguj się
                </button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}