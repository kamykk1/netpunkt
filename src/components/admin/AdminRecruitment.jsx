import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Briefcase, Plus, Search, Star, User, FileText, Pencil, 
  Trash2, ChevronDown, Phone, Mail, Calendar, X
} from 'lucide-react';
import { notifyAdmins } from '@/components/notifications/notificationHelpers.jsx';

const STATUS_CONFIG = {
  cv_received:  { label: 'CV przesłano',   color: 'bg-slate-500/20 text-slate-300' },
  screening:    { label: 'Screening',       color: 'bg-blue-500/20 text-blue-400' },
  interview:    { label: 'Rozmowa',         color: 'bg-purple-500/20 text-purple-400' },
  offer_sent:   { label: 'Oferta wysłana',  color: 'bg-amber-500/20 text-amber-400' },
  hired:        { label: 'Zatrudniony',     color: 'bg-emerald-500/20 text-emerald-400' },
  rejected:     { label: 'Odrzucony',       color: 'bg-red-500/20 text-red-400' },
};

const EMP_TYPES = { full_time: 'Pełny etat', part_time: 'Część etatu', contract: 'Umowa', internship: 'Staż' };
const SOURCES = { linkedin: 'LinkedIn', pracuj: 'Pracuj.pl', indeed: 'Indeed', referral: 'Polecenie', direct: 'Bezpośrednio', other: 'Inne' };

const EMPTY_OFFER = { title: '', department: '', location: '', employment_type: 'full_time', description: '', requirements: '', salary_from: '', salary_to: '', status: 'open' };
const EMPTY_APP = { candidate_name: '', candidate_email: '', candidate_phone: '', cv_url: '', cv_text: '', cover_letter: '', status: 'cv_received', keywords: '', rating: '', salary_expectation: '', source: 'direct', recruiter_notes: '', interview_date: '' };

export default function AdminRecruitment() {
  const queryClient = useQueryClient();
  const [activeOffer, setActiveOffer] = useState(null);
  const [offerForm, setOfferForm] = useState(null); // null = closed, obj = editing
  const [appForm, setAppForm] = useState(null);
  const [editingApp, setEditingApp] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [empTypeFilter, setEmpTypeFilter] = useState('all');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [sortBy, setSortBy] = useState('created_date_desc');

  const { data: offers = [] } = useQuery({
    queryKey: ['jobOffers'],
    queryFn: () => base44.entities.JobOffer.list('-created_date')
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['jobApplications'],
    queryFn: () => base44.entities.JobApplication.list('-created_date', 200)
  });

  const offerMutation = useMutation({
    mutationFn: (data) => data.id
      ? base44.entities.JobOffer.update(data.id, data)
      : base44.entities.JobOffer.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['jobOffers'] }); setOfferForm(null); toast.success('Zapisano ofertę'); }
  });

  const deleteOfferMutation = useMutation({
    mutationFn: (id) => base44.entities.JobOffer.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['jobOffers'] }); setActiveOffer(null); toast.success('Usunięto ofertę'); }
  });

  const appMutation = useMutation({
    mutationFn: async (data) => {
      if (data.id) return base44.entities.JobApplication.update(data.id, data);
      const app = await base44.entities.JobApplication.create({ ...data, job_offer_id: activeOffer?.id, job_title: activeOffer?.title });
      await notifyAdmins({
        type: 'system',
        title: `Nowe CV: ${data.candidate_name}`,
        message: `Kandydat na stanowisko: ${activeOffer?.title}. Email: ${data.candidate_email}`,
        referenceId: app.id,
        referenceType: 'other'
      });
      return app;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['jobApplications'] }); setAppForm(null); setEditingApp(null); toast.success('Zapisano kandydata'); }
  });

  const deleteAppMutation = useMutation({
    mutationFn: (id) => base44.entities.JobApplication.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['jobApplications'] }); toast.success('Usunięto kandydata'); }
  });

  const offerApps = applications.filter(a => a.job_offer_id === activeOffer?.id);

  const filteredApps = offerApps
    .filter(a => {
      const matchStatus = statusFilter === 'all' || a.status === statusFilter;
      const matchSearch = !search || [a.candidate_name, a.candidate_email, a.keywords, a.cv_text]
        .some(f => f?.toLowerCase().includes(search.toLowerCase()));
      return matchStatus && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'created_date_desc') return new Date(b.created_date) - new Date(a.created_date);
      if (sortBy === 'created_date_asc') return new Date(a.created_date) - new Date(b.created_date);
      if (sortBy === 'rating_desc') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      return 0;
    });

  const filteredOffers = offers.filter(o => {
    const matchLoc = !locationFilter || o.location?.toLowerCase().includes(locationFilter.toLowerCase());
    const matchEmp = empTypeFilter === 'all' || o.employment_type === empTypeFilter;
    const matchSalMin = !salaryMin || (o.salary_to >= parseInt(salaryMin));
    const matchSalMax = !salaryMax || (o.salary_from <= parseInt(salaryMax));
    return matchLoc && matchEmp && matchSalMin && matchSalMax;
  });

  const statusCounts = Object.keys(STATUS_CONFIG).reduce((acc, k) => {
    acc[k] = offerApps.filter(a => a.status === k).length;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-purple-400" />
          Rekrutacja ({offers.length} ofert, {applications.length} kandydatów)
        </h3>
        <Button size="sm" onClick={() => setOfferForm({ ...EMPTY_OFFER })} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-1" /> Nowa oferta
        </Button>
      </div>

      {/* Offer filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 bg-slate-800/30 rounded-xl border border-slate-700/50">
        <Input value={locationFilter} onChange={e => setLocationFilter(e.target.value)} placeholder="Filtruj lokalizację..."
          className="bg-slate-800 border-purple-500/30 text-white h-8 text-xs" />
        <Select value={empTypeFilter} onValueChange={setEmpTypeFilter}>
          <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white h-8 text-xs"><SelectValue placeholder="Typ zatrudnienia" /></SelectTrigger>
          <SelectContent className="bg-[#1a1a2e] border-purple-500/30">
            <SelectItem value="all">Wszystkie typy</SelectItem>
            {Object.entries(EMP_TYPES).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="number" value={salaryMin} onChange={e => setSalaryMin(e.target.value)} placeholder="Min. wynagrodzenie"
          className="bg-slate-800 border-purple-500/30 text-white h-8 text-xs" />
        <Input type="number" value={salaryMax} onChange={e => setSalaryMax(e.target.value)} placeholder="Max. wynagrodzenie"
          className="bg-slate-800 border-purple-500/30 text-white h-8 text-xs" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Offers list */}
        <div className="space-y-2">
          <h4 className="text-slate-400 text-sm font-medium uppercase tracking-wide mb-3">Oferty pracy ({filteredOffers.length})</h4>
          {filteredOffers.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-sm">Brak ofert spełniających filtry</div>
          )}
          {filteredOffers.map(offer => {
            const appCount = applications.filter(a => a.job_offer_id === offer.id).length;
            return (
              <div key={offer.id}
                onClick={() => setActiveOffer(offer)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  activeOffer?.id === offer.id
                    ? 'border-purple-500/60 bg-purple-500/10'
                    : 'border-slate-700/50 bg-slate-800/30 hover:border-purple-500/30'
                }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-white font-medium text-sm truncate">{offer.title}</p>
                    <p className="text-slate-400 text-xs">{offer.department} · {offer.location || 'Zdalnie'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={offer.status === 'open' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'} style={{fontSize:'10px'}}>
                        {offer.status === 'open' ? 'Otwarta' : offer.status === 'closed' ? 'Zamknięta' : 'Szkic'}
                      </Badge>
                      <span className="text-slate-500 text-xs">{appCount} kandydatów</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={e => { e.stopPropagation(); setOfferForm({ ...offer }); }}
                      className="p-1 text-slate-400 hover:text-white"><Pencil className="w-3 h-3" /></button>
                    <button onClick={e => { e.stopPropagation(); deleteOfferMutation.mutate(offer.id); }}
                      className="p-1 text-slate-400 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Applications panel */}
        <div className="lg:col-span-2">
          {!activeOffer ? (
            <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
              Wybierz ofertę, aby zobaczyć kandydatów
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-white font-medium">{activeOffer.title}</h4>
                <div className="flex items-center gap-2">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white h-7 text-xs w-40"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-purple-500/30">
                      <SelectItem value="created_date_desc">Najnowsze</SelectItem>
                      <SelectItem value="created_date_asc">Najstarsze</SelectItem>
                      <SelectItem value="rating_desc">Najlepsza ocena</SelectItem>
                      <SelectItem value="status">Wg statusu</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={() => setAppForm({ ...EMPTY_APP })} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-3 h-3 mr-1" /> Dodaj
                  </Button>
                </div>
              </div>

              {/* Progress widget */}
              <div className="grid grid-cols-3 gap-1.5">
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <div key={k} className={`px-2 py-1.5 rounded-lg border text-center ${v.color} border-current/20`} style={{borderColor:'currentColor',opacity:0.9}}>
                    <p className="font-bold text-sm">{statusCounts[k] || 0}</p>
                    <p className="text-xs opacity-80 leading-tight">{v.label}</p>
                  </div>
                ))}
              </div>

              {/* Status pipeline */}
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setStatusFilter('all')}
                  className={`px-2 py-1 rounded text-xs border transition-all ${statusFilter === 'all' ? 'bg-purple-500/20 border-purple-500/50 text-white' : 'border-slate-700 text-slate-400'}`}>
                  Wszyscy ({offerApps.length})
                </button>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <button key={k} onClick={() => setStatusFilter(k)}
                    className={`px-2 py-1 rounded text-xs border transition-all ${statusFilter === k ? 'bg-purple-500/20 border-purple-500/50 text-white' : 'border-slate-700 text-slate-400'}`}>
                    {v.label} ({statusCounts[k] || 0})
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <Input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Szukaj w CV, imieniu, emailu, słowach kluczowych..."
                  className="pl-8 bg-slate-800 border-purple-500/30 text-white text-sm h-8" />
              </div>

              {/* Applications */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {filteredApps.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-sm">Brak kandydatów</div>
                ) : filteredApps.map(app => (
                  <div key={app.id} className="p-3 rounded-xl border border-slate-700/50 bg-slate-800/30">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-white font-medium text-sm">{app.candidate_name}</p>
                          <Badge className={STATUS_CONFIG[app.status]?.color + ' text-xs'}>
                            {STATUS_CONFIG[app.status]?.label}
                          </Badge>
                          {app.rating && (
                            <span className="flex items-center gap-0.5 text-yellow-400 text-xs">
                              {'★'.repeat(parseInt(app.rating))}{'☆'.repeat(5 - parseInt(app.rating))}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-slate-400 text-xs">
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{app.candidate_email}</span>
                          {app.candidate_phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{app.candidate_phone}</span>}
                          {app.interview_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{app.interview_date}</span>}
                          {app.source && <span className="text-purple-400">{SOURCES[app.source]}</span>}
                        </div>
                        {app.keywords && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {app.keywords.split(',').map(k => k.trim()).filter(Boolean).map((kw, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-slate-700/60 rounded text-slate-300 text-xs">{kw}</span>
                            ))}
                          </div>
                        )}
                        {app.recruiter_notes && (
                          <p className="text-slate-400 text-xs mt-1.5 italic border-l-2 border-purple-500/30 pl-2">{app.recruiter_notes}</p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {app.cv_url && (
                          <a href={app.cv_url} target="_blank" rel="noreferrer"
                            className="p-1.5 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 rounded">
                            <FileText className="w-3 h-3" />
                          </a>
                        )}
                        <button onClick={() => setEditingApp(app)}
                          className="p-1.5 text-slate-400 hover:text-white border border-slate-600 rounded">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button onClick={() => deleteAppMutation.mutate(app.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 border border-slate-600 rounded">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Offer Form Dialog */}
      <Dialog open={!!offerForm} onOpenChange={() => setOfferForm(null)}>
        <DialogContent className="bg-[#1a1a2e] border-purple-500/30 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{offerForm?.id ? 'Edytuj ofertę' : 'Nowa oferta pracy'}</DialogTitle>
          </DialogHeader>
          {offerForm && (
            <div className="space-y-3">
              {[['title','Stanowisko','text'],['department','Dział','text'],['location','Lokalizacja','text']].map(([key, label, type]) => (
                <div key={key} className="space-y-1">
                  <Label className="text-slate-300 text-xs">{label}</Label>
                  <Input type={type} value={offerForm[key] || ''} onChange={e => setOfferForm(p => ({...p, [key]: e.target.value}))}
                    className="bg-slate-800 border-purple-500/30 text-white h-8 text-sm" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-slate-300 text-xs">Typ zatrudnienia</Label>
                  <Select value={offerForm.employment_type} onValueChange={v => setOfferForm(p => ({...p, employment_type: v}))}>
                    <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-purple-500/30">
                      {Object.entries(EMP_TYPES).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-300 text-xs">Status</Label>
                  <Select value={offerForm.status} onValueChange={v => setOfferForm(p => ({...p, status: v}))}>
                    <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-purple-500/30">
                      <SelectItem value="open">Otwarta</SelectItem>
                      <SelectItem value="closed">Zamknięta</SelectItem>
                      <SelectItem value="draft">Szkic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-slate-300 text-xs">Wynagrodzenie od (zł)</Label>
                  <Input type="number" value={offerForm.salary_from || ''} onChange={e => setOfferForm(p => ({...p, salary_from: e.target.value}))}
                    className="bg-slate-800 border-purple-500/30 text-white h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-300 text-xs">Wynagrodzenie do (zł)</Label>
                  <Input type="number" value={offerForm.salary_to || ''} onChange={e => setOfferForm(p => ({...p, salary_to: e.target.value}))}
                    className="bg-slate-800 border-purple-500/30 text-white h-8 text-sm" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-slate-300 text-xs">Opis stanowiska</Label>
                <Textarea value={offerForm.description || ''} onChange={e => setOfferForm(p => ({...p, description: e.target.value}))}
                  className="bg-slate-800 border-purple-500/30 text-white text-sm h-20" />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-300 text-xs">Wymagania</Label>
                <Textarea value={offerForm.requirements || ''} onChange={e => setOfferForm(p => ({...p, requirements: e.target.value}))}
                  className="bg-slate-800 border-purple-500/30 text-white text-sm h-20" />
              </div>
              <Button onClick={() => offerMutation.mutate(offerForm)} disabled={offerMutation.isPending || !offerForm.title}
                className="w-full bg-purple-600 hover:bg-purple-700">Zapisz ofertę</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Application Form Dialog */}
      <Dialog open={!!(appForm || editingApp)} onOpenChange={() => { setAppForm(null); setEditingApp(null); }}>
        <DialogContent className="bg-[#1a1a2e] border-purple-500/30 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingApp ? 'Edytuj kandydata' : 'Dodaj kandydata'}</DialogTitle>
          </DialogHeader>
          {(appForm || editingApp) && (() => {
            const data = editingApp || appForm;
            const setData = editingApp ? setEditingApp : setAppForm;
            return (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-slate-300 text-xs">Imię i nazwisko *</Label>
                    <Input value={data.candidate_name || ''} onChange={e => setData(p => ({...p, candidate_name: e.target.value}))}
                      className="bg-slate-800 border-purple-500/30 text-white h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-300 text-xs">Email *</Label>
                    <Input value={data.candidate_email || ''} onChange={e => setData(p => ({...p, candidate_email: e.target.value}))}
                      className="bg-slate-800 border-purple-500/30 text-white h-8 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-slate-300 text-xs">Telefon</Label>
                    <Input value={data.candidate_phone || ''} onChange={e => setData(p => ({...p, candidate_phone: e.target.value}))}
                      className="bg-slate-800 border-purple-500/30 text-white h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-300 text-xs">Link do CV</Label>
                    <Input value={data.cv_url || ''} onChange={e => setData(p => ({...p, cv_url: e.target.value}))}
                      className="bg-slate-800 border-purple-500/30 text-white h-8 text-sm" placeholder="https://..." />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-slate-300 text-xs">Status</Label>
                    <Select value={data.status} onValueChange={v => setData(p => ({...p, status: v}))}>
                      <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#1a1a2e] border-purple-500/30">
                        {Object.entries(STATUS_CONFIG).map(([k,v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-300 text-xs">Źródło</Label>
                    <Select value={data.source || 'direct'} onValueChange={v => setData(p => ({...p, source: v}))}>
                      <SelectTrigger className="bg-slate-800 border-purple-500/30 text-white h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#1a1a2e] border-purple-500/30">
                        {Object.entries(SOURCES).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-slate-300 text-xs">Ocena (1–5)</Label>
                    <Input type="number" min="1" max="5" value={data.rating || ''} onChange={e => setData(p => ({...p, rating: e.target.value}))}
                      className="bg-slate-800 border-purple-500/30 text-white h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-300 text-xs">Data rozmowy</Label>
                    <Input type="date" value={data.interview_date || ''} onChange={e => setData(p => ({...p, interview_date: e.target.value}))}
                      className="bg-slate-800 border-purple-500/30 text-white h-8 text-sm" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-300 text-xs">Słowa kluczowe z CV (oddziel przecinkami)</Label>
                  <Input value={data.keywords || ''} onChange={e => setData(p => ({...p, keywords: e.target.value}))}
                    className="bg-slate-800 border-purple-500/30 text-white h-8 text-sm" placeholder="React, TypeScript, Node.js..." />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-300 text-xs">Treść CV (do wyszukiwania)</Label>
                  <Textarea value={data.cv_text || ''} onChange={e => setData(p => ({...p, cv_text: e.target.value}))}
                    className="bg-slate-800 border-purple-500/30 text-white text-sm h-20" placeholder="Wklej treść CV..." />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-300 text-xs">Notatki rekrutera</Label>
                  <Textarea value={data.recruiter_notes || ''} onChange={e => setData(p => ({...p, recruiter_notes: e.target.value}))}
                    className="bg-slate-800 border-purple-500/30 text-white text-sm h-16" />
                </div>
                <Button onClick={() => appMutation.mutate(data)} disabled={appMutation.isPending || !data.candidate_name || !data.candidate_email}
                  className="w-full bg-emerald-600 hover:bg-emerald-700">Zapisz kandydata</Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}