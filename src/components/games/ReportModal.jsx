import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Flag, Loader2 } from 'lucide-react';

const REASONS = ['Oszustwo / cheating', 'Wulgarne wiadomości', 'Spam', 'Groźby', 'Inne'];

export default function ReportModal({ open, onClose, currentUser, reportedUser, roomId, gameType }) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!reason) { toast.error('Wybierz powód zgłoszenia'); return; }
    setSending(true);
    await base44.entities.GameReport.create({
      reporter_id: currentUser.id,
      reporter_email: currentUser.email,
      reported_user_id: reportedUser.id,
      reported_user_login: reportedUser.display_name || reportedUser.full_name || reportedUser.email,
      room_id: roomId,
      game_type: gameType,
      reason,
      description
    });
    toast.success('Zgłoszenie wysłane do administracji');
    setSending(false);
    setReason('');
    setDescription('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a2e] border-purple-500/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-400 flex items-center gap-2">
            <Flag className="w-5 h-5" /> Zgłoś użytkownika
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-slate-400 text-sm mb-1">Zgłaszasz: <span className="text-white font-semibold">{reportedUser?.display_name || reportedUser?.full_name}</span></p>
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Powód zgłoszenia *</Label>
            <div className="flex flex-wrap gap-2">
              {REASONS.map(r => (
                <button key={r} onClick={() => setReason(r)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                    reason === r ? 'bg-red-500/20 border-red-500/50 text-red-300' : 'border-slate-600 text-slate-400 hover:border-red-500/30'
                  }`}>{r}</button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Opis sytuacji</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Opisz co się stało..." maxLength={500}
              className="bg-slate-800 border-purple-500/30 text-white h-24" />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 border-slate-600 text-slate-300 bg-transparent">Anuluj</Button>
            <Button onClick={handleSubmit} disabled={sending || !reason} className="flex-1 bg-red-600 hover:bg-red-700">
              {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Flag className="w-4 h-4 mr-2" />}
              Wyślij zgłoszenie
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}