import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  CreditCard, Send, Calendar, CheckCircle, Clock, XCircle,
  Loader2, Banknote, AlertCircle, FileText
} from 'lucide-react';

export default function AdminPayoutSchedule({ paymentRequests, users }) {
  const [selectedPayouts, setSelectedPayouts] = useState([]);
  const [showBulkPayout, setShowBulkPayout] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [transferDate, setTransferDate] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const queryClient = useQueryClient();

  const pendingPayouts = paymentRequests.filter(p => p.status === 'approved');
  const pendingTotal = pendingPayouts.reduce((sum, p) => sum + (p.amount || 0), 0);

  const markAsPaidMutation = useMutation({
    mutationFn: async ({ id, transferDate, note }) => {
      await base44.entities.PaymentRequest.update(id, {
        status: 'paid',
        processed_date: new Date().toISOString(),
        admin_notes: note || `Przelew wysłany: ${transferDate}`
      });

      // Wyślij email z powiadomieniem
      const payout = paymentRequests.find(p => p.id === id);
      if (payout) {
        await base44.integrations.Core.SendEmail({
          to: payout.user_email,
          subject: 'Wypłata zrealizowana - Zapunktowani.eu',
          body: `
            <h2>Twoja wypłata została zrealizowana!</h2>
            <p>Szczegóły:</p>
            <ul>
              <li>Kwota: ${payout.amount} punktów</li>
              <li>Metoda: ${payout.payment_method}</li>
              <li>Data przelewu: ${transferDate}</li>
            </ul>
            <p>Środki powinny pojawić się na Twoim koncie w ciągu 1-3 dni roboczych.</p>
            <p>Dziękujemy za korzystanie z Zapunktowani.eu!</p>
          `
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPayments'] });
      setProcessingId(null);
      setTransferDate('');
      setTransferNote('');
      toast.success('Wypłata oznaczona jako zrealizowana!');
    }
  });

  const bulkPayoutMutation = useMutation({
    mutationFn: async ({ ids, transferDate }) => {
      for (const id of ids) {
        await base44.entities.PaymentRequest.update(id, {
          status: 'paid',
          processed_date: new Date().toISOString(),
          admin_notes: `Przelew zbiorczy: ${transferDate}`
        });

        const payout = paymentRequests.find(p => p.id === id);
        if (payout) {
          await base44.integrations.Core.SendEmail({
            to: payout.user_email,
            subject: 'Wypłata zrealizowana - Zapunktowani.eu',
            body: `
              <h2>Twoja wypłata została zrealizowana!</h2>
              <p>Kwota: ${payout.amount} punktów</p>
              <p>Data przelewu: ${transferDate}</p>
            `
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPayments'] });
      setShowBulkPayout(false);
      setSelectedPayouts([]);
      setTransferDate('');
      toast.success(`${selectedPayouts.length} wypłat oznaczonych jako zrealizowane!`);
    }
  });

  const toggleSelection = (id) => {
    setSelectedPayouts(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedPayouts.length === pendingPayouts.length) {
      setSelectedPayouts([]);
    } else {
      setSelectedPayouts(pendingPayouts.map(p => p.id));
    }
  };

  const getUserData = (userId) => users.find(u => u.id === userId) || {};

  const statusConfig = {
    pending: { color: 'bg-amber-500/20 text-amber-400', icon: Clock, label: 'Oczekuje' },
    approved: { color: 'bg-blue-500/20 text-blue-400', icon: CheckCircle, label: 'Zatwierdzona' },
    paid: { color: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle, label: 'Wypłacona' },
    rejected: { color: 'bg-red-500/20 text-red-400', icon: XCircle, label: 'Odrzucona' },
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border-purple-500/30">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-slate-400 mb-1">Zatwierdzone do wypłaty</p>
              <p className="text-4xl font-bold text-white">{pendingPayouts.length} wniosków</p>
              <p className="text-emerald-400">Łącznie: {pendingTotal.toLocaleString()} pkt</p>
            </div>
            {pendingPayouts.length > 0 && (
              <Button
                onClick={() => setShowBulkPayout(true)}
                disabled={selectedPayouts.length === 0}
                className="bg-gradient-to-r from-purple-600 to-cyan-600"
              >
                <Send className="w-4 h-4 mr-2" />
                Zbiorcza wypłata ({selectedPayouts.length})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Approved Payouts */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Banknote className="w-5 h-5 text-emerald-400" />
            Zatwierdzone wypłaty
          </CardTitle>
          {pendingPayouts.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="border-purple-500/30 text-white"
              onClick={selectAll}
            >
              {selectedPayouts.length === pendingPayouts.length ? 'Odznacz wszystko' : 'Zaznacz wszystko'}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {pendingPayouts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-purple-500/20">
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="text-slate-400">Użytkownik</TableHead>
                  <TableHead className="text-slate-400">Punkty</TableHead>
                  <TableHead className="text-slate-400">Metoda</TableHead>
                  <TableHead className="text-slate-400">Dane do przelewu</TableHead>
                  <TableHead className="text-slate-400">Data wniosku</TableHead>
                  <TableHead className="text-slate-400">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPayouts.map((payout) => {
                  const userData = getUserData(payout.user_id);
                  return (
                    <TableRow key={payout.id} className="border-purple-500/20">
                      <TableCell>
                        <Checkbox
                          checked={selectedPayouts.includes(payout.id)}
                          onCheckedChange={() => toggleSelection(payout.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <p className="text-white font-medium">{payout.user_name || userData.full_name}</p>
                        <p className="text-slate-400 text-xs">{payout.user_email}</p>
                      </TableCell>
                      <TableCell className="text-yellow-400 font-bold">{payout.amount}</TableCell>
                      <TableCell className="text-slate-300 capitalize">{payout.payment_method}</TableCell>
                      <TableCell className="text-slate-300 max-w-xs">
                        <p className="truncate text-xs font-mono">{payout.payment_details}</p>
                        {userData.bank_account_number && payout.payment_method === 'bank_transfer' && (
                          <p className="text-purple-400 text-xs mt-1">
                            Konto: {userData.bank_account_number}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">
                        {new Date(payout.created_date).toLocaleDateString('pl-PL')}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => setProcessingId(payout.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Wypłać
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Brak zatwierdzonych wypłat do realizacji</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Payouts History */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            Historia wypłat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-purple-500/20">
                <TableHead className="text-slate-400">Użytkownik</TableHead>
                <TableHead className="text-slate-400">Punkty</TableHead>
                <TableHead className="text-slate-400">Metoda</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Data przelewu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentRequests.filter(p => p.status === 'paid').slice(0, 10).map((payout) => {
                const config = statusConfig[payout.status];
                return (
                  <TableRow key={payout.id} className="border-purple-500/20">
                    <TableCell className="text-white">{payout.user_email}</TableCell>
                    <TableCell className="text-yellow-400">{payout.amount}</TableCell>
                    <TableCell className="text-slate-300 capitalize">{payout.payment_method}</TableCell>
                    <TableCell>
                      <Badge className={config.color}>{config.label}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {payout.processed_date 
                        ? new Date(payout.processed_date).toLocaleDateString('pl-PL')
                        : '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Single Payout Modal */}
      <Dialog open={!!processingId} onOpenChange={() => setProcessingId(null)}>
        <DialogContent className="sm:max-w-md bg-[#1a1a2e] border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="text-white">Potwierdź wypłatę</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-slate-300 text-sm">Data przelewu *</label>
              <Input
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                className="bg-slate-800 border-purple-500/30 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-slate-300 text-sm">Notatka (opcjonalna)</label>
              <Input
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                className="bg-slate-800 border-purple-500/30 text-white"
                placeholder="np. numer referencyjny"
              />
            </div>
            <Button
              onClick={() => markAsPaidMutation.mutate({ id: processingId, transferDate, note: transferNote })}
              disabled={!transferDate || markAsPaidMutation.isPending}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600"
            >
              {markAsPaidMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Oznacz jako wypłacone
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Payout Modal */}
      <Dialog open={showBulkPayout} onOpenChange={setShowBulkPayout}>
        <DialogContent className="sm:max-w-md bg-[#1a1a2e] border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="text-white">Zbiorcza wypłata</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <p className="text-white font-medium">{selectedPayouts.length} wypłat</p>
              <p className="text-slate-400 text-sm">
                Łącznie: {pendingPayouts.filter(p => selectedPayouts.includes(p.id)).reduce((sum, p) => sum + p.amount, 0).toLocaleString()} pkt
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-slate-300 text-sm">Data przelewu zbiorczego *</label>
              <Input
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                className="bg-slate-800 border-purple-500/30 text-white"
              />
            </div>
            <Button
              onClick={() => bulkPayoutMutation.mutate({ ids: selectedPayouts, transferDate })}
              disabled={!transferDate || bulkPayoutMutation.isPending}
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-600"
            >
              {bulkPayoutMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Oznacz wszystkie jako wypłacone
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}