import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  CreditCard, Plus, FileText, Download, Loader2, 
  CheckCircle, Clock, XCircle 
} from 'lucide-react';

export default function AdvertiserBilling({ user }) {
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['advertiserInvoices', user?.id],
    queryFn: () => base44.entities.Invoice.filter({ user_id: user?.id }, '-created_date'),
    enabled: !!user?.id
  });

  const topUpMutation = useMutation({
    mutationFn: async (amount) => {
      // Symulacja doładowania - w produkcji integracja z Stripe/PayPal/TPay
      const amountGrosze = Math.round(parseFloat(amount) * 100);
      
      await base44.auth.updateMe({
        advertiser_balance: (user.advertiser_balance || 0) + amountGrosze
      });

      await base44.entities.Invoice.create({
        user_id: user.id,
        user_email: user.email,
        invoice_type: user.company_nip ? 'b2b' : 'b2c',
        company_name: user.advertiser_company_name,
        company_nip: user.advertiser_nip,
        company_address: user.advertiser_address,
        items: JSON.stringify([{ name: 'Doładowanie konta reklamodawcy', qty: 1, price: amountGrosze }]),
        subtotal: amountGrosze,
        vat_amount: Math.round(amountGrosze * 0.23),
        total: Math.round(amountGrosze * 1.23),
        status: 'paid',
        payment_method: 'online',
        issue_date: new Date().toISOString().split('T')[0]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['advertiserInvoices'] });
      setShowTopUp(false);
      setTopUpAmount('');
      toast.success('Konto doładowane!');
    }
  });

  const statusConfig = {
    draft: { color: 'bg-slate-500/20 text-slate-400', label: 'Szkic' },
    issued: { color: 'bg-blue-500/20 text-blue-400', label: 'Wystawiona' },
    paid: { color: 'bg-emerald-500/20 text-emerald-400', label: 'Opłacona' },
    cancelled: { color: 'bg-red-500/20 text-red-400', label: 'Anulowana' },
  };

  return (
    <div className="space-y-6">
      {/* Balance & Top Up */}
      <Card className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border-purple-500/30">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-slate-400 mb-1">Saldo konta reklamodawcy</p>
              <p className="text-4xl font-bold text-white">
                {((user?.advertiser_balance || 0) / 100).toFixed(2)} zł
              </p>
            </div>
            <Button
              onClick={() => setShowTopUp(true)}
              className="bg-gradient-to-r from-purple-600 to-cyan-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Doładuj konto
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Company Data */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white">Dane do faktur</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-400">Nazwa firmy</Label>
              <p className="text-white">{user?.advertiser_company_name || '—'}</p>
            </div>
            <div>
              <Label className="text-slate-400">NIP</Label>
              <p className="text-white">{user?.advertiser_nip || '—'}</p>
            </div>
            <div className="md:col-span-2">
              <Label className="text-slate-400">Adres</Label>
              <p className="text-white">{user?.advertiser_address || '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Historia faktur
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : invoices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-purple-500/20">
                  <TableHead className="text-slate-400">Nr faktury</TableHead>
                  <TableHead className="text-slate-400">Data</TableHead>
                  <TableHead className="text-slate-400">Kwota netto</TableHead>
                  <TableHead className="text-slate-400">VAT</TableHead>
                  <TableHead className="text-slate-400">Brutto</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => {
                  const config = statusConfig[inv.status] || statusConfig.draft;
                  return (
                    <TableRow key={inv.id} className="border-purple-500/20">
                      <TableCell className="text-white">{inv.invoice_number || `FV/${inv.id.slice(0, 8)}`}</TableCell>
                      <TableCell className="text-slate-300">
                        {inv.issue_date || new Date(inv.created_date).toLocaleDateString('pl-PL')}
                      </TableCell>
                      <TableCell className="text-white">{((inv.subtotal || 0) / 100).toFixed(2)} zł</TableCell>
                      <TableCell className="text-slate-400">{((inv.vat_amount || 0) / 100).toFixed(2)} zł</TableCell>
                      <TableCell className="text-emerald-400 font-bold">{((inv.total || 0) / 100).toFixed(2)} zł</TableCell>
                      <TableCell>
                        <Badge className={config.color}>{config.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {inv.pdf_url && (
                          <Button size="sm" variant="outline" className="border-purple-500/30 text-white">
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Brak faktur</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Up Modal */}
      <Dialog open={showTopUp} onOpenChange={setShowTopUp}>
        <DialogContent className="sm:max-w-md bg-[#1a1a2e] border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="text-white">Doładuj konto</DialogTitle>
            <DialogDescription className="text-slate-400">
              Wybierz kwotę doładowania
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-2">
              {[50, 100, 200, 500, 1000, 2000].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  className={`border-purple-500/30 ${topUpAmount === amount.toString() ? 'bg-purple-500/20 border-purple-500' : ''} text-white`}
                  onClick={() => setTopUpAmount(amount.toString())}
                >
                  {amount} zł
                </Button>
              ))}
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Lub wpisz kwotę</Label>
              <Input
                type="number"
                min="10"
                step="0.01"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                className="bg-slate-800 border-purple-500/30 text-white"
                placeholder="Kwota w zł"
              />
            </div>
            <Button
              onClick={() => topUpMutation.mutate(topUpAmount)}
              disabled={!topUpAmount || parseFloat(topUpAmount) < 10 || topUpMutation.isPending}
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-600"
            >
              {topUpMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CreditCard className="w-4 h-4 mr-2" />
              )}
              Doładuj {topUpAmount ? `${topUpAmount} zł` : ''}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}