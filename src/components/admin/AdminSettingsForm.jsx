import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Coins, Users, Percent, Zap, CreditCard, Shield, Gamepad2 } from 'lucide-react';

const DEFAULT_SETTINGS = {
  point_rate: '0.10',
  min_withdrawal_points: '1000',
  referral_bonus_percent: '10',
  referral_bonus_level2: '5',
  referral_bonus_level3: '2',
  registration_bonus: '100',
  purchase_points_rate: '0.01',
  event_multiplier: '1',
  event_active: 'false',
  event_name: '',
  max_daily_ads: '50',
  invoices_enabled: 'true',
  vat_rate: '23',
  company_name: 'Zapunktowani.eu',
  company_nip: '',
  company_address: '',
  paypal_enabled: 'true',
  stripe_enabled: 'true',
  tpay_enabled: 'true',
  faucetpay_enabled: 'false',
  bank_transfer_enabled: 'true',
  crypto_enabled: 'false',
  advertiser_fraud_dashboard: 'true',
  payout_schedule: 'weekly',
  games_enabled: 'true',
  games_chat_enabled: 'true',
  quiz_enabled: 'true',
  memory_enabled: 'true',
  minesweeper_enabled: 'true',
  snake_enabled: 'true',
  scratch_enabled: 'true',
};

export default function AdminSettingsForm({ settings }) {
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();

  useEffect(() => {
    const data = { ...DEFAULT_SETTINGS };
    settings.forEach(s => {
      data[s.setting_key] = s.setting_value;
    });
    setFormData(data);
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      for (const [key, value] of Object.entries(data)) {
        const existing = settings.find(s => s.setting_key === key);
        if (existing) {
          await base44.entities.SiteSettings.update(existing.id, { setting_value: String(value) });
        } else {
          await base44.entities.SiteSettings.create({
            setting_key: key,
            setting_value: String(value),
            category: getCategoryForKey(key)
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteSettings'] });
      toast.success('Ustawienia zostały zapisane!');
    }
  });

  const getCategoryForKey = (key) => {
    if (key.includes('point') || key.includes('withdrawal')) return 'points';
    if (key.includes('referral')) return 'referrals';
    if (key.includes('event')) return 'events';
    if (key.includes('invoice') || key.includes('vat') || key.includes('company')) return 'billing';
    if (key.includes('paypal') || key.includes('stripe') || key.includes('tpay') || key.includes('faucet')) return 'payments';
    return 'general';
  };

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Points Settings */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-400" />
            Ustawienia punktów
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Kurs 1 punktu (PLN)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.point_rate || ''}
                onChange={(e) => handleChange('point_rate', e.target.value)}
                className="bg-slate-800 border-purple-500/30 text-white"
              />
              <p className="text-xs text-slate-500">1 pkt = {formData.point_rate} zł</p>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Min. wypłata (punkty)</Label>
              <Input
                type="number"
                min="100"
                value={formData.min_withdrawal_points || ''}
                onChange={(e) => handleChange('min_withdrawal_points', e.target.value)}
                className="bg-slate-800 border-purple-500/30 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Max reklam dziennie</Label>
              <Input
                type="number"
                min="1"
                value={formData.max_daily_ads || ''}
                onChange={(e) => handleChange('max_daily_ads', e.target.value)}
                className="bg-slate-800 border-purple-500/30 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral Settings */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            System poleceń (MLM)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Poziom 1 (%)</Label>
              <Input
                type="number"
                min="0"
                max="50"
                value={formData.referral_bonus_percent || ''}
                onChange={(e) => handleChange('referral_bonus_percent', e.target.value)}
                className="bg-slate-800 border-purple-500/30 text-white"
              />
              <p className="text-xs text-slate-500">Bezpośrednie polecenia</p>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Poziom 2 (%)</Label>
              <Input
                type="number"
                min="0"
                max="30"
                value={formData.referral_bonus_level2 || ''}
                onChange={(e) => handleChange('referral_bonus_level2', e.target.value)}
                className="bg-slate-800 border-purple-500/30 text-white"
              />
              <p className="text-xs text-slate-500">Poleceni przez poleconych</p>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Poziom 3 (%)</Label>
              <Input
                type="number"
                min="0"
                max="20"
                value={formData.referral_bonus_level3 || ''}
                onChange={(e) => handleChange('referral_bonus_level3', e.target.value)}
                className="bg-slate-800 border-purple-500/30 text-white"
              />
              <p className="text-xs text-slate-500">Trzeci poziom sieci</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Bonus za rejestrację (pkt)</Label>
              <Input
                type="number"
                min="0"
                value={formData.registration_bonus || ''}
                onChange={(e) => handleChange('registration_bonus', e.target.value)}
                className="bg-slate-800 border-purple-500/30 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Punkty za zakupy (pkt/zł)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.purchase_points_rate || ''}
                onChange={(e) => handleChange('purchase_points_rate', e.target.value)}
                className="bg-slate-800 border-purple-500/30 text-white"
              />
              <p className="text-xs text-slate-500">np. 0.01 = 1 pkt za 100 zł</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Settings */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Eventy i mnożniki
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-slate-300">Event aktywny</Label>
              <p className="text-xs text-slate-500">Włącz specjalny event z mnożnikiem punktów</p>
            </div>
            <Switch
              checked={formData.event_active === 'true'}
              onCheckedChange={(checked) => handleChange('event_active', String(checked))}
            />
          </div>
          {formData.event_active === 'true' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Nazwa eventu</Label>
                <Input
                  value={formData.event_name || ''}
                  onChange={(e) => handleChange('event_name', e.target.value)}
                  className="bg-slate-800 border-purple-500/30 text-white"
                  placeholder="np. Weekendowe x2"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Mnożnik punktów</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="1"
                  max="10"
                  value={formData.event_multiplier || ''}
                  onChange={(e) => handleChange('event_multiplier', e.target.value)}
                  className="bg-slate-800 border-purple-500/30 text-white"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            Metody wypłat
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-purple-500/20">
              <span className="text-slate-300">🏦 Przelew bankowy</span>
              <Switch
                checked={formData.bank_transfer_enabled === 'true'}
                onCheckedChange={(checked) => handleChange('bank_transfer_enabled', String(checked))}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-purple-500/20">
              <span className="text-slate-300">💳 PayPal</span>
              <Switch
                checked={formData.paypal_enabled === 'true'}
                onCheckedChange={(checked) => handleChange('paypal_enabled', String(checked))}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-purple-500/20">
              <span className="text-slate-300">💎 Stripe</span>
              <Switch
                checked={formData.stripe_enabled === 'true'}
                onCheckedChange={(checked) => handleChange('stripe_enabled', String(checked))}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-purple-500/20">
              <span className="text-slate-300">💰 TPay</span>
              <Switch
                checked={formData.tpay_enabled === 'true'}
                onCheckedChange={(checked) => handleChange('tpay_enabled', String(checked))}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-purple-500/20">
              <span className="text-slate-300">🪙 FaucetPay</span>
              <Switch
                checked={formData.faucetpay_enabled === 'true'}
                onCheckedChange={(checked) => handleChange('faucetpay_enabled', String(checked))}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-purple-500/20">
              <span className="text-slate-300">₿ Krypto</span>
              <Switch
                checked={formData.crypto_enabled === 'true'}
                onCheckedChange={(checked) => handleChange('crypto_enabled', String(checked))}
              />
            </div>
          </div>
          <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Harmonogram wypłat</p>
                <p className="text-slate-400 text-sm">Automatyczne przetwarzanie wniosków</p>
              </div>
              <select
                value={formData.payout_schedule || 'weekly'}
                onChange={(e) => handleChange('payout_schedule', e.target.value)}
                className="bg-slate-800 border border-purple-500/30 text-white rounded-md px-3 py-2"
              >
                <option value="daily">Codziennie</option>
                <option value="weekly">Raz w tygodniu</option>
                <option value="biweekly">Co 2 tygodnie</option>
                <option value="monthly">Raz w miesiącu</option>
                <option value="manual">Ręcznie</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Settings */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Percent className="w-5 h-5 text-pink-400" />
            Faktury i rozliczenia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-slate-300">Faktury włączone</Label>
              <p className="text-xs text-slate-500">Generuj faktury dla użytkowników</p>
            </div>
            <Switch
              checked={formData.invoices_enabled === 'true'}
              onCheckedChange={(checked) => handleChange('invoices_enabled', String(checked))}
            />
          </div>
          {formData.invoices_enabled === 'true' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Nazwa firmy</Label>
                <Input
                  value={formData.company_name || ''}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  className="bg-slate-800 border-purple-500/30 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">NIP</Label>
                <Input
                  value={formData.company_nip || ''}
                  onChange={(e) => handleChange('company_nip', e.target.value)}
                  className="bg-slate-800 border-purple-500/30 text-white"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-300">Adres</Label>
                <Input
                  value={formData.company_address || ''}
                  onChange={(e) => handleChange('company_address', e.target.value)}
                  className="bg-slate-800 border-purple-500/30 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Stawka VAT (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.vat_rate || ''}
                  onChange={(e) => handleChange('vat_rate', e.target.value)}
                  className="bg-slate-800 border-purple-500/30 text-white"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit */}
      <Button 
        type="submit" 
        disabled={saveMutation.isPending}
        className="w-full h-12 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
      >
        {saveMutation.isPending ? (
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
        ) : (
          <Save className="w-5 h-5 mr-2" />
        )}
        Zapisz ustawienia
      </Button>
    </form>
  );
}