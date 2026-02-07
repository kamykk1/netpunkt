import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, Plus, Pencil, Loader2, Eye, Wand2 } from 'lucide-react';

const DEFAULT_TEMPLATES = [
  { template_key: 'welcome', name: 'Email powitalny', variables: '{{full_name}}, {{email}}, {{referral_code}}, {{bonus_points}}' },
  { template_key: 'welcome_advertiser', name: 'Powitanie reklamodawcy', variables: '{{full_name}}, {{email}}, {{company_name}}' },
  { template_key: 'withdrawal_pending', name: 'Wypłata oczekuje', variables: '{{full_name}}, {{amount}}, {{method}}' },
  { template_key: 'withdrawal_completed', name: 'Wypłata zrealizowana', variables: '{{full_name}}, {{amount}}, {{method}}, {{date}}' },
  { template_key: 'password_reset', name: 'Reset hasła', variables: '{{full_name}}, {{reset_link}}' },
  { template_key: 'referral_bonus', name: 'Bonus za polecenie', variables: '{{full_name}}, {{bonus_amount}}, {{referred_user}}' },
  { template_key: 'level_up', name: 'Awans poziomu', variables: '{{full_name}}, {{new_level}}, {{benefits}}' },
];

export default function AdminEmailTemplates() {
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    template_key: '',
    name: '',
    subject_pl: '',
    subject_en: '',
    body_pl: '',
    body_en: '',
    is_active: true
  });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['emailTemplates'],
    queryFn: () => base44.entities.EmailTemplate.list()
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingTemplate) {
        return base44.entities.EmailTemplate.update(editingTemplate.id, data);
      }
      return base44.entities.EmailTemplate.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailTemplates'] });
      setShowForm(false);
      setEditingTemplate(null);
      resetForm();
      toast.success('Szablon zapisany!');
    }
  });

  const resetForm = () => {
    setFormData({
      template_key: '',
      name: '',
      subject_pl: '',
      subject_en: '',
      body_pl: '',
      body_en: '',
      is_active: true
    });
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      template_key: template.template_key,
      name: template.name,
      subject_pl: template.subject_pl || '',
      subject_en: template.subject_en || '',
      body_pl: template.body_pl || '',
      body_en: template.body_en || '',
      is_active: template.is_active !== false
    });
    setShowForm(true);
  };

  const generateWithAI = async () => {
    if (!formData.template_key || !formData.name) {
      toast.error('Najpierw wybierz typ szablonu');
      return;
    }

    setGeneratingAI(true);
    const defaultTpl = DEFAULT_TEMPLATES.find(t => t.template_key === formData.template_key);
    
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Wygeneruj profesjonalny szablon email dla platformy Zapunktowani.eu.

Typ szablonu: ${formData.name}
Dostępne zmienne: ${defaultTpl?.variables || '{{full_name}}, {{email}}'}

Wygeneruj:
1. Temat email (krótki, zachęcający)
2. Treść HTML (profesjonalna, w stylu neonowym/dark mode, z gradientami fioletowo-cyjanowymi)

Użyj zmiennych w treści. Styl: nowoczesny, przyjazny, ale profesjonalny.`,
      response_json_schema: {
        type: "object",
        properties: {
          subject_pl: { type: "string" },
          subject_en: { type: "string" },
          body_pl: { type: "string" },
          body_en: { type: "string" }
        }
      }
    });

    setFormData(prev => ({
      ...prev,
      subject_pl: result.subject_pl || prev.subject_pl,
      subject_en: result.subject_en || prev.subject_en,
      body_pl: result.body_pl || prev.body_pl,
      body_en: result.body_en || prev.body_en
    }));
    setGeneratingAI(false);
    toast.success('Szablon wygenerowany przez AI!');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const defaultTpl = DEFAULT_TEMPLATES.find(t => t.template_key === formData.template_key);
    saveMutation.mutate({
      ...formData,
      variables: defaultTpl?.variables || formData.variables
    });
  };

  // Merge DB templates with defaults
  const allTemplates = DEFAULT_TEMPLATES.map(def => {
    const dbTemplate = templates.find(t => t.template_key === def.template_key);
    return dbTemplate || { ...def, is_active: false, id: null };
  });

  return (
    <div className="space-y-6">
      <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-cyan-400" />
            Szablony emaili
          </CardTitle>
          <Button
            onClick={() => { setEditingTemplate(null); resetForm(); setShowForm(true); }}
            className="bg-gradient-to-r from-purple-600 to-cyan-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nowy szablon
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-purple-500/20">
                  <TableHead className="text-slate-400">Nazwa</TableHead>
                  <TableHead className="text-slate-400">Klucz</TableHead>
                  <TableHead className="text-slate-400">Temat (PL)</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allTemplates.map((template) => (
                  <TableRow key={template.template_key} className="border-purple-500/20">
                    <TableCell className="text-white font-medium">{template.name}</TableCell>
                    <TableCell className="text-slate-400 font-mono text-xs">{template.template_key}</TableCell>
                    <TableCell className="text-slate-300 max-w-xs truncate">
                      {template.subject_pl || '—'}
                    </TableCell>
                    <TableCell>
                      {template.id ? (
                        <Badge className={template.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}>
                          {template.is_active ? 'Aktywny' : 'Nieaktywny'}
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-500/20 text-amber-400">Do skonfigurowania</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-purple-500/30 text-purple-400"
                          onClick={() => handleEdit(template)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {template.body_pl && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-cyan-500/30 text-cyan-400"
                            onClick={() => { setPreviewHtml(template.body_pl); setShowPreview(true); }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Form Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1a1a2e] border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingTemplate ? 'Edytuj szablon' : 'Nowy szablon email'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Dostosuj treść emaila wysyłanego do użytkowników
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Typ szablonu *</Label>
                <select
                  value={formData.template_key}
                  onChange={(e) => {
                    const tpl = DEFAULT_TEMPLATES.find(t => t.template_key === e.target.value);
                    setFormData(prev => ({ 
                      ...prev, 
                      template_key: e.target.value,
                      name: tpl?.name || prev.name
                    }));
                  }}
                  className="w-full h-9 px-3 rounded-md bg-slate-800 border border-purple-500/30 text-white"
                  required
                >
                  <option value="">Wybierz...</option>
                  {DEFAULT_TEMPLATES.map(tpl => (
                    <option key={tpl.template_key} value={tpl.template_key}>{tpl.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Nazwa</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-slate-800 border-purple-500/30 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={generateWithAI}
                disabled={generatingAI}
                variant="outline"
                className="border-purple-500/30 text-purple-400"
              >
                {generatingAI ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
                Generuj treść AI
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Temat (PL) *</Label>
                <Input
                  value={formData.subject_pl}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject_pl: e.target.value }))}
                  className="bg-slate-800 border-purple-500/30 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Temat (EN)</Label>
                <Input
                  value={formData.subject_en}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject_en: e.target.value }))}
                  className="bg-slate-800 border-purple-500/30 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Treść HTML (PL) *</Label>
              <Textarea
                value={formData.body_pl}
                onChange={(e) => setFormData(prev => ({ ...prev, body_pl: e.target.value }))}
                className="bg-slate-800 border-purple-500/30 text-white font-mono text-sm"
                rows={8}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Treść HTML (EN)</Label>
              <Textarea
                value={formData.body_en}
                onChange={(e) => setFormData(prev => ({ ...prev, body_en: e.target.value }))}
                className="bg-slate-800 border-purple-500/30 text-white font-mono text-sm"
                rows={8}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label className="text-slate-300">Szablon aktywny</Label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1 border-purple-500/30 text-white">
                Anuluj
              </Button>
              <Button type="submit" disabled={saveMutation.isPending} className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600">
                {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Zapisz
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>Podgląd emaila</DialogTitle>
          </DialogHeader>
          <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}