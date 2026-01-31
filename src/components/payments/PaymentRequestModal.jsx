import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, DollarSign, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

const MIN_WITHDRAWAL = 500; // 5.00 zł w groszach

export default function PaymentRequestModal({ isOpen, onClose, onSubmit, currentBalance, isLoading }) {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [error, setError] = useState('');

  const formatCurrency = (cents) => `${(cents / 100).toFixed(2)} zł`;
  const amountInCents = Math.round(parseFloat(amount || 0) * 100);

  const handleSubmit = () => {
    setError('');
    
    if (!amount || amountInCents <= 0) {
      setError('Podaj prawidłową kwotę');
      return;
    }
    
    if (amountInCents < MIN_WITHDRAWAL) {
      setError(`Minimalna wypłata to ${formatCurrency(MIN_WITHDRAWAL)}`);
      return;
    }
    
    if (amountInCents > currentBalance) {
      setError('Niewystarczające środki');
      return;
    }
    
    if (!paymentDetails.trim()) {
      setError('Podaj dane do wypłaty');
      return;
    }

    onSubmit({
      amount: amountInCents,
      payment_method: paymentMethod,
      payment_details: paymentDetails.trim()
    });
  };

  const getPaymentPlaceholder = () => {
    switch (paymentMethod) {
      case 'paypal': return 'Podaj email PayPal';
      case 'bank_transfer': return 'Podaj numer konta bankowego';
      case 'crypto': return 'Podaj adres portfela krypto';
      default: return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Wniosek o wypłatę</DialogTitle>
          <DialogDescription>
            Dostępne saldo: <span className="font-semibold text-emerald-600">{formatCurrency(currentBalance)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">Kwota (zł)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-9"
              />
            </div>
            <p className="text-xs text-slate-500">Minimalna wypłata: {formatCurrency(MIN_WITHDRAWAL)}</p>
          </div>

          <div className="space-y-2">
            <Label>Metoda płatności</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="bank_transfer">Przelew bankowy</SelectItem>
                <SelectItem value="crypto">Kryptowaluta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Dane do wypłaty</Label>
            <Input
              id="details"
              placeholder={getPaymentPlaceholder()}
              value={paymentDetails}
              onChange={(e) => setPaymentDetails(e.target.value)}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Złóż wniosek
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}