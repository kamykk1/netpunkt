import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Pencil, Search } from 'lucide-react';

export default function AdminUsersList({ users, updateUserMutation, title, showAdvertiserBadge }) {
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editData, setEditData] = useState({});

  const filtered = users.filter(u =>
    (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (u) => {
    setEditingUser(u);
    setEditData({
      full_name: u.full_name || '',
      points_balance: u.points_balance || 0,
      membership_level: u.membership_level || 1,
      is_moderator: u.is_moderator || false,
      is_blocked: u.is_blocked || false,
    });
  };

  const saveEdit = () => {
    updateUserMutation.mutate({ id: editingUser.id, data: editData }, {
      onSuccess: () => setEditingUser(null)
    });
  };

  return (
    <>
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            {title} ({filtered.length})
          </CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Szukaj..."
              className="pl-9 bg-slate-800 border-purple-500/30 text-white"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-purple-500/20">
                  <TableHead className="text-slate-400">Imię</TableHead>
                  <TableHead className="text-slate-400">Email</TableHead>
                  <TableHead className="text-slate-400">Punkty</TableHead>
                  <TableHead className="text-slate-400">Poziom</TableHead>
                  {showAdvertiserBadge && <TableHead className="text-slate-400">Reklamy</TableHead>}
                  <TableHead className="text-slate-400">Fraud</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id} className="border-purple-500/20">
                    <TableCell className="text-white font-medium">{u.full_name || '-'}</TableCell>
                    <TableCell className="text-slate-300">{u.email}</TableCell>
                    <TableCell className="text-yellow-400">{(u.points_balance || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-purple-400">Lv.{u.membership_level || 1}</TableCell>
                    {showAdvertiserBadge && <TableCell className="text-slate-300">{u.ads_viewed || 0}</TableCell>}
                    <TableCell>
                      <Badge className={
                        (u.fraud_score || 0) > 70 ? 'bg-red-500/20 text-red-400' :
                        (u.fraud_score || 0) > 40 ? 'bg-amber-500/20 text-amber-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }>
                        {u.fraud_score || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {u.role === 'admin' && <Badge className="bg-purple-500/20 text-purple-400">Admin</Badge>}
                        {u.is_moderator && <Badge className="bg-cyan-500/20 text-cyan-400">Mod</Badge>}
                        {!u.role && !u.is_moderator && <Badge className="bg-slate-500/20 text-slate-400">Free</Badge>}
                        {u.is_blocked && <Badge className="bg-red-500/20 text-red-400">Zablok.</Badge>}
                        {showAdvertiserBadge && <Badge className="bg-orange-500/20 text-orange-400">Reklamodawca</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-purple-500/30 text-purple-400 bg-transparent"
                          onClick={() => openEdit(u)}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className={u.is_blocked ? 'border-emerald-500/30 text-emerald-400 bg-transparent' : 'border-red-500/30 text-red-400 bg-transparent'}
                          onClick={() => updateUserMutation.mutate({ id: u.id, data: { is_blocked: !u.is_blocked } })}
                        >
                          {u.is_blocked ? 'Odblokuj' : 'Zablokuj'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="bg-[#1a1a2e] border-purple-500/30 text-white">
          <DialogHeader>
            <DialogTitle>Edytuj użytkownika</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-slate-300">Imię i nazwisko</Label>
              <Input
                value={editData.full_name || ''}
                onChange={e => setEditData(p => ({ ...p, full_name: e.target.value }))}
                className="bg-slate-800 border-purple-500/30 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Saldo punktów</Label>
              <Input
                type="number"
                value={editData.points_balance || 0}
                onChange={e => setEditData(p => ({ ...p, points_balance: parseInt(e.target.value) || 0 }))}
                className="bg-slate-800 border-purple-500/30 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Poziom członkostwa (1-5)</Label>
              <Input
                type="number"
                min="1" max="5"
                value={editData.membership_level || 1}
                onChange={e => setEditData(p => ({ ...p, membership_level: parseInt(e.target.value) || 1 }))}
                className="bg-slate-800 border-purple-500/30 text-white"
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-purple-500/20">
              <span className="text-slate-300">Moderator</span>
              <button
                onClick={() => setEditData(p => ({ ...p, is_moderator: !p.is_moderator }))}
                className={`w-10 h-5 rounded-full transition-colors relative ${editData.is_moderator ? 'bg-cyan-600' : 'bg-slate-600'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${editData.is_moderator ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditingUser(null)} className="flex-1 border-slate-600 text-white bg-transparent">Anuluj</Button>
              <Button onClick={saveEdit} disabled={updateUserMutation.isPending} className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600">Zapisz</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}