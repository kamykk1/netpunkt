import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Ship, Grid3X3, Circle, Plus, Users, Trophy, Coins, 
  Loader2, Play, Clock, X, Flag, Lock, Copy, Brain, LayoutGrid,
  Bomb, Worm, Ticket, Gift
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserAvatar from '@/components/profile/UserAvatar.jsx';
import { sendNotification } from '@/components/notifications/notificationHelpers.jsx';
import GameChat from '@/components/games/GameChat.jsx';
import ReportModal from '@/components/games/ReportModal.jsx';
import BattleshipGame from '@/components/games/BattleshipGame.jsx';
import TicTacToeGame from '@/components/games/TicTacToeGame.jsx';
import Connect4Game from '@/components/games/Connect4Game.jsx';
import GameRankings from '@/components/games/GameRankings.jsx';
import GameAchievements from '@/components/games/GameAchievements.jsx';
import QuizGame from '@/components/games/QuizGame.jsx';
import MemoryGame from '@/components/games/MemoryGame.jsx';
import MinesweeperGame from '@/components/games/MinesweeperGame.jsx';
import SnakeGame from '@/components/games/SnakeGame.jsx';
import ScratchCard from '@/components/games/ScratchCard.jsx';
import FortuneWheel from '@/components/games/FortuneWheel.jsx';
import PreGameBanner from '@/components/games/PreGameBanner.jsx';

const MULTIPLAYER_TYPES = {
  battleship: { name: 'Okręty', icon: Ship, color: 'from-blue-600 to-cyan-600', desc: 'Zatop flotę przeciwnika' },
  tictactoe: { name: 'Kółko i Krzyżyk', icon: Grid3X3, color: 'from-purple-600 to-pink-600', desc: 'Klasyczna gra strategiczna' },
  connect4: { name: 'Cztery w rzędzie', icon: Circle, color: 'from-red-600 to-yellow-500', desc: 'Ustaw 4 w linii zanim zrobi to rywal' },
};

const SOLO_GAMES = [
  { key: 'quiz', name: 'Quiz', icon: '🧠', color: 'from-violet-600 to-purple-700', desc: '5 pytań • 10 pkt/odpowiedź', setting: 'quiz_enabled' },
  { key: 'memory', name: 'Memory', icon: '🃏', color: 'from-cyan-600 to-blue-700', desc: '8 par kart • 25 pkt za ukończenie', setting: 'memory_enabled' },
  { key: 'minesweeper', name: 'Saper', icon: '💣', color: 'from-red-600 to-orange-700', desc: '9x9 • 10 min • 40 pkt za win', setting: 'minesweeper_enabled' },
  { key: 'snake', name: 'Snake', icon: '🐍', color: 'from-emerald-600 to-green-700', desc: 'Klasyczny snake • wynik/5 pkt', setting: 'snake_enabled' },
  { key: 'scratch', name: 'Zdrapka', icon: '🎰', color: 'from-amber-600 to-yellow-700', desc: '3 takie same = nagroda!', setting: 'scratch_enabled' },
  { key: 'wheel', name: 'Koło fortuny', icon: '🎡', color: 'from-pink-600 to-red-700', desc: 'Raz dziennie kręć kołem!', setting: 'wheel_enabled' },
];

export default function Games() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newGame, setNewGame] = useState({ game_type: 'tictactoe', bet_points: 0, is_private: false });
  const [activeRoom, setActiveRoom] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [soloGame, setSoloGame] = useState(null); // key of solo game
  const [pendingGame, setPendingGame] = useState(null); // waiting to show ad
  const [settings, setSettings] = useState({});

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['gameRooms'],
    queryFn: () => base44.entities.GameRoom.filter({ status: 'waiting' }, '-created_date', 20),
    refetchInterval: 5000
  });

  const { data: siteSettings = [] } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: () => base44.entities.SiteSettings.list()
  });

  useEffect(() => {
    const obj = {};
    siteSettings.forEach(s => { obj[s.setting_key] = s.setting_value; });
    setSettings(obj);
  }, [siteSettings]);

  const getSetting = (key, fallback = 'true') => (settings[key] ?? fallback) !== 'false';

  // Auto-join from invite link
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const joinId = params.get('join_room');
    if (!joinId) return;
    base44.entities.GameRoom.filter({ id: joinId }).then(async (res) => {
      const room = res[0];
      if (!room || room.status !== 'waiting' || room.player1_id === user.id) return;
      joinMutation.mutate(room);
    });
  }, [user]);

  // Subscribe to room updates
  useEffect(() => {
    if (!activeRoom?.id) return;
    const unsub = base44.entities.GameRoom.subscribe(async (ev) => {
      if (ev.id !== activeRoom.id) return;
      if (ev.type === 'update') {
        setActiveRoom(ev.data);
        if (ev.data.player2_id && !opponent) {
          const users = await base44.entities.User.filter({ id: ev.data.player2_id });
          setOpponent(users[0] || null);
        }
      }
    });
    return unsub;
  }, [activeRoom?.id]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (newGame.bet_points > 0 && (user.points_balance || 0) < newGame.bet_points) throw new Error('Niewystarczające punkty');
      return base44.entities.GameRoom.create({ ...newGame, player1_id: user.id, player1_email: user.email, status: 'waiting', chat_enabled: true });
    },
    onSuccess: (room) => { setActiveRoom(room); setShowCreate(false); queryClient.invalidateQueries({ queryKey: ['gameRooms'] }); toast.success('Pokój utworzony!'); },
    onError: (e) => toast.error(e.message)
  });

  const joinMutation = useMutation({
    mutationFn: async (room) => {
      if (room.bet_points > 0 && (user.points_balance || 0) < room.bet_points) throw new Error('Niewystarczające punkty');
      const updated = await base44.entities.GameRoom.update(room.id, {
        player2_id: user.id, player2_email: user.email, status: 'active', current_turn: room.player1_id, game_state: JSON.stringify({})
      });
      const p1users = await base44.entities.User.filter({ id: room.player1_id });
      const p1 = p1users[0] || null;
      setOpponent(p1);
      if (p1) await sendNotification({ userId: p1.id, userEmail: p1.email, type: 'status_update', title: 'Gracz dołączył!', message: `${user.full_name || user.email} dołączył do Twojej gry.`, referenceId: room.id, referenceType: 'other' });
      return updated;
    },
    onSuccess: (room) => { setActiveRoom(room); queryClient.invalidateQueries({ queryKey: ['gameRooms'] }); },
    onError: (e) => toast.error(e.message)
  });

  const handleGameEnd = async (won) => {
    if (!activeRoom) return;
    const bet = activeRoom.bet_points || 0;
    const gameName = MULTIPLAYER_TYPES[activeRoom.game_type]?.name || activeRoom.game_type;
    if (bet > 0 && won) await base44.auth.updateMe({ points_balance: (user.points_balance || 0) + bet });
    if (won) { await base44.auth.updateMe({ games_won: (user.games_won||0)+1, games_played: (user.games_played||0)+1 }); if (bet>0) toast.success(`🏆 Wygrałeś ${bet} punktów!`); }
    else await base44.auth.updateMe({ games_played: (user.games_played||0)+1 });
    await sendNotification({ userId: user.id, userEmail: user.email, type: 'status_update', title: won ? `🏆 Wygrałeś w ${gameName}!` : `Mecz zakończony`, message: won ? 'Gratulacje!' : 'Lepsza próba następnym razem!', referenceId: activeRoom.id, referenceType: 'other' });
    if (opponent?.id) await sendNotification({ userId: opponent.id, userEmail: opponent.email, type: 'status_update', title: won ? `Mecz zakończony` : `🏆 Wygrałeś!`, message: won ? 'Twój przeciwnik wygrał.' : 'Gratulacje!', referenceId: activeRoom.id, referenceType: 'other' });
    queryClient.invalidateQueries({ queryKey: ['currentUser'] });
  };

  const leaveRoom = async () => {
    if (activeRoom?.status === 'waiting') await base44.entities.GameRoom.update(activeRoom.id, { status: 'abandoned' });
    setActiveRoom(null); setOpponent(null);
    queryClient.invalidateQueries({ queryKey: ['gameRooms'] });
  };

  if (!getSetting('games_enabled')) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center"><span className="text-6xl mb-4 block">🎮</span>
          <h2 className="text-2xl font-bold text-white mb-2">Gry tymczasowo wyłączone</h2>
          <p className="text-slate-400">Administrator wyłączył sekcję gier.</p>
        </div>
      </div>
    );
  }

  const startSoloGame = (key) => {
    setPendingGame(key);
  };

  // Solo game view
  if (soloGame) {
    const gameMeta = SOLO_GAMES.find(g => g.key === soloGame);
    const gameEl = {
      quiz: <QuizGame user={user} onClose={() => setSoloGame(null)} />,
      memory: <MemoryGame user={user} onClose={() => setSoloGame(null)} />,
      minesweeper: <MinesweeperGame user={user} onClose={() => setSoloGame(null)} />,
      snake: <SnakeGame user={user} onClose={() => setSoloGame(null)} />,
      scratch: <ScratchCard user={user} onClose={() => setSoloGame(null)} />,
      wheel: null,
    }[soloGame];

    return (
      <div className="min-h-screen bg-[#0a0a0f] py-6">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">{gameMeta?.icon}</span>
            <h1 className="text-xl font-bold text-white">{gameMeta?.name}</h1>
          </div>
          <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
            <CardContent className="p-6">{gameEl}</CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Pre-game ad overlay
  if (pendingGame) {
    const gameMeta = SOLO_GAMES.find(g => g.key === pendingGame);
    return (
      <>
        <div className="min-h-screen bg-[#0a0a0f]" />
        <PreGameAd
          gameName={gameMeta?.name || ''}
          gameIcon={gameMeta?.icon || '🎮'}
          onStart={() => { const g = pendingGame; setPendingGame(null); setSoloGame(g); }}
          onSkip={() => { const g = pendingGame; setPendingGame(null); setSoloGame(g); }}
        />
      </>
    );
  }

  // Active multiplayer room
  if (activeRoom) {
    const gt = MULTIPLAYER_TYPES[activeRoom.game_type];
    const isWaiting = activeRoom.status === 'waiting';
    return (
      <div className="min-h-screen bg-[#0a0a0f] py-6">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gt.color} flex items-center justify-center`}>
                <gt.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{gt.name}</h1>
                {activeRoom.bet_points > 0 && <Badge className="bg-yellow-500/20 text-yellow-400 text-xs"><Coins className="w-3 h-3 mr-1" /> Stawka: {activeRoom.bet_points} pkt</Badge>}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={leaveRoom} className="border-red-500/30 text-red-400 bg-transparent"><X className="w-4 h-4 mr-1" /> Opuść</Button>
          </div>
          {isWaiting ? (
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20 text-center py-12">
              <CardContent>
                <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
                <h2 className="text-white text-xl font-semibold mb-2">Oczekiwanie na gracza...</h2>
                <p className="text-slate-400 mb-4">Zaproś znajomego przez prywatny link lub poczekaj na kogoś z lobby</p>
                <div className="flex items-center gap-2 justify-center flex-wrap">
                  <Badge className="bg-slate-700 text-slate-300">ID Pokoju: {activeRoom.id?.slice(0,8)}</Badge>
                  <Button size="sm" variant="outline" className="border-purple-500/40 text-purple-300 bg-transparent"
                    onClick={() => { const url = `${window.location.origin}${window.location.pathname}?join_room=${activeRoom.id}`; navigator.clipboard.writeText(url); toast.success('Link skopiowany!'); }}>
                    <Copy className="w-3.5 h-3.5 mr-1" /> Kopiuj link
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
                  <CardContent className="p-4">
                    {activeRoom.game_type === 'battleship' && <BattleshipGame room={activeRoom} currentUser={user} opponent={opponent} onGameEnd={handleGameEnd} />}
                    {activeRoom.game_type === 'tictactoe' && <TicTacToeGame room={activeRoom} currentUser={user} opponent={opponent} onGameEnd={handleGameEnd} />}
                    {activeRoom.game_type === 'connect4' && <Connect4Game room={activeRoom} currentUser={user} opponent={opponent} onGameEnd={handleGameEnd} />}
                  </CardContent>
                </Card>
              </div>
              <div>
                <GameChat roomId={activeRoom.id} currentUser={user} opponent={opponent} chatEnabled={getSetting('games_chat_enabled') && !user?.chat_blocked} onReport={(u) => setReportTarget(u)} />
              </div>
            </div>
          )}
        </div>
        <ReportModal open={!!reportTarget} onClose={() => setReportTarget(null)} currentUser={user} reportedUser={reportTarget} roomId={activeRoom?.id} gameType={activeRoom?.game_type} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">🎮 Arena Gier</h1>
            <p className="text-slate-400 mt-1">Zagraj solo lub ze znajomymi i wygraj punkty!</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="text-white font-bold">{(user?.points_balance || 0).toLocaleString()} pkt</span>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="multi">
          <TabsList className="bg-slate-800/50 border border-purple-500/20 mb-6 w-full">
            <TabsTrigger value="multi" className="flex-1 data-[state=active]:bg-cyan-600 data-[state=active]:text-white">👥 Multiplayer</TabsTrigger>
            <TabsTrigger value="solo" className="flex-1 data-[state=active]:bg-purple-600 data-[state=active]:text-white">🕹️ Gry Solo</TabsTrigger>
            <TabsTrigger value="wheel" className="flex-1 data-[state=active]:bg-amber-600 data-[state=active]:text-white">🎡 Koło fortuny</TabsTrigger>
            <TabsTrigger value="ranking" className="flex-1 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">🏆 Ranking</TabsTrigger>
          </TabsList>

          {/* SOLO GAMES */}
          <TabsContent value="solo">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SOLO_GAMES.filter(g => g.key !== 'wheel').map(game => {
                const enabled = getSetting(game.setting);
                return (
                  <motion.div key={game.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className={`bg-[#1a1a2e]/50 border-purple-500/20 overflow-hidden ${enabled ? 'cursor-pointer hover:border-purple-500/50' : 'opacity-50 cursor-not-allowed'} transition-all group`}
                      onClick={() => enabled && startSoloGame(game.key)}>
                      <CardContent className="p-5">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center mb-3 ${enabled ? 'group-hover:scale-110' : ''} transition-transform text-2xl`}>
                          {game.icon}
                        </div>
                        <h3 className="text-white font-bold">{game.name}</h3>
                        <p className="text-slate-400 text-sm">{game.desc}</p>
                        {!enabled && <Badge className="bg-slate-700 text-slate-400 text-xs mt-2">Wyłączone</Badge>}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              {[
                { label: 'Rozegrane', value: user?.games_played || 0, icon: '🎮' },
                { label: 'Wygrane', value: user?.games_won || 0, icon: '🏆' },
                { label: 'Win Rate', value: user?.games_played ? `${Math.round((user.games_won||0)/user.games_played*100)}%` : '—', icon: '📊' },
              ].map((s,i) => (
                <Card key={i} className="bg-[#1a1a2e]/50 border-purple-500/20 text-center">
                  <CardContent className="p-3">
                    <p className="text-2xl mb-1">{s.icon}</p>
                    <p className="text-white font-bold text-lg">{s.value}</p>
                    <p className="text-slate-400 text-xs">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-6"><GameAchievements user={user} /></div>
          </TabsContent>

          {/* FORTUNE WHEEL */}
          <TabsContent value="wheel">
            {getSetting('wheel_enabled') ? (
              <Card className="bg-[#1a1a2e]/50 border-purple-500/20 max-w-sm mx-auto">
                <CardHeader>
                  <CardTitle className="text-white text-center">🎡 Koło Fortuny</CardTitle>
                  <p className="text-slate-400 text-sm text-center">Kręć raz dziennie i wygraj punkty!</p>
                </CardHeader>
                <CardContent>
                  <FortuneWheel user={user} />
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-16 text-slate-400">
                <span className="text-5xl block mb-4">🎡</span>
                <p>Koło fortuny jest tymczasowo wyłączone przez administratora.</p>
              </div>
            )}
          </TabsContent>

          {/* MULTIPLAYER */}
          <TabsContent value="multi">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(MULTIPLAYER_TYPES).map(([key, gt]) => (
                  <motion.div key={key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="bg-[#1a1a2e]/50 border-purple-500/20 overflow-hidden cursor-pointer hover:border-purple-500/50 transition-all group"
                      onClick={() => { setNewGame({ game_type: key, bet_points: 0 }); setShowCreate(true); }}>
                      <CardContent className="p-5">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gt.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                          <gt.icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-white font-bold">{gt.name}</h3>
                        <p className="text-slate-400 text-sm">{gt.desc}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Open rooms */}
              <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-400" /> Lobby — otwarte gry
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>
                  ) : rooms.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <span className="text-4xl block mb-3">🎯</span>
                      <p>Brak otwartych gier</p>
                      <Button className="mt-3 bg-gradient-to-r from-purple-600 to-cyan-600" onClick={() => setShowCreate(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Utwórz grę
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {rooms.map(room => {
                        const gt = MULTIPLAYER_TYPES[room.game_type];
                        const isOwn = room.player1_id === user?.id;
                        return (
                          <div key={room.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-purple-500/10">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${gt?.color} flex items-center justify-center`}>
                                {gt && <gt.icon className="w-4 h-4 text-white" />}
                              </div>
                              <div>
                                <p className="text-white font-medium">{gt?.name}</p>
                                <p className="text-slate-400 text-xs">{room.player1_email?.split('@')[0]}</p>
                              </div>
                              {room.bet_points > 0 && <Badge className="bg-yellow-500/20 text-yellow-400 text-xs"><Coins className="w-3 h-3 mr-1" />{room.bet_points} pkt</Badge>}
                            </div>
                            {!isOwn && (
                              <Button size="sm" onClick={() => joinMutation.mutate(room)} disabled={joinMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                                <Play className="w-3 h-3 mr-1" /> Dołącz
                              </Button>
                            )}
                            {isOwn && <Badge className="bg-slate-700 text-slate-400"><Clock className="w-3 h-3 mr-1 inline" /> Twoja</Badge>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Button onClick={() => setShowCreate(true)} className="w-full bg-gradient-to-r from-purple-600 to-cyan-600">
                <Plus className="w-4 h-4 mr-2" /> Nowa gra multiplayer
              </Button>
            </div>
          </TabsContent>

          {/* RANKING */}
          <TabsContent value="ranking">
            <GameRankings />
          </TabsContent>
        </Tabs>
      </div>

      {/* Create multiplayer dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-[#1a1a2e] border-purple-500/30 text-white max-w-sm">
          <DialogHeader><DialogTitle className="text-white">Utwórz nową grę</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Wybierz grę</Label>
              <Select value={newGame.game_type} onValueChange={v => setNewGame(p => ({ ...p, game_type: v }))}>
                <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-purple-500/30 text-white">
                  {Object.entries(MULTIPLAYER_TYPES).map(([k, g]) => (
                    <SelectItem key={k} value={k} className="text-white">{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Stawka (punkty)</Label>
              <Input type="number" min="0" step="10" value={newGame.bet_points}
                onChange={e => setNewGame(p => ({ ...p, bet_points: parseInt(e.target.value)||0 }))}
                className="bg-slate-800 border-purple-500/30 text-white" placeholder="0 = bez stawki" />
              <p className="text-slate-500 text-xs">Twoje saldo: {(user?.points_balance||0).toLocaleString()} pkt</p>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <Lock className="w-4 h-4 text-slate-400" />
              <div className="flex-1">
                <p className="text-white text-sm">Prywatny pokój</p>
                <p className="text-slate-500 text-xs">Tylko osoby z linkiem mogą dołączyć</p>
              </div>
              <button onClick={() => setNewGame(p => ({ ...p, is_private: !p.is_private }))}
                className={`w-10 h-5 rounded-full transition-colors relative ${newGame.is_private ? 'bg-purple-600' : 'bg-slate-600'}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${newGame.is_private ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1 border-slate-600 text-slate-300 bg-transparent">Anuluj</Button>
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />} Utwórz
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}