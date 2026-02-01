import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { 
  CreditCard, Coins, Wallet, Clock, CheckCircle, XCircle,
  Loader2, ArrowRight, AlertCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const PAYMENT_METHODS = [
  { value: 'paypal', label: 'PayPal', icon: '💳' },
  { value: 'bank_transfer', label: 'Przelew bankowy', icon: '🏦' },
  { value: 'tpay', label: 'TPay', icon: '💰' },
  { value: 'stripe', label: 'Stripe', icon: '💎' },
  { value: 'faucetpay', label: 'FaucetPay', icon: '🪙' },
];

export default function Payments() {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['myPayments', user?.id],
    queryFn: () => base44.entities.PaymentRequest.filter({ user_id: user?.id }, '-created_date'),
    enabled: !!user?.id
  });

  const { data: settings = [] } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: () => base44.entities.SiteSettings.list()
  });

  const getSetting = (key, defaultValue) => {
    const setting = settings.find(s => s.setting_key === key);
    return setting ? setting.setting_value : defaultValue;
  };

  const pointRate = parseFloat(getSetting('point_rate', '0.10'));
  const minWithdrawal = parseInt(getSetting('min_withdrawal_points', '1000'));

  const withdrawMutation = useMutation({
    mutationFn: async (data) => {
      const newBalance = (user.points_balance || 0) - data.amount;
      
      await base44.entities.PaymentRequest.create({
        user_id: user.id,
        user_email: user.email,
        user_name: user.full_name,
        amount: data.amount,
        payment_method: data.payment_method,
        payment_details: data.payment_details,
        status: 'pending'
      });

      await base44.auth.updateMe({
        points_balance: newBalance,
        total_withdrawn: (user.total_withdrawn || 0) + data.amount
      });

      await base44.entities.PointsHistory.create({
        user_id: user.id,
        user_email: user.email,
        amount: -data.amount,
        balance_after: newBalance,
        type: 'withdrawal',
        description: `Wypłata: ${data.amount} pkt via ${data.payment_method}`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['myPayments'] });
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setPaymentDetails('');
      toast.success('Wniosek o wypłatę został złożony!');
    }
  });

  const handleWithdraw = () => {
    setError('');
    const amount = parseInt(withdrawAmount);

    if (!amount || amount <= 0) {
      setError('Podaj prawidłową ilość punktów');
      return;
    }

    if (amount < minWithdrawal) {
      setError(`Minimalna wypłata to ${minWithdrawal} punktów`);
      return;
    }

    if (amount > (user?.points_balance || 0)) {
      setError('Niewystarczająca ilość punktów');
      return;
    }

    if (!paymentDetails.trim()) {
      setError('Podaj dane do wypłaty');
      return;
    }

    withdrawMutation.mutate({
      amount,
      payment_method: paymentMethod,
      payment_details: paymentDetails.trim()
    });
  };

  const statusConfig = {
    pending: { color: 'bg-amber-500/20 text-amber-400', icon: Clock, label: 'Oczekuje' },
    approved: { color: 'bg-blue-500/20 text-blue-400', icon: CheckCircle, label: 'Zatwierdzony' },
    paid: { color: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle, label: 'Wypłacony' },
    rejected: { color: 'bg-red-500/20 text-red-400', icon: XCircle, label: 'Odrzucony' },
  };

  const cashValue = (user?.points_balance || 0) * pointRate;

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white">Wypłaty</h1>
          <p className="text-slate-400 mt-1">Wymieniaj punkty na prawdziwe pieniądze</p>
        </motion.div>

        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-br from-purple-600/20 to-cyan-600/20 border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <p className="text-slate-400 mb-1">Dostępne punkty</p>
                  <div className="flex items-center gap-3">
                    <Coins className="w-10 h-10 text-yellow-400" />
                    <div>
                      <p className="text-4xl font-bold text-white">{(user?.points_balance || 0).toLocaleString()}</p>
                      <p className="text-emerald-400">≈ {cashValue.toFixed(2)} zł</p>
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm mt-2">1 pkt = {pointRate} zł</p>
                </div>
                <Button
                  onClick={() => setShowWithdrawModal(true)}
                  disabled={(user?.points_balance || 0) < minWithdrawal}
                  className="h-14 px-8 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
                >
                  <Wallet className="w-5 h-5 mr-2" />
                  Wypłać środki
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
              {(user?.points_balance || 0) < minWithdrawal && (
                <p className="text-amber-400 text-sm mt-4">
                  Minimalna wypłata: {minWithdrawal} pkt ({(minWithdrawal * pointRate).toFixed(2)} zł)
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment History */}
        <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-400" />
              Historia wypłat
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              </div>
            ) : payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((payment) => {
                  const config = statusConfig[payment.status] || statusConfig.pending;
                  const Icon = config.icon;
                  
                  return (
                    <motion.div
                      key={payment.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-purple-500/20"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${config.color.split(' ')[0]}`}>
                          <Icon className={`w-5 h-5 ${config.color.split(' ')[1]}`} />
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {payment.amount.toLocaleString()} pkt
                            <span className="text-emerald-400 ml-2">
                              ({(payment.amount * pointRate).toFixed(2)} zł)
                            </span>
                          </p>
                          <p className="text-slate-400 text-sm capitalize">{payment.payment_method}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={config.color}>{config.label}</Badge>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(payment.created_date).toLocaleDateString('pl-PL')}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Brak historii wypłat</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Withdraw Modal */}
      <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
        <DialogContent className="sm:max-w-md bg-[#1a1a2e] border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="text-white">Wypłać środki</DialogTitle>
            <DialogDescription className="text-slate-400">
              Dostępne: {(user?.points_balance || 0).toLocaleString()} pkt ({cashValue.toFixed(2)} zł)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {error && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label className="text-slate-300">Ilość punktów</Label>
              <Input
                type="number"
                min={minWithdrawal}
                max={user?.points_balance || 0}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="bg-slate-800 border-purple-500/30 text-white"
                placeholder={`Min. ${minWithdrawal}`}
              />
              {withdrawAmount && (
                <p className="text-emerald-400 text-sm">
                  = {(parseInt(withdrawAmount || 0) * pointRate).toFixed(2)} zł
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Metoda wypłaty</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-purple-500/30">
                  {PAYMENT_METHODS.map(method => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.icon} {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Dane do wypłaty</Label>
              <Input
                value={paymentDetails}
                onChange={(e) => setPaymentDetails(e.target.value)}
                className="bg-slate-800 border-purple-500/30 text-white"
                placeholder={paymentMethod === 'paypal' ? 'Email PayPal' : 
                             paymentMethod === 'bank_transfer' ? 'Numer konta' :
                             'Adres / ID'}
              />
            </div>

            <Button
              onClick={handleWithdraw}
              disabled={withdrawMutation.isPending}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
            >
              {withdrawMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Wallet className="w-5 h-5 mr-2" />
              )}
              Złóż wniosek o wypłatę
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}