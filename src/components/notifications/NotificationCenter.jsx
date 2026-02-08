import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, X, Check, CheckCheck, AlertTriangle, DollarSign,
  Target, MessageSquare, Settings, Loader2, Trash2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const typeConfig = {
  campaign_budget_low: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  campaign_goal_reached: { icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  commission_paid: { icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/20' },
  message_received: { icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  status_update: { icon: Bell, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  system: { icon: Settings, color: 'text-slate-400', bg: 'bg-slate-500/20' },
  promo: { icon: Bell, color: 'text-pink-400', bg: 'bg-pink-500/20' },
};

export default function NotificationCenter({ userId }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => base44.entities.Notification.filter({ user_id: userId }, '-created_date', 50),
    enabled: !!userId,
    refetchInterval: 30000
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => 
        base44.entities.Notification.update(n.id, { is_read: true })
      ));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const formatTime = (date) => {
    const now = new Date();
    const d = new Date(date);
    const diff = (now - d) / 1000;
    
    if (diff < 60) return 'Teraz';
    if (diff < 3600) return `${Math.floor(diff / 60)} min temu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} godz. temu`;
    return d.toLocaleDateString('pl-PL');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/10">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-96 p-0 bg-[#1a1a2e] border-purple-500/30"
        align="end"
      >
        <div className="p-4 border-b border-purple-500/20 flex items-center justify-between">
          <h3 className="text-white font-semibold">Powiadomienia</h3>
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="text-purple-400 hover:text-purple-300"
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              Oznacz wszystkie
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
            </div>
          ) : notifications.length > 0 ? (
            <AnimatePresence>
              {notifications.map((notif, i) => {
                const config = typeConfig[notif.type] || typeConfig.system;
                const Icon = config.icon;
                
                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: i * 0.03 }}
                    className={`p-4 border-b border-purple-500/10 hover:bg-slate-800/50 transition-colors ${
                      !notif.is_read ? 'bg-purple-500/5' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium ${!notif.is_read ? 'text-white' : 'text-slate-300'}`}>
                            {notif.title}
                          </p>
                          {!notif.is_read && (
                            <div className="w-2 h-2 rounded-full bg-purple-500 shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-slate-400 text-xs mt-1 line-clamp-2">{notif.message}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-slate-500 text-xs">{formatTime(notif.created_date)}</span>
                          <div className="flex gap-1">
                            {!notif.is_read && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="w-6 h-6 text-slate-400 hover:text-white"
                                onClick={() => markReadMutation.mutate(notif.id)}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-6 h-6 text-slate-400 hover:text-red-400"
                              onClick={() => deleteMutation.mutate(notif.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Brak powiadomień</p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}