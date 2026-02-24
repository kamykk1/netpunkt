import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { 
  MessageSquare, Send, Megaphone, HelpCircle, AlertTriangle, 
  ShoppingBag, Loader2, Bot, CheckCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const DEPARTMENTS = [
  { value: 'advertising', label: 'Reklama', icon: Megaphone, email: 'reklama@netpunkt.pl', description: 'Pytania o kampanie reklamowe' },
  { value: 'contact', label: 'Kontakt ogólny', icon: HelpCircle, email: 'kontakt@netpunkt.pl', description: 'Ogólne pytania o serwis' },
  { value: 'complaints', label: 'Reklamacje', icon: AlertTriangle, email: 'reklamacje@netpunkt.pl', description: 'Zgłoś problem lub reklamację' },
  { value: 'purchases', label: 'Zakupy', icon: ShoppingBag, email: 'zakupy@netpunkt.pl', description: 'Pytania o zamówienia i sklep' },
];

export default function Contact() {
  const [department, setDepartment] = useState('contact');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [showAiChat, setShowAiChat] = useState(true);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data) => {
      // Najpierw spróbuj AI
      if (showAiChat) {
        const aiResult = await base44.integrations.Core.InvokeLLM({
          prompt: `Jesteś asystentem platformy netpunkt.pl. Użytkownik napisał wiadomość w dziale "${data.department}":
          
Temat: ${data.subject}
Wiadomość: ${data.message}

Odpowiedz krótko i pomocnie po polsku. Jeśli nie możesz pomóc, zasugeruj kontakt z działem obsługi.`,
          response_json_schema: {
            type: "object",
            properties: {
              response: { type: "string" },
              needs_human: { type: "boolean" }
            }
          }
        });

        if (!aiResult.needs_human) {
          setAiResponse(aiResult.response);
          return { ai_handled: true, response: aiResult.response };
        }
      }

      // Zapisz wiadomość do bazy
      await base44.entities.ContactMessage.create({
        user_id: user?.id,
        user_email: user?.email || data.email,
        user_name: user?.full_name || data.name,
        department: data.department,
        subject: data.subject,
        message: data.message,
        status: 'new',
        ai_response: aiResponse || null
      });

      // Wyślij email do odpowiedniego działu
      const deptConfig = DEPARTMENTS.find(d => d.value === data.department);
      await base44.integrations.Core.SendEmail({
        to: deptConfig.email,
        subject: `[${deptConfig.label}] ${data.subject}`,
        body: `
          <h2>Nowa wiadomość - ${deptConfig.label}</h2>
          <p><strong>Od:</strong> ${user?.full_name || data.name} (${user?.email || data.email})</p>
          <p><strong>Temat:</strong> ${data.subject}</p>
          <hr>
          <p>${data.message}</p>
        `
      });

      return { ai_handled: false };
    },
    onSuccess: (result) => {
      if (result.ai_handled) {
        toast.success('AI odpowiedziało na Twoje pytanie!');
      } else {
        toast.success('Wiadomość wysłana! Odpowiemy najszybciej jak to możliwe.');
        setSubject('');
        setMessage('');
        setAiResponse('');
      }
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessageMutation.mutate({
      department,
      subject,
      message
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-white">Kontakt</h1>
          <p className="text-slate-400 mt-1">Jak możemy Ci pomóc?</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department Selection */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">Wybierz dział</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={department} onValueChange={setDepartment} className="space-y-3">
                  {DEPARTMENTS.map((dept) => {
                    const Icon = dept.icon;
                    return (
                      <div
                        key={dept.value}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          department === dept.value
                            ? 'bg-purple-500/20 border-purple-500/50'
                            : 'bg-slate-800/30 border-slate-700/50 hover:border-purple-500/30'
                        }`}
                        onClick={() => setDepartment(dept.value)}
                      >
                        <RadioGroupItem value={dept.value} id={dept.value} className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor={dept.value} className="text-white font-medium flex items-center gap-2 cursor-pointer">
                            <Icon className="w-4 h-4 text-purple-400" />
                            {dept.label}
                          </Label>
                          <p className="text-slate-400 text-xs mt-1">{dept.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </RadioGroup>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-cyan-400" />
                  Wyślij wiadomość
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* AI Chat Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <div className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-purple-400" />
                      <span className="text-white text-sm">Asystent AI</span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={showAiChat ? "default" : "outline"}
                      className={showAiChat ? "bg-purple-600" : "border-purple-500/30 text-white"}
                      onClick={() => setShowAiChat(!showAiChat)}
                    >
                      {showAiChat ? 'Włączony' : 'Wyłączony'}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Temat *</Label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="bg-slate-800 border-purple-500/30 text-white"
                      placeholder="W czym możemy pomóc?"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Wiadomość *</Label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="bg-slate-800 border-purple-500/30 text-white"
                      rows={5}
                      placeholder="Opisz szczegółowo swoje pytanie lub problem..."
                      required
                    />
                  </div>

                  {/* AI Response */}
                  {aiResponse && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="w-5 h-5 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Odpowiedź AI:</span>
                      </div>
                      <p className="text-white">{aiResponse}</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="mt-3 border-emerald-500/30 text-emerald-400"
                        onClick={() => {
                          setAiResponse('');
                          setShowAiChat(false);
                          sendMessageMutation.mutate({ department, subject, message });
                        }}
                      >
                        Potrzebuję kontaktu z człowiekiem
                      </Button>
                    </motion.div>
                  )}

                  <Button
                    type="submit"
                    disabled={sendMessageMutation.isPending}
                    className="w-full bg-gradient-to-r from-purple-600 to-cyan-600"
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Wyślij wiadomość
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          {DEPARTMENTS.map((dept) => {
            const Icon = dept.icon;
            return (
              <Card key={dept.value} className="bg-[#1a1a2e]/30 border-purple-500/10">
                <CardContent className="p-4 text-center">
                  <Icon className="w-8 h-8 mx-auto text-purple-400 mb-2" />
                  <p className="text-white font-medium">{dept.label}</p>
                  <p className="text-cyan-400 text-sm">{dept.email}</p>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}