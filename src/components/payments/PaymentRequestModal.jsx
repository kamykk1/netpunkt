import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, DollarSign, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

const MIN_WITHDRAWAL = 500; // $5.00 in cents

export default function PaymentRequestModal({ isOpen, onClose, onSubmit, currentBalance, isLoading }) {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [error, setError] = useState('');

  const formatCurrency = (cents) => `$${(cents / 100).toFixed(2)}`;
  const amountInCents = Math.round(parseFloat(amount || 0) * 100);

  const handleSubmit = () => {
    setError('');
    
    if (!amount || amountInCents <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (amountInCents < MIN_WITHDRAWAL) {
      setError(`Minimum withdrawal is ${formatCurrency(MIN_WITHDRAWAL)}`);
      return;
    }
    
    if (amountInCents > currentBalance) {
      setError('Insufficient balance');
      return;
    }
    
    if (!paymentDetails.trim()) {
      setError('Please enter your payment details');
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
      case 'paypal': return 'Enter your PayPal email';
      case 'bank_transfer': return 'Enter your bank account details';
      case 'crypto': return 'Enter your crypto wallet address';
      default: return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Request Payment</DialogTitle>
          <DialogDescription>
            Available balance: <span className="font-semibold text-emerald-600">{formatCurrency(currentBalance)}</span>
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
            <Label htmlFor="amount">Amount ($)</Label>
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
            <p className="text-xs text-slate-500">Minimum withdrawal: {formatCurrency(MIN_WITHDRAWAL)}</p>
          </div>

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="crypto">Cryptocurrency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Payment Details</Label>
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
            Request Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}