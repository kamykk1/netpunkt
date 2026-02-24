import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  TrendingUp, Zap, CheckCircle, CreditCard, Globe, Users, 
  BarChart3, Shield, Loader2, ArrowRight, Star, Building2, User
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    description: 'Idealny na start',
    features: ['Do 5 aktywnych kampanii', '10 000 wyświetleń/mies.', 'Podstawowe statystyki', 'Support e-mail'],
    color: 'from-slate-600 to-slate-700',
    border: 'border-slate-500/30',
    popular: false
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 149,
    description: 'Dla rozwijających się firm',
    features: ['Do 20 kampanii', '100 000 wyświetleń/mies.', 'Zaawansowane raporty', 'AI Optymalizacja', 'Pixele śledzące', 'Support priorytetowy'],
    color: 'from-purple-600 to-cyan-600',
    border: 'border-purple-500/50',
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 499,
    description: 'Dla dużych korporacji',
    features: ['Nieograniczone kampanie', 'Nielimitowane wyświetlenia', 'White-label builder', 'Dedykowany manager', 'API dostęp', 'SLA 99.9%'],
    color: 'from-yellow-500 to-orange-500',
    border: 'border-yellow-500/30',
    popular: false
  }
];

const ENTITY_TYPES = [
  { id: 'company', label: 'Firma / Spółka', icon: Building2, desc: 'Osoba prawna, działalność gospodarcza, spółka' },
  { id: 'individual', label: 'Osoba fizyczna', icon: User, desc: 'Prywatna osoba, freelancer, influencer' },
];

export default function AdvertiserRegister() {
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [step, setStep] = useState(1); // 1: plan, 2: entity type, 3: details, 4: payment, 5: success
  const [entityType, setEntityType] = useState('company');
  const [formData, setFormData] = useState({
    // Wspólne
    phone: '',
    website: '',
    country: 'PL',
    // Firma
    company_name: '',
    company_nip: '',
    company_regon: '',
    company_krs: '',
    company_address: '',
    company_city: '',
    company_postal: '',
    // Osoba fizyczna
    first_name: '',
    last_name: '',
    pesel: '',
    id_number: '',
    address: '',
    city: '',
    postal: '',
    birth_date: '',
    // Billing
    billing_email: '',
  });

  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const set = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  const isDetailsValid = () => {
    if (entityType === 'company') return formData.company_name && formData.company_nip && formData.company_address;
    return formData.first_name && formData.last_name && formData.address;
  };

  const registerMutation = useMutation({
    mutationFn: async () => {
      const data = {
        is_advertiser: true,
        advertiser_plan: selectedPlan,
        advertiser_balance: 0,
        advertiser_entity_type: entityType,
        billing_email: formData.billing_email || user.email,
        phone: formData.phone,
        website: formData.website,
        advertiser_country: formData.country,
      };

      if (entityType === 'company') {
        Object.assign(data, {
          company_name: formData.company_name,
          company_nip: formData.company_nip,
          company_regon: formData.company_regon,
          company_krs: formData.company_krs,
          company_address: formData.company_address,
          company_city: formData.company_city,
          company_postal: formData.company_postal,
        });
      } else {
        Object.assign(data, {
          advertiser_first_name: formData.first_name,
          advertiser_last_name: formData.last_name,
          pesel: formData.pesel,
          id_number: formData.id_number,
          personal_address: formData.address,
          personal_city: formData.city,
          personal_postal: formData.postal,
          birth_date: formData.birth_date,
        });
      }

      await base44.auth.updateMe(data);

      await base44.entities.Notification.create({
        user_id: user.id,
        user_email: user.email,
        type: 'system',
        title: 'Konto reklamodawcy aktywowane!',
        message: `Twój plan ${selectedPlan.toUpperCase()} został aktywowany. Możesz teraz tworzyć kampanie reklamowe.`,
        priority: 'high'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setStep(5);
    },
    onError: () => toast.error('Błąd podczas rejestracji, spróbuj ponownie')
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (user?.is_advertiser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 mx-auto text-emerald-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Masz już konto reklamodawcy</h2>
          <p className="text-slate-400 mb-6">Plan: <Badge className="bg-purple-500/20 text-purple-400">{user.advertiser_plan || 'pro'}</Badge></p>
          <Link to={createPageUrl('AdvertiserPanel')}>
            <Button className="bg-gradient-to-r from-purple-600 to-cyan-600">
              Przejdź do panelu
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Step 5: Success
  if (step === 5) {
    const plan = PLANS.find(p => p.id === selectedPlan);
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 flex items-center justify-center mb-6">
            <CheckCircle className="w-12 h-12 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Gratulacje!</h1>
          <p className="text-slate-400 mb-2">Konto reklamodawcy zostało aktywowane.</p>
          <Badge className="bg-purple-500/20 text-purple-400 mb-6">Plan: {plan?.name}</Badge>
          <p className="text-slate-400 text-sm mb-8">Pamiętaj – jako reklamodawca możesz też zarabiać punkty, oglądać reklamy i wykonywać misje!</p>
          <div className="flex flex-col gap-3">
            <Link to={createPageUrl('AdvertiserPanel')}>
              <Button className="w-full bg-gradient-to-r from-purple-600 to-cyan-600">
                <TrendingUp className="w-4 h-4 mr-2" /> Otwórz panel reklamodawcy
              </Button>
            </Link>
            <Link to={createPageUrl('EarnAds')}>
              <Button variant="outline" className="w-full border-purple-500/30 text-white bg-transparent">
                <Zap className="w-4 h-4 mr-2" /> Zarabiaj punkty
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const plan = PLANS.find(p => p.id === selectedPlan);
  const totalSteps = 4;

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 mb-4">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 text-sm">Panel Reklamodawcy</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">
            Dotrzyj do <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">tysięcy użytkowników</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Twórz kampanie ORAZ zarabiaj punkty jak każdy użytkownik!
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { icon: Users, label: 'Aktywnych użytkowników', value: '50 000+', color: 'text-purple-400' },
            { icon: Globe, label: 'Zasięg geograficzny', value: 'Polska i EU', color: 'text-cyan-400' },
            { icon: BarChart3, label: 'Śr. CTR', value: '3.2%', color: 'text-emerald-400' },
            { icon: Shield, label: 'Anti-Fraud', value: 'AI powered', color: 'text-yellow-400' },
          ].map((item, i) => (
            <Card key={i} className="bg-[#1a1a2e]/50 border-purple-500/20 text-center">
              <CardContent className="p-4">
                <item.icon className={`w-8 h-8 mx-auto mb-2 ${item.color}`} />
                <p className={`font-bold text-lg ${item.color}`}>{item.value}</p>
                <p className="text-slate-400 text-xs">{item.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step >= s ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-400'
              }`}>{s}</div>
              {s < 4 && <div className={`w-12 h-0.5 ${step > s ? 'bg-purple-500' : 'bg-slate-700'}`} />}
            </div>
          ))}
        </div>
        <p className="text-center text-slate-400 text-sm mb-8">
          {['Wybór planu', 'Typ rejestracji', 'Dane szczegółowe', 'Podsumowanie i płatność'][step - 1]}
        </p>

        {/* Step 1: Plan Selection */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-2xl font-bold text-white text-center mb-6">Wybierz plan</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {PLANS.map((p) => (
                <div key={p.id} onClick={() => setSelectedPlan(p.id)}
                  className={`relative cursor-pointer rounded-2xl border-2 p-6 transition-all ${
                    selectedPlan === p.id ? p.border + ' scale-105' : 'border-slate-700/50 hover:border-purple-500/30'
                  } bg-[#1a1a2e]/50`}
                >
                  {p.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white px-4">
                        <Star className="w-3 h-3 mr-1" /> Popularny
                      </Badge>
                    </div>
                  )}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center mb-4`}>
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{p.name}</h3>
                  <p className="text-slate-400 text-sm mb-4">{p.description}</p>
                  <p className="text-3xl font-bold text-white mb-1">{p.price} <span className="text-slate-400 text-base font-normal">zł/mies.</span></p>
                  <ul className="space-y-2 mt-4">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  {selectedPlan === p.id && <div className="absolute top-4 right-4"><CheckCircle className="w-6 h-6 text-purple-400" /></div>}
                </div>
              ))}
            </div>
            <div className="flex justify-center">
              <Button onClick={() => setStep(2)} className="bg-gradient-to-r from-purple-600 to-cyan-600 px-10">
                Dalej <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Entity Type */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-white text-center mb-6">Typ rejestracji</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {ENTITY_TYPES.map((type) => (
                <div key={type.id} onClick={() => setEntityType(type.id)}
                  className={`cursor-pointer rounded-2xl border-2 p-6 transition-all ${
                    entityType === type.id
                      ? 'border-purple-500/60 bg-purple-500/10'
                      : 'border-slate-700/50 bg-[#1a1a2e]/50 hover:border-purple-500/30'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-xl mb-4 flex items-center justify-center ${
                    entityType === type.id ? 'bg-purple-500' : 'bg-slate-700'
                  }`}>
                    <type.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-1">{type.label}</h3>
                  <p className="text-slate-400 text-sm">{type.desc}</p>
                  {entityType === type.id && (
                    <div className="mt-3"><Badge className="bg-purple-500/20 text-purple-400">Wybrany</Badge></div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 border-slate-600 text-slate-300 bg-transparent">Wróć</Button>
              <Button onClick={() => setStep(3)} className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600">
                Dalej <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Details */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-xl mx-auto">
            <h2 className="text-2xl font-bold text-white text-center mb-2">
              {entityType === 'company' ? 'Dane firmy' : 'Dane osobowe'}
            </h2>
            <p className="text-slate-400 text-center text-sm mb-6">
              {entityType === 'company' ? 'Dane do wystawiania faktur VAT' : 'Dane do rozliczeń i weryfikacji'}
            </p>
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
              <CardContent className="p-6 space-y-4">
                {entityType === 'company' ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2 space-y-2">
                        <Label className="text-slate-300">Nazwa firmy *</Label>
                        <Input value={formData.company_name} onChange={e => set('company_name', e.target.value)}
                          placeholder="Acme Sp. z o.o." className="bg-slate-800 border-purple-500/30 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">NIP *</Label>
                        <Input value={formData.company_nip} onChange={e => set('company_nip', e.target.value)}
                          placeholder="1234567890" className="bg-slate-800 border-purple-500/30 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">REGON</Label>
                        <Input value={formData.company_regon} onChange={e => set('company_regon', e.target.value)}
                          placeholder="123456789" className="bg-slate-800 border-purple-500/30 text-white" />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label className="text-slate-300">KRS (opcjonalnie)</Label>
                        <Input value={formData.company_krs} onChange={e => set('company_krs', e.target.value)}
                          placeholder="0000123456" className="bg-slate-800 border-purple-500/30 text-white" />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label className="text-slate-300">Adres siedziby *</Label>
                        <Input value={formData.company_address} onChange={e => set('company_address', e.target.value)}
                          placeholder="ul. Przykładowa 1" className="bg-slate-800 border-purple-500/30 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Kod pocztowy</Label>
                        <Input value={formData.company_postal} onChange={e => set('company_postal', e.target.value)}
                          placeholder="00-001" className="bg-slate-800 border-purple-500/30 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Miasto</Label>
                        <Input value={formData.company_city} onChange={e => set('company_city', e.target.value)}
                          placeholder="Warszawa" className="bg-slate-800 border-purple-500/30 text-white" />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-300">Imię *</Label>
                        <Input value={formData.first_name} onChange={e => set('first_name', e.target.value)}
                          placeholder="Jan" className="bg-slate-800 border-purple-500/30 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Nazwisko *</Label>
                        <Input value={formData.last_name} onChange={e => set('last_name', e.target.value)}
                          placeholder="Kowalski" className="bg-slate-800 border-purple-500/30 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Data urodzenia</Label>
                        <Input type="date" value={formData.birth_date} onChange={e => set('birth_date', e.target.value)}
                          className="bg-slate-800 border-purple-500/30 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Kod pocztowy</Label>
                        <Input value={formData.postal} onChange={e => set('postal', e.target.value)}
                          placeholder="00-001" className="bg-slate-800 border-purple-500/30 text-white" />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label className="text-slate-300">Adres *</Label>
                        <Input value={formData.address} onChange={e => set('address', e.target.value)}
                          placeholder="ul. Przykładowa 1" className="bg-slate-800 border-purple-500/30 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Miasto</Label>
                        <Input value={formData.city} onChange={e => set('city', e.target.value)}
                          placeholder="Warszawa" className="bg-slate-800 border-purple-500/30 text-white" />
                      </div>
                    </div>
                  </>
                )}

                {/* Wspólne pola */}
                <div className="border-t border-purple-500/20 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Telefon</Label>
                    <Input value={formData.phone} onChange={e => set('phone', e.target.value)}
                      placeholder="+48 123 456 789" className="bg-slate-800 border-purple-500/30 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Strona www</Label>
                    <Input value={formData.website} onChange={e => set('website', e.target.value)}
                      placeholder="https://twojafirma.pl" className="bg-slate-800 border-purple-500/30 text-white" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-slate-300">Adres e-mail</Label>
                    <Input value={formData.billing_email} onChange={e => set('billing_email', e.target.value)}
                      placeholder={user?.email} className="bg-slate-800 border-purple-500/30 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1 border-slate-600 text-slate-300 bg-transparent">Wróć</Button>
              <Button onClick={() => setStep(4)} disabled={!isDetailsValid()}
                className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600">
                Dalej: Płatność <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Payment */}
        {step === 4 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-white text-center mb-6">Podsumowanie i płatność</h2>
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20 mb-4">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white font-bold text-lg">Plan {plan?.name}</p>
                    <p className="text-slate-400 text-sm flex items-center gap-2">
                      {entityType === 'company' ? (
                        <><Building2 className="w-4 h-4" />{formData.company_name}</>
                      ) : (
                        <><User className="w-4 h-4" />{formData.first_name} {formData.last_name}</>
                      )}
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-white">{plan?.price} zł/mies.</p>
                </div>
                <div className="border-t border-purple-500/20 pt-4 space-y-2">
                  {plan?.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />{f}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1a2e]/50 border-emerald-500/20 mb-4">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Zap className="w-6 h-6 text-yellow-400 shrink-0" />
                  <div>
                    <p className="text-white font-medium text-sm">Bonus: Możesz też zarabiać punkty!</p>
                    <p className="text-slate-400 text-xs">Jako reklamodawca masz pełen dostęp do oglądania reklam, misji i rankingów.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl mb-6">
              <div className="flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-amber-400 shrink-0" />
                <div>
                  <p className="text-amber-300 font-medium text-sm">Płatność Stripe</p>
                  <p className="text-slate-400 text-xs">W środowisku produkcyjnym przekierujemy Cię do bezpiecznej bramki Stripe. W trybie demo – aktywacja jest natychmiastowa.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1 border-slate-600 text-slate-300 bg-transparent">Wróć</Button>
              <Button onClick={() => registerMutation.mutate()} disabled={registerMutation.isPending}
                className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600">
                {registerMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CreditCard className="w-4 h-4 mr-2" />
                )}
                Aktywuj konto
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}