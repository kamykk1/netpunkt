import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { 
  Bell, Mail, Smartphone, AlertTriangle, Target, 
  DollarSign, MessageSquare, Settings, Loader2, Save
} from 'lucide-react';

const notificationTypes = [
  { key: 'campaign_budget', label: 'Niski budżet kampanii', icon: AlertTriangle, color: 'text-amber-400' },
  { key: 'campaign_goals', label: 'Cel kampanii osiągnięty', icon: Target, color: 'text-emerald-400' },
  { key: 'commission_paid', label: 'Wypłata prowizji', icon: DollarSign, color: 'text-green-400' },
  { key: 'messages', label: 'Nowe wiadomości', icon: MessageSquare, color: 'text-blue-400' },
  { key: 'status_updates', label: 'Aktualizacje statusu', icon: Settings, color: 'text-purple-400' },
  { key: 'promo', label: 'Promocje i oferty', icon: Bell, color: 'text-pink-400' },
];

export default function NotificationSettingsPanel({ userId }) {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState(null);

  const { data: existingSettings, isLoading } = useQuery({
    queryKey: ['notificationSettings', userId],
    queryFn: async () => {
      const result = await base44.entities.NotificationSettings.filter({ user_id: userId });
      return result[0] || null;
    },
    enabled: !!userId
  });

  useEffect(() => {
    if (existingSettings) {
      setSettings(existingSettings);
    } else if (!isLoading && userId) {
      setSettings({
        user_id: userId,
        email_campaign_budget: true,
        email_campaign_goals: true,
        email_commission_paid: true,
        email_messages: true,
        email_status_updates: true,
        email_promo: false,
        inapp_campaign_budget: true,
        inapp_campaign_goals: true,
        inapp_commission_paid: true,
        inapp_messages: true,
        inapp_status_updates: true,
        inapp_promo: true,
        budget_threshold_percent: 20
      });
    }
  }, [existingSettings, isLoading, userId]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (existingSettings?.id) {
        return base44.entities.NotificationSettings.update(existingSettings.id, data);
      } else {
        return base44.entities.NotificationSettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationSettings'] });
      toast.success('Ustawienia zapisane!');
    }
  });

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading || !settings) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-400" />
            Ustawienia powiadomień
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-purple-500/20">
                  <th className="text-left text-slate-400 pb-4 font-medium">Typ powiadomienia</th>
                  <th className="text-center text-slate-400 pb-4 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <Mail className="w-4 h-4" /> Email
                    </div>
                  </th>
                  <th className="text-center text-slate-400 pb-4 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <Smartphone className="w-4 h-4" /> In-App
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {notificationTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <tr key={type.key} className="border-b border-purple-500/10">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 ${type.color}`} />
                          <span className="text-white">{type.label}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex justify-center">
                          <Switch
                            checked={settings[`email_${type.key}`]}
                            onCheckedChange={(v) => updateSetting(`email_${type.key}`, v)}
                          />
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex justify-center">
                          <Switch
                            checked={settings[`inapp_${type.key}`]}
                            onCheckedChange={(v) => updateSetting(`inapp_${type.key}`, v)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Próg alertu budżetowego
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 text-sm mb-4">
            Otrzymasz powiadomienie gdy budżet kampanii spadnie poniżej tego procentu
          </p>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white">Próg: {settings.budget_threshold_percent}%</span>
            </div>
            <Slider
              value={[settings.budget_threshold_percent]}
              onValueChange={([v]) => updateSetting('budget_threshold_percent', v)}
              min={5}
              max={50}
              step={5}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>5%</span>
              <span>25%</span>
              <span>50%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={() => saveMutation.mutate(settings)}
        disabled={saveMutation.isPending}
        className="w-full bg-gradient-to-r from-purple-600 to-cyan-600"
      >
        {saveMutation.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <Save className="w-4 h-4 mr-2" />
        )}
        Zapisz ustawienia
      </Button>
    </div>
  );
}