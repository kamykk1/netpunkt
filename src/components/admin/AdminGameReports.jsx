import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flag, ShieldOff, Shield, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const statusColors = {
  new: 'bg-red-500/20 text-red-400',
  reviewed: 'bg-amber-500/20 text-amber-400',
  resolved: 'bg-emerald-500/20 text-emerald-400',
};

export default function AdminGameReports() {
  const queryClient = useQueryClient();
  const [detail, setDetail] = useState(null);

  const { data: reports = [] } = useQuery({
    queryKey: ['gameReports'],
    queryFn: () => base44.entities.GameReport.list('-created_date', 50)
  });

  const updateReportMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.GameReport.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gameReports'] })
  });

  const blockUserChat = async (userId, block) => {
    // We update via entities User - admin only
    const users = await base44.entities.User.filter({ id: userId });
    if (users[0]) {
      await base44.entities.User.update(users[0].id, { chat_blocked: block });
      toast.success(block ? 'Użytkownik zablokowany na czacie' : 'Odblokowano czat użytkownika');
      queryClient.invalidateQueries({ queryKey: ['gameReports'] });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Flag className="w-5 h-5 text-red-400" />
        <h3 className="text-white font-semibold">Zgłoszenia z gier ({reports.filter(r => r.status === 'new').length} nowych)</h3>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <Flag className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Brak zgłoszeń</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reports.map(report => (
            <div key={report.id} className={`p-4 rounded-xl border transition-all ${
              report.status === 'new' ? 'border-red-500/30 bg-red-500/5' : 'border-slate-700/50 bg-slate-800/30'
            }`}>
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={statusColors[report.status]}>{report.status}</Badge>
                    <span className="text-slate-400 text-xs">{new Date(report.created_date).toLocaleString('pl-PL')}</span>
                  </div>
                  <p className="text-white font-medium">
                    <span className="text-slate-400">Zgłoszony: </span>
                    <span className="text-red-300">{report.reported_user_login}</span>
                  </p>
                  <p className="text-slate-400 text-sm">
                    Przez: {report.reporter_email} · Powód: <span className="text-amber-300">{report.reason}</span>
                  </p>
                  {report.description && (
                    <p className="text-slate-300 text-sm mt-1 italic">"{report.description}"</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="border-purple-500/30 text-purple-400 bg-transparent"
                    onClick={() => setDetail(report)}>
                    <Eye className="w-3 h-3 mr-1" /> Szczegóły
                  </Button>
                  {!report.chat_blocked ? (
                    <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={async () => {
                        await blockUserChat(report.reported_user_id, true);
                        updateReportMutation.mutate({ id: report.id, data: { status: 'resolved', chat_blocked: true, admin_action: 'chat_blocked' } });
                      }}>
                      <ShieldOff className="w-3 h-3 mr-1" /> Blokuj czat
                    </Button>
                  ) : (
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={async () => {
                        await blockUserChat(report.reported_user_id, false);
                        updateReportMutation.mutate({ id: report.id, data: { status: 'resolved', chat_blocked: false, admin_action: 'chat_unblocked' } });
                      }}>
                      <Shield className="w-3 h-3 mr-1" /> Odblokuj czat
                    </Button>
                  )}
                  {report.status === 'new' && (
                    <Button size="sm" variant="outline" className="border-amber-500/30 text-amber-400 bg-transparent"
                      onClick={() => updateReportMutation.mutate({ id: report.id, data: { status: 'reviewed' } })}>
                      Przejrzano
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="bg-[#1a1a2e] border-purple-500/30 text-white">
          <DialogHeader>
            <DialogTitle>Szczegóły zgłoszenia</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-slate-400">Zgłoszony</p><p className="text-red-300 font-medium">{detail.reported_user_login}</p></div>
                <div><p className="text-slate-400">Przez</p><p className="text-white">{detail.reporter_email}</p></div>
                <div><p className="text-slate-400">Gra</p><p className="text-white">{detail.game_type}</p></div>
                <div><p className="text-slate-400">Powód</p><p className="text-amber-300">{detail.reason}</p></div>
              </div>
              {detail.description && (
                <div><p className="text-slate-400 mb-1">Opis</p><p className="text-white bg-slate-800/50 p-2 rounded">{detail.description}</p></div>
              )}
              {detail.admin_action && (
                <div><p className="text-slate-400 mb-1">Akcja admina</p><Badge className="bg-purple-500/20 text-purple-300">{detail.admin_action}</Badge></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}