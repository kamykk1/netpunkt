import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Crown, Users, CreditCard, Search, Plus, Pencil,
  Loader2, Calendar, CheckCircle, XCircle, Clock,
  TrendingUp, DollarSign, AlertTriangle
} from 'lucide-react';

const SUBSCRIPTION_PLANS = [
  { id: 'free', name: 'Darmowy', price: 0, features: ['50 reklam/dzień', '10% ref bonus'] },
  { id: 'basic', name: 'Basic', price: 1999, features: ['100 reklam/dzień', '15% ref bonus', 'Priorytet wypłat'] },
  { id: 'pro', name: 'Pro', price: 4999, features: ['Bez limitu', '20% ref bonus', 'VIP support', '2x punkty'] },
  { id: 'enterprise', name: 'Enterprise', price: 9999, features: ['Wszystko z Pro', 'API access', 'Dedykowany opiekun'] },
];

export default function AdminSubscriptions() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newPlan, setNewPlan] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list('-created_date', 100)
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ userId, plan, expiry }) => {
      await base44.entities.User.update(userId, {
        subscription_plan: plan,
        subscription_expiry: expiry,
        subscription_updated: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast.success('Subskrypcja zaktualizowana!');
      setShowModal(false);
      setEditingUser(null);
    }
  });

  const filteredUsers = users.filter(u => 
    !searchQuery || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: users.length,
    free: users.filter(u => !u.subscription_plan || u.subscription_plan === 'free').length,
    paid: users.filter(u => u.subscription_plan && u.subscription_plan !== 'free').length,
    revenue: users.reduce((sum, u) => {
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === u.subscription_plan);
      return sum + (plan?.price || 0);
    }, 0)
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setNewPlan(user.subscription_plan || 'free');
    setExpiryDate(user.subscription_expiry || '');
    setShowModal(true);
  };

  const handleSave = () => {
    if (!editingUser) return;
    updateSubscriptionMutation.mutate({
      userId: editingUser.id,
      plan: newPlan,
      expiry: expiryDate
    });
  };

  const getPlanBadge = (planId) => {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) return <Badge className="bg-slate-500">Free</Badge>;
    
    const colors = {
      free: 'bg-slate-500',
      basic: 'bg-blue-500',
      pro: 'bg-purple-500',
      enterprise: 'bg-yellow-500'
    };
    
    return (
      <Badge className={colors[planId] || 'bg-slate-500'}>
        <Crown className="w-3 h-3 mr-1" />
        {plan.name}
      </Badge>
    );
  };

  const isExpired = (date) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Wszyscy użytkownicy', value: stats.total, icon: Users, color: 'text-cyan-400' },
          { label: 'Darmowi', value: stats.free, icon: Users, color: 'text-slate-400' },
          { label: 'Płatni', value: stats.paid, icon: Crown, color: 'text-purple-400' },
          { label: 'Przychód mies.', value: `${(stats.revenue / 100).toFixed(0)} zł`, icon: DollarSign, color: 'text-emerald-400' },
        ].map((stat, i) => (
          <Card key={i} className="bg-[#1a1a2e]/50 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color} opacity-50`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plans Overview */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-white">Plany subskrypcji</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const count = users.filter(u => (u.subscription_plan || 'free') === plan.id).length;
              return (
                <div 
                  key={plan.id}
                  className="p-4 rounded-xl bg-slate-800/50 border border-purple-500/20"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-semibold">{plan.name}</h4>
                    <span className="text-purple-400 font-bold">
                      {plan.price === 0 ? 'Free' : `${(plan.price / 100).toFixed(0)} zł`}
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-white mb-2">{count}</p>
                  <p className="text-slate-400 text-sm">użytkowników</p>
                  <ul className="mt-3 space-y-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="text-slate-400 text-xs flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <CardTitle className="text-white">Zarządzanie subskrypcjami</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Szukaj użytkownika..."
                className="pl-10 bg-slate-800 border-purple-500/30 text-white"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.slice(0, 20).map((user) => (
                <div 
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-white font-bold">
                      {user.full_name?.[0] || user.email?.[0] || '?'}
                    </div>
                    <div>
                      <p className="text-white font-medium">{user.full_name || 'Bez nazwy'}</p>
                      <p className="text-slate-400 text-sm">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {getPlanBadge(user.subscription_plan)}
                    
                    {user.subscription_expiry && (
                      <Badge 
                        className={isExpired(user.subscription_expiry) 
                          ? 'bg-red-500/20 text-red-400' 
                          : 'bg-slate-500/20 text-slate-400'}
                      >
                        <Calendar className="w-3 h-3 mr-1" />
                        {isExpired(user.subscription_expiry) ? 'Wygasła' : 
                          new Date(user.subscription_expiry).toLocaleDateString('pl-PL')}
                      </Badge>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditModal(user)}
                      className="border-purple-500/30 text-purple-400"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-[#1a1a2e] border-purple-500/30 text-white">
          <DialogHeader>
            <DialogTitle>Edytuj subskrypcję</DialogTitle>
          </DialogHeader>
          
          {editingUser && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="text-white font-medium">{editingUser.full_name || 'Bez nazwy'}</p>
                <p className="text-slate-400 text-sm">{editingUser.email}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-300">Plan subskrypcji</Label>
                <Select value={newPlan} onValueChange={setNewPlan}>
                  <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-purple-500/30">
                    {SUBSCRIPTION_PLANS.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - {plan.price === 0 ? 'Free' : `${(plan.price / 100).toFixed(0)} zł/mies.`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-300">Data wygaśnięcia</Label>
                <Input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="bg-slate-800 border-purple-500/30 text-white"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border-slate-600"
                >
                  Anuluj
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateSubscriptionMutation.isPending}
                  className="flex-1 bg-purple-600"
                >
                  {updateSubscriptionMutation.isPending && (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  )}
                  Zapisz
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}