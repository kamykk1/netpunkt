import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { Mail, Send, Users, CheckSquare, Square, Loader2 } from 'lucide-react';

const TEMPLATES = {
  screening: {
    label: 'Zaproszenie na screening',
    subject: 'Zaproszenie na rozmowę wstępną – {stanowisko}',
    body: `Szanowny/a {imie},\n\nDziękujemy za przesłanie aplikacji na stanowisko {stanowisko}. Z przyjemnością zapraszamy Panią/Pana na rozmowę wstępną.\n\nProsimy o potwierdzenie dostępności.\n\nZ poważaniem,\nZespół Rekrutacji`
  },
  interview: {
    label: 'Zaproszenie na rozmowę',
    subject: 'Zaproszenie na rozmowę kwalifikacyjną – {stanowisko}',
    body: `Szanowny/a {imie},\n\nZ przyjemnością informujemy, że zakwalifikowali/łyśmy Panią/Pana do kolejnego etapu rekrutacji na stanowisko {stanowisko}.\n\nProsimy o kontakt w celu ustalenia terminu rozmowy.\n\nZ poważaniem,\nZespół Rekrutacji`
  },
  offer: {
    label: 'Wysłanie oferty',
    subject: 'Oferta zatrudnienia – {stanowisko}',
    body: `Szanowny/a {imie},\n\nZ radością informujemy, że wybraliśmy Panią/Pana na stanowisko {stanowisko}. W załączeniu przesyłamy propozycję warunków zatrudnienia.\n\nCzekamy na Pani/Pana odpowiedź.\n\nZ poważaniem,\nZespół Rekrutacji`
  },
  rejection: {
    label: 'Odrzucenie aplikacji',
    subject: 'Informacja o zakończeniu rekrutacji – {stanowisko}',
    body: `Szanowny/a {imie},\n\nDziękujemy za zainteresowanie stanowiskiem {stanowisko} oraz za poświęcony czas.\n\nPo dokładnej analizie wszystkich aplikacji, zdecydowaliśmy się nie kontynuować procesu z Panią/Panem na tym etapie.\n\nŻyczymy powodzenia w dalszej karierze.\n\nZ poważaniem,\nZespół Rekrutacji`
  },
  custom: {
    label: 'Własna wiadomość',
    subject: '',
    body: ''
  }
};

export default function CandidateEmail({ applications, offerTitle, onClose }) {
  const [selected, setSelected] = useState(new Set());
  const [templateKey, setTemplateKey] = useState('screening');
  const [subject, setSubject] = useState(TEMPLATES.screening.subject);
  const [body, setBody] = useState(TEMPLATES.screening.body);
  const [sending, setSending] = useState(false);

  const toggleAll = () => {
    if (selected.size === applications.length) setSelected(new Set());
    else setSelected(new Set(applications.map(a => a.id)));
  };

  const toggleOne = (id) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const applyTemplate = (key) => {
    setTemplateKey(key);
    if (key !== 'custom') {
      setSubject(TEMPLATES[key].subject.replace('{stanowisko}', offerTitle || ''));
      setBody(TEMPLATES[key].body.replace(/{stanowisko}/g, offerTitle || ''));
    }
  };

  const sendEmails = async () => {
    const targets = applications.filter(a => selected.has(a.id));
    if (targets.length === 0) { toast.error('Zaznacz kandydatów'); return; }
    setSending(true);
    let sent = 0;
    for (const app of targets) {
      const personalSubject = subject.replace('{imie}', app.candidate_name?.split(' ')[0] || '');
      const personalBody = body.replace(/{imie}/g, app.candidate_name?.split(' ')[0] || '');
      await base44.integrations.Core.SendEmail({
        to: app.candidate_email,
        subject: personalSubject,
        body: personalBody.replace(/\n/g, '<br>')
      });
      // Zapisz notatkę o wysłaniu
      await base44.entities.JobApplication.update(app.id, {
        recruiter_notes: (app.recruiter_notes ? app.recruiter_notes + '\n' : '') +
          `[Email ${new Date().toLocaleDateString('pl-PL')}] ${TEMPLATES[templateKey]?.label || 'Własna wiadomość'}`
      });
      sent++;
    }
    setSending(false);
    toast.success(`Wysłano ${sent} wiadomości`);
    onClose?.();
  };

  return (
    <div className="space-y-4">
      {/* Wybór kandydatów */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-slate-300 text-xs">Odbiorcy</Label>
          <button onClick={toggleAll} className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300">
            {selected.size === applications.length ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
            Zaznacz wszystkich ({applications.length})
          </button>
        </div>
        <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-slate-900/50 rounded-lg border border-slate-700/50">
          {applications.map(app => (
            <label key={app.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-700/30 px-1 py-0.5 rounded">
              <input type="checkbox" checked={selected.has(app.id)} onChange={() => toggleOne(app.id)} className="accent-purple-500" />
              <span className="text-white text-xs">{app.candidate_name}</span>
              <span className="text-slate-500 text-xs">{app.candidate_email}</span>
            </label>
          ))}
        </div>
        {selected.size > 0 && <Badge className="mt-1 bg-purple-500/20 text-purple-400 text-xs">{selected.size} zaznaczonych</Badge>}
      </div>

      {/* Szablon */}
      <div className="space-y-1">
        <Label className="text-slate-300 text-xs">Szablon wiadomości</Label>
        <Select value={templateKey} onValueChange={applyTemplate}>
          <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-[#1a1a2e] border-purple-500/30">
            {Object.entries(TEMPLATES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Temat */}
      <div className="space-y-1">
        <Label className="text-slate-300 text-xs">Temat</Label>
        <Input value={subject} onChange={e => setSubject(e.target.value)}
          className="bg-slate-800 border-purple-500/30 text-white h-8 text-sm" />
      </div>

      {/* Treść */}
      <div className="space-y-1">
        <Label className="text-slate-300 text-xs">Treść <span className="text-slate-500">(użyj {'{imie}'} dla personalizacji)</span></Label>
        <Textarea value={body} onChange={e => setBody(e.target.value)}
          className="bg-slate-800 border-purple-500/30 text-white text-sm h-40" />
      </div>

      <Button onClick={sendEmails} disabled={sending || selected.size === 0}
        className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700">
        {sending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Wysyłam...</> : <><Send className="w-4 h-4 mr-2" />Wyślij do {selected.size} kandydatów</>}
      </Button>
    </div>
  );
}