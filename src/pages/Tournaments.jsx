import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Trophy, Loader2, Plus, Coins, Crown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TournamentCard from '@/components/tournaments/TournamentCard.jsx';
import { sendNotification } from '@/components/notifications/notificationHelpers.jsx';

export default function Tournaments() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => base44.entities.Tournament.filter({}, '-created_date', 50),
    refetchInterval: 10000
  });

  const { data: myParticipations = [] } = useQuery({
    queryKey: ['myTournamentParticipations', user?.id],
    queryFn: () => base44.entities.TournamentParticipant.filter({ user_id: user?.id }),
    enabled: !!user?.id
  });

  const joinMutation = useMutation({
    mutationFn: async (tournament) => {
      if ((user.points_balance || 0) < tournament.entry_fee) throw new Error('Niewystarczające punkty');

      // Check if already joined
      const existing = myParticipations.find(p => p.tournament_id === tournament.id);
      if (existing) throw new Error('Już jesteś zapisany');

      // Deduct entry fee
      const newBalance = (user.points_balance || 0) - tournament.entry_fee;
      await base44.auth.updateMe({ points_balance: newBalance });

      // Record participation
      await base44.entities.TournamentParticipant.create({
        tournament_id: tournament.id,
        tournament_name: tournament.name,
        user_id: user.id,
        user_email: user.email,
        user_name: user.full_name || user.email,
        user_elo: user.elo_rating || 1000,
        registered_date: new Date().toISOString(),
      });

      // Update tournament
      await base44.entities.Tournament.update(tournament.id, {
        current_participants: tournament.current_participants + 1,
        prize_pool: tournament.prize_pool + tournament.entry_fee,
      });

      // Points history
      await base44.entities.PointsHistory.create({
        user_id: user.id,
        user_email: user.email,
        amount: -tournament.entry_fee,
        balance_after: newBalance,
        type: 'tournament_entry',
        description: `Wpisowe turniej: ${tournament.name}`,
        reference_id: tournament.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['myTournamentParticipations'] });
      toast.success('Zapisano na turniej! 🏆');
    },
    onError: (e) => toast.error(e.message)
  });

  const leaveMutation = useMutation({
    mutationFn: async (tournament) => {
      const participation = myParticipations.find(p => p.tournament_id === tournament.id);
      if (!participation) throw new Error('Nie jesteś zapisany');

      // Refund entry fee
      const newBalance = (user.points_balance || 0) + tournament.entry_fee;
      await base44.auth.updateMe({ points_balance: newBalance });

      // Remove participation
      await base44.entities.TournamentParticipant.delete(participation.id);

      // Update tournament
      await base44.entities.Tournament.update(tournament.id, {
        current_participants: Math.max(0, tournament.current_participants - 1),
        prize_pool: Math.max(0, tournament.prize_pool - tournament.entry_fee),
      });

      await base44.entities.PointsHistory.create({
        user_id: user.id,
        user_email: user.email,
        amount: tournament.entry_fee,
        balance_after: newBalance,
        type: 'tournament_refund',
        description: `Zwrot wpisowego: ${tournament.name}`,
        reference_id: tournament.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['myTournamentParticipations'] });
      toast.info('Wycofano z turnieju — wpisowe zwrócone.');
    },
    onError: (e) => toast.error(e.message)
  });

  const isJoined = (tournamentId) => myParticipations.some(p => p.tournament_id === tournamentId);

  const activeTournaments = tournaments.filter(t => ['registration', 'active'].includes(t.status));
  const upcomingTournaments = tournaments.filter(t => t.status === 'upcoming');
  const finishedTournaments = tournaments.filter(t => t.status === 'finished');

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Trophy className="w-8 h-8 text-yellow-400" /> Turnieje
              </h1>
              <p className="text-slate-400 mt-1">Rywalizuj o pulę nagród w grach multiplayer!</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="font-bold text-white">{(user?.points_balance || 0).toLocaleString()}</span>
              <span className="text-slate-400 text-sm">pkt</span>
            </div>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
          </div>
        ) : (
          <Tabs defaultValue="active">
            <TabsList className="bg-slate-800/50 border border-purple-500/20 mb-6 w-full">
              <TabsTrigger value="active" className="flex-1 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                Aktywne ({activeTournaments.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="flex-1 data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
                Nadchodzące ({upcomingTournaments.length})
              </TabsTrigger>
              <TabsTrigger value="finished" className="flex-1 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                Zakończone ({finishedTournaments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {activeTournaments.length === 0 ? (
                <EmptyState text="Brak aktywnych turniejów. Sprawdź później!" />
              ) : (
                activeTournaments.map((t, i) => (
                  <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <TournamentCard
                      tournament={t}
                      user={user}
                      isJoined={isJoined(t.id)}
                      onJoin={() => joinMutation.mutate(t)}
                      onLeave={() => leaveMutation.mutate(t)}
                      isPending={joinMutation.isPending || leaveMutation.isPending}
                    />
                  </motion.div>
                ))
              )}
            </TabsContent>

            <TabsContent value="upcoming" className="space-y-4">
              {upcomingTournaments.length === 0 ? (
                <EmptyState text="Brak nadchodzących turniejów." />
              ) : (
                upcomingTournaments.map((t, i) => (
                  <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <TournamentCard
                      tournament={t}
                      user={user}
                      isJoined={isJoined(t.id)}
                      onJoin={() => joinMutation.mutate(t)}
                      onLeave={() => leaveMutation.mutate(t)}
                      isPending={joinMutation.isPending || leaveMutation.isPending}
                    />
                  </motion.div>
                ))
              )}
            </TabsContent>

            <TabsContent value="finished" className="space-y-4">
              {finishedTournaments.length === 0 ? (
                <EmptyState text="Brak zakończonych turniejów." />
              ) : (
                finishedTournaments.map((t, i) => (
                  <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <TournamentCard
                      tournament={t}
                      user={user}
                      isJoined={isJoined(t.id)}
                      isPending={false}
                    />
                  </motion.div>
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="text-center py-16">
      <Trophy className="w-16 h-16 mx-auto text-slate-600 mb-4" />
      <p className="text-slate-400">{text}</p>
    </div>
  );
}