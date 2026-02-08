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
import { 
  FileText, Search, Plus, Download, Eye, Loader2,
  Calendar, DollarSign, Building, User, CheckCircle,
  XCircle, Clock, Send
} from 'lucide-react';

export default function AdminInvoices() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    user_email: '',
    invoice_type: 'b2c',
    items: '',
    total: 0,
    vat_amount: 0
  });
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list('-created_date', 100)
  });

  const { data: users = [] } = useQuery({
    queryKey: ['allUsersForInvoice'],
    queryFn: () => base44.entities.User.list('-created_date', 100)
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (data) => {
      const invoiceNumber = `FV/${new Date().getFullYear()}/${String(invoices.length + 1).padStart(5, '0')}`;
      const user = users.find(u => u.email === data.user_email);
      
      return base44.entities.Invoice.create({
        ...data,
        invoice_number: invoiceNumber,
        user_id: user?.id,
        status: 'issued',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Faktura utworzona!');
      setShowModal(false);
      resetForm();
    }
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Invoice.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Status faktury zaktualizowany!');
    }
  });

  const resetForm = () => {
    setNewInvoice({
      user_email: '',
      invoice_type: 'b2c',
      items: '',
      total: 0,
      vat_amount: 0
    });
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = !searchQuery || 
      inv.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.user_email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: invoices.length,
    issued: invoices.filter(i => i.status === 'issued').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    totalValue: invoices.reduce((sum, i) => sum + (i.total || 0), 0)
  };

  const statusConfig = {
    draft: { color: 'bg-slate-500/20 text-slate-400', icon: FileText, label: 'Szkic' },
    issued: { color: 'bg-blue-500/20 text-blue-400', icon: Send, label: 'Wystawiona' },
    paid: { color: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle, label: 'Opłacona' },
    cancelled: { color: 'bg-red-500/20 text-red-400', icon: XCircle, label: 'Anulowana' },
  };

  const generatePDF = async (invoice) => {
    setGenerating(true);
    // Symulacja generowania PDF
    await new Promise(r => setTimeout(r, 1500));
    toast.success('PDF wygenerowany!');
    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Wszystkie', value: stats.total, icon: FileText, color: 'text-cyan-400' },
          { label: 'Wystawione', value: stats.issued, icon: Send, color: 'text-blue-400' },
          { label: 'Opłacone', value: stats.paid, icon: CheckCircle, color: 'text-emerald-400' },
          { label: 'Wartość', value: `${(stats.totalValue / 100).toFixed(0)} zł`, icon: DollarSign, color: 'text-purple-400' },
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

      {/* Invoices List */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              Faktury
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Szukaj..."
                  className="pl-10 w-48 bg-slate-800 border-purple-500/30 text-white"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 bg-slate-800 border-purple-500/30 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-purple-500/30">
                  <SelectItem value="all">Wszystkie</SelectItem>
                  <SelectItem value="issued">Wystawione</SelectItem>
                  <SelectItem value="paid">Opłacone</SelectItem>
                  <SelectItem value="cancelled">Anulowane</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => setShowModal(true)}
                className="bg-purple-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nowa faktura
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : filteredInvoices.length > 0 ? (
            <div className="space-y-3">
              {filteredInvoices.map((invoice) => {
                const config = statusConfig[invoice.status] || statusConfig.draft;
                const Icon = config.icon;
                
                return (
                  <div 
                    key={invoice.id}
                    className="p-4 rounded-xl bg-slate-800/50 border border-purple-500/20"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-white font-semibold">{invoice.invoice_number || 'FV/---'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-slate-400 text-sm">{invoice.user_email}</span>
                            <Badge className={invoice.invoice_type === 'b2b' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-500/20 text-slate-400'}>
                              {invoice.invoice_type === 'b2b' ? <Building className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
                              {invoice.invoice_type?.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xl font-bold text-white">{((invoice.total || 0) / 100).toFixed(2)} zł</p>
                          <p className="text-slate-400 text-xs">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {invoice.issue_date || 'Brak daty'}
                          </p>
                        </div>
                        
                        <Badge className={config.color}>
                          <Icon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                        
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generatePDF(invoice)}
                            disabled={generating}
                            className="border-purple-500/30 text-purple-400"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          {invoice.status === 'issued' && (
                            <Button
                              size="sm"
                              onClick={() => updateInvoiceMutation.mutate({ id: invoice.id, status: 'paid' })}
                              className="bg-emerald-600"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Brak faktur</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Invoice Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-[#1a1a2e] border-purple-500/30 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Nowa faktura</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Użytkownik</Label>
              <Select 
                value={newInvoice.user_email} 
                onValueChange={(v) => setNewInvoice({...newInvoice, user_email: v})}
              >
                <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white">
                  <SelectValue placeholder="Wybierz użytkownika" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-purple-500/30 max-h-60">
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.email}>{u.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">Typ faktury</Label>
              <Select 
                value={newInvoice.invoice_type} 
                onValueChange={(v) => setNewInvoice({...newInvoice, invoice_type: v})}
              >
                <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-purple-500/30">
                  <SelectItem value="b2c">B2C (osoba prywatna)</SelectItem>
                  <SelectItem value="b2b">B2B (firma)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Kwota netto (grosze)</Label>
                <Input
                  type="number"
                  value={newInvoice.total}
                  onChange={(e) => {
                    const total = parseInt(e.target.value) || 0;
                    setNewInvoice({...newInvoice, total, vat_amount: Math.round(total * 0.23)});
                  }}
                  className="bg-slate-800 border-purple-500/30 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">VAT (23%)</Label>
                <Input
                  type="number"
                  value={newInvoice.vat_amount}
                  readOnly
                  className="bg-slate-800 border-purple-500/30 text-white"
                />
              </div>
            </div>
            
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <p className="text-slate-400 text-sm">Suma brutto</p>
              <p className="text-2xl font-bold text-white">
                {((newInvoice.total + newInvoice.vat_amount) / 100).toFixed(2)} zł
              </p>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => { setShowModal(false); resetForm(); }}
                className="flex-1 border-slate-600"
              >
                Anuluj
              </Button>
              <Button
                onClick={() => createInvoiceMutation.mutate(newInvoice)}
                disabled={!newInvoice.user_email || createInvoiceMutation.isPending}
                className="flex-1 bg-purple-600"
              >
                {createInvoiceMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Wystaw fakturę
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}