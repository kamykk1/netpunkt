import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Coins, Eye, Clock, Play, Monitor, FileText, Mail,
  Loader2, Filter, ChevronDown
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createPageUrl } from '@/utils';

const AD_TYPE_CONFIG = {
  ptc: { name: 'PTC', icon: Monitor, color: 'from-purple-500 to-indigo-500', label: 'Kliknij' },
  ptr: { name: 'PTR', icon: FileText, color: 'from-cyan-500 to-blue-500', label: 'Czytaj' },
  ptv: { name: 'PTV', icon: Play, color: 'from-pink-500 to-rose-500', label: 'Oglądaj' },
  email: { name: 'Email', icon: Mail, color: 'from-emerald-500 to-teal-500', label: 'Email' },
};

export default function EarnAds() {
  const [viewedAds, setViewedAds] = useState(new Set());
  const [activeType, setActiveType] = useState('all');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: ads = [], isLoading } = useQuery({
    queryKey: ['activeAds'],
    queryFn: () => base44.entities.Advertisement.filter({ status: 'active' })
  });

  const { data: myViews = [] } = useQuery({
    queryKey: ['myAdViews', user?.id],
    queryFn: () => base44.entities.AdView.filter({ user_id: user?.id }),
    enabled: !!user?.id
  });

  const { data: settings = [] } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: () => base44.entities.SiteSettings.list()
  });

  useEffect(() => {
    if (myViews.length > 0) {
      setViewedAds(new Set(myViews.filter(v => v.completed).map(v => v.advertisement_id)));
    }
  }, [myViews]);

  // Refresh on tab focus
  useEffect(() => {
    const handleFocus = () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['myAdViews'] });
      queryClient.invalidateQueries({ queryKey: ['activeAds'] });
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [queryClient]);

  const getSetting = (key, defaultValue) => {
    const setting = settings.find(s => s.setting_key === key);
    return setting ? setting.setting_value : defaultValue;
  };

  const eventMultiplier = parseFloat(getSetting('event_multiplier', '1'));
  const isEventActive = eventMultiplier > 1;

  const filteredAds = ads.filter(ad => {
    if (viewedAds.has(ad.id)) return false;
    if ((ad.current_views || 0) >= (ad.max_views || Infinity)) return false;
    if (activeType !== 'all' && ad.ad_type !== activeType) return false;
    return true;
  });

  const handleViewAd = (ad) => {
    window.open(createPageUrl('AdViewer') + `?id=${ad.id}`, '_blank');
  };

  const adCounts = {
    all: ads.filter(ad => !viewedAds.has(ad.id)).length,
    ptc: ads.filter(ad => !viewedAds.has(ad.id) && ad.ad_type === 'ptc').length,
    ptr: ads.filter(ad => !viewedAds.has(ad.id) && ad.ad_type === 'ptr').length,
    ptv: ads.filter(ad => !viewedAds.has(ad.id) && ad.ad_type === 'ptv').length,
    email: ads.filter(ad => !viewedAds.has(ad.id) && ad.ad_type === 'email').length,
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Zarabiaj punkty</h1>
              <p className="text-slate-400 mt-1">Oglądaj reklamy i zbieraj punkty</p>
            </div>
            
            {isEventActive && (
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30"
              >
                <span className="text-yellow-400 font-bold">🔥 EVENT x{eventMultiplier} PUNKTÓW!</span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-[#1a1a2e]/50 border border-purple-500/20">
            <p className="text-slate-400 text-sm">Dostępne reklamy</p>
            <p className="text-2xl font-bold text-white">{filteredAds.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-[#1a1a2e]/50 border border-purple-500/20">
            <p className="text-slate-400 text-sm">Obejrzane dziś</p>
            <p className="text-2xl font-bold text-white">{viewedAds.size}</p>
          </div>
          <div className="p-4 rounded-xl bg-[#1a1a2e]/50 border border-purple-500/20">
            <p className="text-slate-400 text-sm">Twoje punkty</p>
            <p className="text-2xl font-bold text-yellow-400">{(user?.points_balance || 0).toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-[#1a1a2e]/50 border border-purple-500/20">
            <p className="text-slate-400 text-sm">Poziom</p>
            <p className="text-2xl font-bold text-purple-400">Lv.{user?.membership_level || 1}</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeType} onValueChange={setActiveType} className="mb-6">
          <TabsList className="bg-[#1a1a2e] border border-purple-500/20 p-1">
            <TabsTrigger value="all" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              Wszystkie ({adCounts.all})
            </TabsTrigger>
            <TabsTrigger value="ptc" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <Monitor className="w-4 h-4 mr-1" /> PTC ({adCounts.ptc})
            </TabsTrigger>
            <TabsTrigger value="ptr" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <FileText className="w-4 h-4 mr-1" /> PTR ({adCounts.ptr})
            </TabsTrigger>
            <TabsTrigger value="ptv" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <Play className="w-4 h-4 mr-1" /> PTV ({adCounts.ptv})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Ads Grid */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : filteredAds.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredAds.map((ad, index) => {
                const config = AD_TYPE_CONFIG[ad.ad_type] || AD_TYPE_CONFIG.ptc;
                const Icon = config.icon;
                const pointsWithEvent = Math.floor((ad.points_reward || 0) * eventMultiplier * (user?.active_boost_multiplier || 1));
                
                return (
                  <motion.div
                    key={ad.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="bg-[#1a1a2e]/50 border-purple-500/20 hover:border-purple-500/40 transition-all overflow-hidden group">
                      {ad.image_url && (
                        <div className="relative h-32 overflow-hidden">
                          <img 
                            src={ad.image_url} 
                            alt={ad.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e] to-transparent" />
                          <Badge className={`absolute top-3 left-3 bg-gradient-to-r ${config.color} text-white`}>
                            <Icon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>
                      )}
                      <CardContent className="p-5">
                        {!ad.image_url && (
                          <Badge className={`mb-3 bg-gradient-to-r ${config.color} text-white`}>
                            <Icon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                        )}
                        <h3 className="font-semibold text-white text-lg mb-2 line-clamp-1">{ad.title}</h3>
                        <p className="text-slate-400 text-sm line-clamp-2 mb-4">{ad.description}</p>
                        
                        <div className="flex items-center gap-4 mb-4 text-sm">
                          <div className="flex items-center gap-1.5 text-yellow-400">
                            <Coins className="w-4 h-4" />
                            <span className="font-bold">{pointsWithEvent} pkt</span>
                            {eventMultiplier > 1 && (
                              <span className="text-xs text-orange-400">(x{eventMultiplier})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Clock className="w-4 h-4" />
                            <span>{ad.view_duration || 30}s</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Eye className="w-4 h-4" />
                            <span>{ad.current_views || 0}/{ad.max_views}</span>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleViewAd(ad)}
                          className={`w-full bg-gradient-to-r ${config.color} hover:opacity-90 text-white`}
                        >
                          <Icon className="w-4 h-4 mr-2" />
                          {config.label} i zarabiaj
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Eye className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Brak dostępnych reklam</h3>
            <p className="text-slate-400">Sprawdź później, aby znaleźć nowe możliwości zarobku</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}