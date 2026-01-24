import React from 'react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2 } from 'lucide-react';

const statusConfig = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700',
  paid: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700'
};

export default function PaymentRequestsTable({ requests, onApprove, onReject, onMarkPaid, isLoading }) {
  const formatCurrency = (cents) => `$${(cents / 100).toFixed(2)}`;

  if (!requests || requests.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p>No payment requests</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Details</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{request.user_name || 'Unknown'}</p>
                  <p className="text-sm text-slate-500">{request.user_email}</p>
                </div>
              </TableCell>
              <TableCell className="font-semibold">{formatCurrency(request.amount)}</TableCell>
              <TableCell className="capitalize">{request.payment_method?.replace('_', ' ')}</TableCell>
              <TableCell className="max-w-[200px] truncate">{request.payment_details}</TableCell>
              <TableCell>{format(new Date(request.created_date), 'MMM d, yyyy')}</TableCell>
              <TableCell>
                <Badge className={statusConfig[request.status]}>{request.status}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {request.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onApprove(request)}
                        disabled={isLoading}
                        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onReject(request)}
                        disabled={isLoading}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  {request.status === 'approved' && (
                    <Button
                      size="sm"
                      onClick={() => onMarkPaid(request)}
                      disabled={isLoading}
                      className="bg-emerald-500 hover:bg-emerald-600"
                    >
                      Mark Paid
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}