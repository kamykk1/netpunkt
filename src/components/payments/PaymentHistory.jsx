import React from 'react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const statusConfig = {
  pending: { color: 'bg-amber-100 text-amber-700', icon: Clock, label: 'Oczekuje' },
  approved: { color: 'bg-blue-100 text-blue-700', icon: Loader2, label: 'Zatwierdzony' },
  paid: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2, label: 'Wypłacony' },
  rejected: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Odrzucony' }
};

export default function PaymentHistory({ payments }) {
  const formatCurrency = (cents) => `${(cents / 100).toFixed(2)} zł`;

  if (!payments || payments.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p>Brak wniosków o wypłatę</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((payment) => {
        const config = statusConfig[payment.status] || statusConfig.pending;
        const Icon = config.icon;
        
        return (
          <div
            key={payment.id}
            className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-lg ${config.color.split(' ')[0]}`}>
                <Icon className={`w-5 h-5 ${config.color.split(' ')[1]}`} />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{formatCurrency(payment.amount)}</p>
                <p className="text-sm text-slate-500">
                  {payment.payment_method === 'paypal' ? 'PayPal' : 
                   payment.payment_method === 'bank_transfer' ? 'Przelew bankowy' : 'Krypto'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge className={config.color}>{config.label}</Badge>
              <p className="text-xs text-slate-400 mt-1">
                {format(new Date(payment.created_date), 'd MMM yyyy', { locale: pl })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}