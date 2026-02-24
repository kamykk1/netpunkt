import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  MessageSquare, Mail, AlertTriangle, ShoppingBag, Megaphone,
  Loader2, Reply, CheckCircle, Clock, Eye
} from 'lucide-react';
import { sendNotification } from '@/components/notifications/notificationHelpers.jsx';

const DEPARTMENT_CONFIG = {
  advertising: { icon: Megaphone, color: 'text-purple-400', label: 'Reklama' },
  contact: { icon: Mail, color: 'text-cyan-400', label: 'Kontakt' },
  complaints: { icon: AlertTriangle, color: 'text-red-400', label: 'Reklamacje' },
  purchases: { icon: ShoppingBag, color: 'text-emerald-400', label: 'Zakupy' },
};

const STATUS_CONFIG = {
  new: { color: 'bg-blue-500/20 text-blue-400', label: 'Nowa' },
  in_progress: { color: 'bg-amber-500/20 text-amber-400', label: 'W toku' },
  resolved: { color: 'bg-emerald-500/20 text-emerald-400', label: 'Rozwiązana' },
  closed: { color: 'bg-slate-500/20 text-slate-400', label: 'Zamknięta' },
};

export default function AdminContactMessages() {
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['contactMessages'],
    queryFn: () => base44.entities.ContactMessage.list('-created_date')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ContactMessage.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactMessages'] });
      toast.success('Wiadomość zaktualizowana!');
    }
  });

  const replyMutation = useMutation({
    mutationFn: async ({ message, reply }) => {
      await base44.integrations.Core.SendEmail({
        to: message.user_email,
        from_name: 'netpunkt.pl',
        subject: `Re: ${message.subject}`,
        body: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0f0f18;color:#fff;padding:24px;border-radius:12px;">
          <h2 style="color:#8b5cf6;">Odpowiedź na Twoje zgłoszenie</h2>
          <p>Witaj ${message.user_name || 'Użytkowniku'},</p>
          <p style="color:#cbd5e1;">${reply}</p>
          <hr style="border-color:#8b5cf630;margin:16px 0;"/>
          <p style="font-size:12px;color:#64748b;">W odpowiedzi na: <em>${message.subject}</em></p>
          <p style="font-size:12px;color:#64748b;">Zespół <strong>netpunkt.pl</strong></p>
          </div>
        `
      });

      // In-app notification for user
      if (message.user_id) {
        await sendNotification({
          userId: message.user_id,
          userEmail: message.user_email,
          type: 'message_received',
          title: `Odpowiedź na: ${message.subject}`,
          message: reply.length > 120 ? reply.slice(0, 120) + '…' : reply,
          referenceId: message.id,
          referenceType: 'message'
        });
      }

      await base44.entities.ContactMessage.update(message.id, {
        status: 'resolved',
        admin_notes: reply
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactMessages'] });
      setSelectedMessage(null);
      setReplyText('');
      toast.success('Odpowiedź wysłana!');
    }
  });

  const filteredMessages = messages.filter(m => {
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    if (deptFilter !== 'all' && m.department !== deptFilter) return false;
    return true;
  });

  const newCount = messages.filter(m => m.status === 'new').length;

  return (
    <div className="space-y-6">
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-cyan-400" />
            Wiadomości kontaktowe
            {newCount > 0 && (
              <Badge className="bg-blue-500 text-white ml-2">{newCount} nowych</Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-36 bg-slate-800 border-purple-500/30 text-white">
                <SelectValue placeholder="Dział" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-purple-500/30 text-white">
                <SelectItem value="all" className="text-white">Wszystkie działy</SelectItem>
                {Object.entries(DEPARTMENT_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key} className="text-white">{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 bg-slate-800 border-purple-500/30 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-purple-500/30 text-white">
                <SelectItem value="all" className="text-white">Wszystkie</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key} className="text-white">{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : filteredMessages.length > 0 ? (
            <div className="space-y-3">
              {filteredMessages.map((msg) => {
                const dept = DEPARTMENT_CONFIG[msg.department] || DEPARTMENT_CONFIG.contact;
                const status = STATUS_CONFIG[msg.status] || STATUS_CONFIG.new;
                const Icon = dept.icon;

                return (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      msg.status === 'new' 
                        ? 'bg-blue-500/10 border-blue-500/30' 
                        : 'bg-slate-800/50 border-purple-500/20 hover:border-purple-500/40'
                    }`}
                    onClick={() => setSelectedMessage(msg)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-slate-800`}>
                          <Icon className={`w-5 h-5 ${dept.color}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-medium">{msg.subject}</p>
                            {msg.status === 'new' && (
                              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            )}
                          </div>
                          <p className="text-slate-400 text-sm">{msg.user_email}</p>
                          <p className="text-slate-500 text-xs mt-1 line-clamp-1">{msg.message}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={status.color}>{status.label}</Badge>
                        <p className="text-slate-500 text-xs mt-1">
                          {new Date(msg.created_date).toLocaleDateString('pl-PL')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Brak wiadomości</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Detail Modal */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-[#1a1a2e] border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="text-white">{selectedMessage?.subject}</DialogTitle>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{selectedMessage.user_name || 'Użytkownik'}</p>
                  <p className="text-slate-400 text-sm">{selectedMessage.user_email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={DEPARTMENT_CONFIG[selectedMessage.department]?.color.replace('text-', 'bg-').replace('-400', '-500/20')}>
                    {DEPARTMENT_CONFIG[selectedMessage.department]?.label}
                  </Badge>
                  <Select
                    value={selectedMessage.status}
                    onValueChange={(status) => updateMutation.mutate({ id: selectedMessage.id, data: { status } })}
                  >
                    <SelectTrigger className="w-32 bg-slate-800 border-purple-500/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-purple-500/30 text-white">
                      {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key} className="text-white">{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className="text-white whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>

              {selectedMessage.ai_response && (
                <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                  <p className="text-purple-400 text-sm font-medium mb-1">Odpowiedź AI:</p>
                  <p className="text-white">{selectedMessage.ai_response}</p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-slate-400 text-sm">Odpowiedz:</p>
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="bg-slate-800 border-purple-500/30 text-white"
                  rows={4}
                  placeholder="Napisz odpowiedź..."
                />
              </div>

              <Button
                onClick={() => replyMutation.mutate({ message: selectedMessage, reply: replyText })}
                disabled={!replyText.trim() || replyMutation.isPending}
                className="w-full bg-gradient-to-r from-purple-600 to-cyan-600"
              >
                {replyMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Reply className="w-4 h-4 mr-2" />
                )}
                Wyślij odpowiedź
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}