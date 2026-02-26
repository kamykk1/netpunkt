import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Check, X, Copy, Search, Gamepad2 } from 'lucide-react';
import { toast } from 'sonner';

export default function FriendsPanel({ user, onInviteToGame }) {
  const queryClient = useQueryClient();
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);

  const { data: sentRequests = [] } = useQuery({
    queryKey: ['friendsSent', user?.id],
    queryFn: () => base44.entities.Friendship.filter({ requester_id: user?.id }),
    enabled: !!user?.id,
    refetchInterval: 15000,
  });

  const { data: receivedRequests = [] } = useQuery({
    queryKey: ['friendsReceived', user?.id],
    queryFn: () => base44.entities.Friendship.filter({ addressee_id: user?.id }),
    enabled: !!user?.id,
    refetchInterval: 15000,
  });

  const friends = [
    ...sentRequests.filter(r => r.status === 'accepted').map(r => ({ id: r.addressee_id, name: r.addressee_name, email: r.addressee_email, friendshipId: r.id })),
    ...receivedRequests.filter(r => r.status === 'accepted').map(r => ({ id: r.requester_id, name: r.requester_name, email: r.requester_email, friendshipId: r.id })),
  ];

  const pendingReceived = receivedRequests.filter(r => r.status === 'pending');
  const pendingSent = sentRequests.filter(r => r.status === 'pending');

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true);
    setSearchResult(null);
    const results = await base44.entities.User.filter({ email: searchEmail.trim() });
    const found = results[0];
    if (!found) { toast.error('Nie znaleziono użytkownika'); setSearching(false); return; }
    if (found.id === user?.id) { toast.error('Nie możesz dodać siebie'); setSearching(false); return; }
    const alreadyFriend = friends.find(f => f.id === found.id);
    const alreadySent = sentRequests.find(r => r.addressee_id === found.id);
    setSearchResult({ ...found, alreadyFriend: !!alreadyFriend, alreadySent: !!alreadySent });
    setSearching(false);
  };

  const sendRequestMutation = useMutation({
    mutationFn: (target) => base44.entities.Friendship.create({
      requester_id: user.id,
      requester_email: user.email,
      requester_name: user.full_name || user.email,
      addressee_id: target.id,
      addressee_email: target.email,
      addressee_name: target.full_name || target.email,
      status: 'pending',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendsSent', user?.id] });
      setSearchResult(null);
      setSearchEmail('');
      toast.success('Zaproszenie wysłane!');
    },
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Friendship.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendsReceived', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['friendsSent', user?.id] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id) => base44.entities.Friendship.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendsSent', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['friendsReceived', user?.id] });
      toast.success('Usunięto ze znajomych');
    },
  });

  return (
    <div className="space-y-4">
      {/* Search */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm flex items-center gap-2"><UserPlus className="w-4 h-4 text-purple-400" /> Dodaj znajomego</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={searchEmail}
              onChange={e => setSearchEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Email znajomego..."
              className="bg-slate-800 border-purple-500/30 text-white text-sm"
            />
            <Button size="sm" onClick={handleSearch} disabled={searching} className="bg-purple-600 hover:bg-purple-700">
              <Search className="w-4 h-4" />
            </Button>
          </div>
          {searchResult && (
            <div className="mt-3 p-3 rounded-lg bg-slate-800/60 border border-slate-700 flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">{searchResult.full_name || searchResult.email}</p>
                <p className="text-slate-400 text-xs">{searchResult.email}</p>
              </div>
              {searchResult.alreadyFriend ? (
                <Badge className="bg-emerald-500/20 text-emerald-400">Znajomy</Badge>
              ) : searchResult.alreadySent ? (
                <Badge className="bg-slate-600 text-slate-300">Zaproszono</Badge>
              ) : (
                <Button size="sm" onClick={() => sendRequestMutation.mutate(searchResult)} disabled={sendRequestMutation.isPending} className="bg-purple-600 hover:bg-purple-700">
                  <UserPlus className="w-3 h-3 mr-1" /> Dodaj
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending invitations received */}
      {pendingReceived.length > 0 && (
        <Card className="bg-[#1a1a2e]/50 border-yellow-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-yellow-400" /> Zaproszenia ({pendingReceived.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingReceived.map(req => (
              <div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                <div>
                  <p className="text-white text-sm">{req.requester_name || req.requester_email}</p>
                  <p className="text-slate-500 text-xs">{req.requester_email}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => respondMutation.mutate({ id: req.id, status: 'accepted' })} className="bg-emerald-600 hover:bg-emerald-700 h-7 px-2">
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => respondMutation.mutate({ id: req.id, status: 'rejected' })} className="border-slate-600 text-slate-300 bg-transparent h-7 px-2">
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Friends list */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" /> Znajomi ({friends.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {friends.length === 0 ? (
            <div className="text-center py-6 text-slate-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Brak znajomych. Wyszukaj gracza po emailu!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map(f => (
                <div key={f.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div>
                    <p className="text-white text-sm font-medium">{f.name || f.email}</p>
                    <p className="text-slate-500 text-xs">{f.email}</p>
                  </div>
                  <div className="flex gap-2">
                    {onInviteToGame && (
                      <Button size="sm" onClick={() => onInviteToGame(f)} className="bg-purple-600 hover:bg-purple-700 h-7 text-xs px-2">
                        <Gamepad2 className="w-3 h-3 mr-1" /> Zaproś
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => removeMutation.mutate(f.friendshipId)} className="border-red-500/30 text-red-400 bg-transparent h-7 px-2">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending sent */}
      {pendingSent.length > 0 && (
        <Card className="bg-[#1a1a2e]/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-400 text-xs">Oczekujące ({pendingSent.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {pendingSent.map(req => (
              <div key={req.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/30 text-xs">
                <span className="text-slate-300">{req.addressee_name || req.addressee_email}</span>
                <Badge className="bg-slate-700 text-slate-400">Oczekuje</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}