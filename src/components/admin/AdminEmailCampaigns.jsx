import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Mail, Plus, Send, Pause, Play, Eye, MousePointer, 
  Loader2, Pencil, Trash2, Users
} from 'lucide-react';

export default function AdminEmailCampaigns() {
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    content: '',
    points_reward: '',
  });
  const queryClient = useQueryClient();

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['emailCampaigns'],
    queryFn: () => base44.entities.EmailCampaign.list('-created_date')
  });

  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.EmailCampaign.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailCampaigns'] });
      setShowForm(false);
      resetForm();
      toast.success('Kampania utworzona!');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EmailCampaign.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailCampaigns'] });
      setShowForm(false);
      setEditingCampaign(null);
      resetForm();
      toast.success('Kampania zaktualizowana!');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EmailCampaign.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailCampaigns'] });
      toast.success('Kampania usunięta!');
    }
  });

  const sendMutation = useMutation({
    mutationFn: async (campaign) => {
      // Symulacja wysyłki - w produkcji użyj prawdziwego API
      await base44.entities.EmailCampaign.update(campaign.id, {
        status: 'sending',
        total_recipients: users.length
      });
      
      // Wyślij do każdego użytkownika
      for (const user of users) {
        await base44.entities.EmailRead.create({
          user_id: user.id,
          campaign_id: campaign.id,
          opened: false,
          clicked: false,
          points_claimed: false
        });
        
        // Wyślij email (w produkcji)
        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: campaign.subject,
          body: campaign.content
        });
      }
      
      await base44.entities.EmailCampaign.update(campaign.id, {
        status: 'sent',
        sent_count: users.length
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailCampaigns'] });
      toast.success('Kampania wysłana!');
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      subject: '',
      content: '',
      points_reward: '',
    });
  };

  const handleEdit = (campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      title: campaign.title,
      subject: campaign.subject,
      content: campaign.content,
      points_reward: campaign.points_reward,
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      points_reward: parseInt(formData.points_reward) || 0,
      status: 'draft'
    };
    
    if (editingCampaign) {
      updateMutation.mutate({ id: editingCampaign.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const statusColors = {
    draft: 'bg-slate-500/20 text-slate-400',
    scheduled: 'bg-blue-500/20 text-blue-400',
    sending: 'bg-amber-500/20 text-amber-400',
    sent: 'bg-emerald-500/20 text-emerald-400',
    paused: 'bg-red-500/20 text-red-400',
  };

  const statusLabels = {
    draft: 'Szkic',
    scheduled: 'Zaplanowana',
    sending: 'Wysyłanie...',
    sent: 'Wysłana',
    paused: 'Wstrzymana',
  };

  return (
    <div className="space-y-6">
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-cyan-400" />
            Kampanie Email
          </CardTitle>
          <Button
            onClick={() => { setEditingCampaign(null); resetForm(); setShowForm(true); }}
            className="bg-gradient-to-r from-purple-600 to-cyan-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nowa kampania
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : campaigns.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-purple-500/20">
                    <TableHead className="text-slate-400">Tytuł</TableHead>
                    <TableHead className="text-slate-400">Punkty</TableHead>
                    <TableHead className="text-slate-400">Wysłano</TableHead>
                    <TableHead className="text-slate-400">Otwarte</TableHead>
                    <TableHead className="text-slate-400">Kliknięcia</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.id} className="border-purple-500/20">
                      <TableCell className="text-white font-medium">{campaign.title}</TableCell>
                      <TableCell className="text-yellow-400">{campaign.points_reward} pkt</TableCell>
                      <TableCell className="text-slate-300">{campaign.sent_count || 0}</TableCell>
                      <TableCell className="text-slate-300">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" /> {campaign.opened_count || 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        <span className="flex items-center gap-1">
                          <MousePointer className="w-4 h-4" /> {campaign.clicked_count || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[campaign.status]}>
                          {statusLabels[campaign.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {campaign.status === 'draft' && (
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => sendMutation.mutate(campaign)}
                              disabled={sendMutation.isPending}
                            >
                              {sendMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-purple-500/30 text-white"
                            onClick={() => handleEdit(campaign)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500/30 text-red-400"
                            onClick={() => deleteMutation.mutate(campaign.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Brak kampanii email</p>
              <p className="text-sm">Utwórz pierwszą kampanię, aby wysyłać punktowane maile</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg bg-[#1a1a2e] border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingCampaign ? 'Edytuj kampanię' : 'Nowa kampania email'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Użytkownicy otrzymają punkty za przeczytanie wiadomości.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Tytuł kampanii *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                className="bg-slate-800 border-purple-500/30 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Temat emaila *</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData(p => ({ ...p, subject: e.target.value }))}
                className="bg-slate-800 border-purple-500/30 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Treść (HTML) *</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData(p => ({ ...p, content: e.target.value }))}
                className="bg-slate-800 border-purple-500/30 text-white"
                rows={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Nagroda (punkty) *</Label>
              <Input
                type="number"
                min="1"
                value={formData.points_reward}
                onChange={(e) => setFormData(p => ({ ...p, points_reward: e.target.value }))}
                className="bg-slate-800 border-purple-500/30 text-white"
                required
              />
            </div>

            <div className="p-3 rounded-lg bg-slate-800/50 border border-purple-500/20">
              <p className="text-slate-400 text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                Kampania zostanie wysłana do {users.length} użytkowników
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowForm(false)} 
                className="flex-1 border-purple-500/30 text-white"
              >
                Anuluj
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                )}
                {editingCampaign ? 'Zapisz' : 'Utwórz'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}