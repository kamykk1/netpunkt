import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Target, Users, MapPin, Clock, Smartphone, Globe,
  TrendingUp, Heart, Briefcase, GraduationCap, ShoppingCart,
  Gamepad2, Plane, Car, Home, Dumbbell, Music, Camera
} from 'lucide-react';

const INTERESTS = [
  { id: 'tech', label: 'Technologia', icon: Smartphone },
  { id: 'shopping', label: 'Zakupy online', icon: ShoppingCart },
  { id: 'gaming', label: 'Gaming', icon: Gamepad2 },
  { id: 'travel', label: 'Podróże', icon: Plane },
  { id: 'automotive', label: 'Motoryzacja', icon: Car },
  { id: 'home', label: 'Dom i wnętrza', icon: Home },
  { id: 'fitness', label: 'Fitness', icon: Dumbbell },
  { id: 'music', label: 'Muzyka', icon: Music },
  { id: 'photography', label: 'Fotografia', icon: Camera },
  { id: 'finance', label: 'Finanse', icon: TrendingUp },
  { id: 'education', label: 'Edukacja', icon: GraduationCap },
  { id: 'business', label: 'Biznes', icon: Briefcase },
];

const BEHAVIORS = [
  { id: 'active_earner', label: 'Aktywnie zarabia (>50 reklam/tydzień)', color: 'emerald' },
  { id: 'new_user', label: 'Nowy użytkownik (<30 dni)', color: 'blue' },
  { id: 'referrer', label: 'Aktywnie poleca innych', color: 'purple' },
  { id: 'premium_buyer', label: 'Kupuje produkty premium', color: 'yellow' },
  { id: 'high_engagement', label: 'Wysokie zaangażowanie', color: 'pink' },
  { id: 'cashback_user', label: 'Korzysta z cashbacku', color: 'cyan' },
];

const COUNTRIES = [
  { code: 'PL', name: 'Polska', flag: '🇵🇱' },
  { code: 'DE', name: 'Niemcy', flag: '🇩🇪' },
  { code: 'GB', name: 'Wielka Brytania', flag: '🇬🇧' },
  { code: 'US', name: 'USA', flag: '🇺🇸' },
  { code: 'FR', name: 'Francja', flag: '🇫🇷' },
  { code: 'ES', name: 'Hiszpania', flag: '🇪🇸' },
];

const DEVICES = [
  { id: 'mobile', label: 'Mobilne', icon: '📱' },
  { id: 'desktop', label: 'Desktop', icon: '🖥️' },
  { id: 'tablet', label: 'Tablet', icon: '📱' },
];

export default function AdvancedTargeting({ targeting, onChange }) {
  const [config, setConfig] = useState(targeting || {
    ageRange: [18, 65],
    gender: 'all',
    countries: ['PL'],
    interests: [],
    behaviors: [],
    devices: ['mobile', 'desktop'],
    membershipLevel: [1, 5],
    activeHours: [8, 22],
    excludeBlocked: true,
    excludeLowFraud: true,
  });

  const updateConfig = (key, value) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onChange?.(newConfig);
  };

  const toggleArrayItem = (key, item) => {
    const arr = config[key] || [];
    const newArr = arr.includes(item)
      ? arr.filter(i => i !== item)
      : [...arr, item];
    updateConfig(key, newArr);
  };

  const estimatedReach = () => {
    let base = 50000;
    if (config.countries.length < 3) base *= 0.3 * config.countries.length;
    if (config.interests.length > 0) base *= 0.8;
    if (config.behaviors.length > 0) base *= 0.7;
    if (config.membershipLevel[0] > 1) base *= 0.5;
    return Math.round(base);
  };

  return (
    <div className="space-y-6">
      {/* Estimated Reach */}
      <Card className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border-purple-500/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Szacowany zasięg</p>
              <p className="text-3xl font-bold text-white">{estimatedReach().toLocaleString()}</p>
              <p className="text-slate-400 text-xs">potencjalnych użytkowników</p>
            </div>
            <Target className="w-12 h-12 text-purple-400" />
          </div>
        </CardContent>
      </Card>

      {/* Demographics */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-cyan-400" />
            Demografia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Age Range */}
          <div className="space-y-3">
            <Label className="text-slate-300">Wiek: {config.ageRange[0]} - {config.ageRange[1]} lat</Label>
            <Slider
              value={config.ageRange}
              onValueChange={(v) => updateConfig('ageRange', v)}
              min={13}
              max={80}
              step={1}
              className="py-2"
            />
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label className="text-slate-300">Płeć</Label>
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'Wszyscy' },
                { value: 'male', label: '👨 Mężczyźni' },
                { value: 'female', label: '👩 Kobiety' },
              ].map((opt) => (
                <Button
                  key={opt.value}
                  variant={config.gender === opt.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateConfig('gender', opt.value)}
                  className={config.gender === opt.value 
                    ? 'bg-purple-600' 
                    : 'border-purple-500/30 text-white'}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Membership Level */}
          <div className="space-y-3">
            <Label className="text-slate-300">Poziom członkostwa: {config.membershipLevel[0]} - {config.membershipLevel[1]}</Label>
            <Slider
              value={config.membershipLevel}
              onValueChange={(v) => updateConfig('membershipLevel', v)}
              min={1}
              max={5}
              step={1}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>Bronze</span>
              <span>Silver</span>
              <span>Gold</span>
              <span>Platinum</span>
              <span>Diamond</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Geographic */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <Globe className="w-5 h-5 text-emerald-400" />
            Lokalizacja
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {COUNTRIES.map((country) => (
              <Button
                key={country.code}
                variant={config.countries.includes(country.code) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleArrayItem('countries', country.code)}
                className={config.countries.includes(country.code)
                  ? 'bg-emerald-600'
                  : 'border-purple-500/30 text-white'}
              >
                {country.flag} {country.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Interests */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <Heart className="w-5 h-5 text-pink-400" />
            Zainteresowania
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {INTERESTS.map((interest) => {
              const Icon = interest.icon;
              const isSelected = config.interests.includes(interest.id);
              return (
                <button
                  key={interest.id}
                  onClick={() => toggleArrayItem('interests', interest.id)}
                  className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-pink-500/20 border-pink-500/50 text-pink-300'
                      : 'border-slate-700 text-slate-400 hover:border-pink-500/30'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{interest.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Behaviors */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-yellow-400" />
            Zachowania
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {BEHAVIORS.map((behavior) => {
              const isSelected = config.behaviors.includes(behavior.id);
              return (
                <div
                  key={behavior.id}
                  onClick={() => toggleArrayItem('behaviors', behavior.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? `bg-${behavior.color}-500/20 border-${behavior.color}-500/50`
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <Checkbox checked={isSelected} />
                  <span className={isSelected ? `text-${behavior.color}-300` : 'text-slate-400'}>
                    {behavior.label}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Devices & Time */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <Smartphone className="w-5 h-5 text-blue-400" />
            Urządzenia i czas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-slate-300">Urządzenia</Label>
            <div className="flex gap-2">
              {DEVICES.map((device) => (
                <Button
                  key={device.id}
                  variant={config.devices.includes(device.id) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleArrayItem('devices', device.id)}
                  className={config.devices.includes(device.id)
                    ? 'bg-blue-600'
                    : 'border-purple-500/30 text-white'}
                >
                  {device.icon} {device.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-slate-300">
              <Clock className="w-4 h-4 inline mr-1" />
              Godziny aktywności: {config.activeHours[0]}:00 - {config.activeHours[1]}:00
            </Label>
            <Slider
              value={config.activeHours}
              onValueChange={(v) => updateConfig('activeHours', v)}
              min={0}
              max={24}
              step={1}
              className="py-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Safety */}
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">🛡️ Bezpieczeństwo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-slate-300">Wyklucz zablokowanych użytkowników</Label>
            <Switch
              checked={config.excludeBlocked}
              onCheckedChange={(v) => updateConfig('excludeBlocked', v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-slate-300">Wyklucz użytkowników z niskim fraud score</Label>
            <Switch
              checked={config.excludeLowFraud}
              onCheckedChange={(v) => updateConfig('excludeLowFraud', v)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}