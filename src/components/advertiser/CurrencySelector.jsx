import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, RefreshCw } from 'lucide-react';

export const CURRENCIES = {
  PLN: { symbol: 'zł', rate: 1, flag: '🇵🇱' },
  EUR: { symbol: '€', rate: 0.23, flag: '🇪🇺' },
  USD: { symbol: '$', rate: 0.25, flag: '🇺🇸' },
  GBP: { symbol: '£', rate: 0.20, flag: '🇬🇧' },
  CZK: { symbol: 'Kč', rate: 5.7, flag: '🇨🇿' },
};

export const convertFromPLN = (amountPLN, currency) => {
  const cur = CURRENCIES[currency] || CURRENCIES.PLN;
  return (amountPLN * cur.rate).toFixed(2);
};

export const convertToPLN = (amount, currency) => {
  const cur = CURRENCIES[currency] || CURRENCIES.PLN;
  return amount / cur.rate;
};

export const formatCurrency = (amountPLN, currency) => {
  const cur = CURRENCIES[currency] || CURRENCIES.PLN;
  const converted = convertFromPLN(amountPLN, currency);
  return `${converted} ${cur.symbol}`;
};

export function CurrencySelector({ value, onChange }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-28 bg-slate-800 border-purple-500/30 text-white">
        <Globe className="w-3 h-3 mr-1" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-[#1a1a2e] border-purple-500/30">
        {Object.entries(CURRENCIES).map(([code, cur]) => (
          <SelectItem key={code} value={code}>
            {cur.flag} {code}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ExchangeRatesTable() {
  const baseCurrency = 'PLN';
  const lastUpdate = new Date().toLocaleDateString('pl-PL');

  return (
    <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white flex items-center gap-2">
          <Globe className="w-5 h-5 text-cyan-400" />
          Kursy walut
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-xs">Aktualizacja: {lastUpdate}</span>
          <RefreshCw className="w-4 h-4 text-slate-400" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Object.entries(CURRENCIES).filter(([code]) => code !== 'PLN').map(([code, cur]) => (
            <div key={code} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-purple-500/10">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cur.flag}</span>
                <div>
                  <p className="text-white font-semibold">{code}</p>
                  <p className="text-slate-400 text-xs">{cur.symbol}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-bold">1 PLN = {cur.rate} {code}</p>
                <p className="text-slate-400 text-xs">1 {code} = {(1 / cur.rate).toFixed(4)} PLN</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-slate-500 text-xs mt-4 text-center">
          * Kursy orientacyjne. W produkcji pobierane z API NBP/ECB.
        </p>
      </CardContent>
    </Card>
  );
}