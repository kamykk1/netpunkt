import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PreGameBanner({ gameName, gameIcon, onStart, onSkip }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const [clicked, setClicked] = useState(false);

  const { data: banners = [] } = useQuery({
    queryKey: ['gameBanners'],
    queryFn: () => base44.entities.GameBanner.filter({ is_active: true }, 'sort_order', 20)
  });

  const { data: siteSettings = [] } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: () => base44.entities.SiteSettings.list()
  });

  const adEnabled = siteSettings.find(s => s.setting_key === 'games_pre_ad_enabled')?.setting_value !== 'false';

  useEffect(() => {
    if (!adEnabled) { onStart(); return; }
  }, [adEnabled]);

  // Use active banners or fallback placeholder
  const activeBanners = banners.length > 0 ? banners : [{
    title: 'Sprawdź naszych partnerów!',
    image_url: null,
    target_url: null,
    description: 'Wspieraj platformę klikając w reklamy partnerów.',
    display_duration: 5
  }];

  const current = activeBanners[currentIdx] || activeBanners[0];
  const duration = current.display_duration || 5;

  useEffect(() => {
    setCountdown(duration);
  }, [currentIdx, duration]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Auto-rotate banners
  useEffect(() => {
    if (activeBanners.length <= 1) return;
    if (countdown > 0) return;
    const t = setTimeout(() => {
      setCurrentIdx(i => (i + 1) % activeBanners.length);
    }, 2000);
    return () => clearTimeout(t);
  }, [countdown, activeBanners.length]);

  const canSkip = countdown <= 0;

  if (!adEnabled) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#1a1a2e] border border-purple-500/30 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-purple-500/10 border-b border-purple-500/20">
          <div className="flex items-center gap-2">
            <span className="text-xl">{gameIcon}</span>
            <span className="text-white font-semibold text-sm">{gameName}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Clock className="w-3 h-3" />
            {!canSkip ? `Pomiń za ${countdown}s` : 'Możesz pominąć'}
          </div>
        </div>

        {/* Banner */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-xs uppercase tracking-wider">Reklama</p>
            {activeBanners.length > 1 && (
              <div className="flex items-center gap-1">
                {activeBanners.map((_, i) => (
                  <button key={i} onClick={() => setCurrentIdx(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentIdx ? 'bg-purple-400' : 'bg-slate-600'}`} />
                ))}
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={currentIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {current.image_url ? (
                <a href={current.target_url || '#'} target="_blank" rel="noopener noreferrer sponsored"
                  onClick={() => setClicked(true)}
                  className="block rounded-xl overflow-hidden border border-purple-500/20 hover:border-purple-500/50 transition-all">
                  <img src={current.image_url} alt={current.title} className="w-full h-40 object-cover" />
                  <div className="p-2 bg-slate-800/80">
                    <p className="text-white text-sm font-medium">{current.title}</p>
                    {current.description && <p className="text-slate-400 text-xs">{current.description}</p>}
                  </div>
                </a>
              ) : (
                <a href={current.target_url || '#'} target="_blank" rel="noopener noreferrer sponsored"
                  onClick={() => setClicked(true)}
                  className="block p-6 rounded-xl border border-purple-500/20 hover:border-purple-500/50 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 transition-all text-center group">
                  <div className="text-4xl mb-3">📢</div>
                  <p className="text-white font-semibold text-sm">{current.title}</p>
                  {current.description && <p className="text-slate-400 text-xs mt-1">{current.description}</p>}
                  {current.target_url && (
                    <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-purple-400 group-hover:text-purple-300">
                      <ExternalLink className="w-3 h-3" /> Odwiedź
                    </div>
                  )}
                </a>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Nav arrows */}
          {activeBanners.length > 1 && (
            <div className="flex justify-between">
              <button onClick={() => setCurrentIdx(i => (i - 1 + activeBanners.length) % activeBanners.length)}
                className="p-1.5 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setCurrentIdx(i => (i + 1) % activeBanners.length)}
                className="p-1.5 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {clicked && <p className="text-emerald-400 text-xs text-center">✓ Dziękujemy!</p>}
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-4 pb-4">
          <Button variant="outline" onClick={onSkip} disabled={!canSkip}
            className="flex-1 border-slate-600 text-slate-400 bg-transparent text-sm">
            {canSkip ? 'Pomiń' : `Pomiń (${countdown}s)`}
          </Button>
          <Button onClick={onStart} className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-sm">
            Zagraj!
          </Button>
        </div>
      </motion.div>
    </div>
  );
}