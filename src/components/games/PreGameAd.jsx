import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';
import { ExternalLink, X, Clock } from 'lucide-react';

// Tradedoubler partner program ID — admin can override via site settings
const DEFAULT_TD_PROGRAM_ID = '304455'; // example Tradedoubler PL program

export default function PreGameAd({ gameName, gameIcon, onStart, onSkip }) {
  const [countdown, setCountdown] = useState(5);
  const [adClicked, setAdClicked] = useState(false);
  const canSkip = countdown <= 0;

  const { data: siteSettings = [] } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: () => base44.entities.SiteSettings.list()
  });

  const getSetting = (key) => siteSettings.find(s => s.setting_key === key)?.setting_value;

  const adEnabled = getSetting('games_pre_ad_enabled') !== 'false';
  const customAdUrl = getSetting('games_pre_ad_url');
  const customAdImage = getSetting('games_pre_ad_image');
  const customAdTitle = getSetting('games_pre_ad_title') || 'Sprawdź naszych partnerów!';
  const tdProgramId = getSetting('games_td_program_id') || DEFAULT_TD_PROGRAM_ID;

  // If ads disabled, go straight to game
  useEffect(() => {
    if (!adEnabled) { onStart(); }
  }, [adEnabled]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Build ad URL: custom or Tradedoubler
  const adUrl = customAdUrl || `https://clk.tradedoubler.com/click?p=${tdProgramId}&a=3369379`;
  const adImage = customAdImage || null;

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

        {/* Ad Content */}
        <div className="p-4 space-y-3">
          <p className="text-slate-400 text-xs text-center uppercase tracking-wider">Reklama partnera</p>

          {adImage ? (
            <a href={adUrl} target="_blank" rel="noopener noreferrer sponsored"
              onClick={() => setAdClicked(true)}
              className="block rounded-xl overflow-hidden border border-purple-500/20 hover:border-purple-500/50 transition-all">
              <img src={adImage} alt={customAdTitle} className="w-full h-40 object-cover" />
            </a>
          ) : (
            <a href={adUrl} target="_blank" rel="noopener noreferrer sponsored"
              onClick={() => setAdClicked(true)}
              className="block p-6 rounded-xl border border-purple-500/20 hover:border-purple-500/50 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 transition-all text-center group">
              <div className="text-4xl mb-3">🛒</div>
              <p className="text-white font-semibold text-sm">{customAdTitle}</p>
              <p className="text-slate-400 text-xs mt-1">Kliknij aby dowiedzieć się więcej</p>
              <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-purple-400 group-hover:text-purple-300">
                <ExternalLink className="w-3 h-3" /> Odwiedź ofertę
              </div>
            </a>
          )}

          {adClicked && (
            <p className="text-emerald-400 text-xs text-center">✓ Dziękujemy za odwiedzenie partnera!</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-4 pb-4">
          <Button
            variant="outline"
            onClick={onSkip}
            disabled={!canSkip}
            className="flex-1 border-slate-600 text-slate-400 bg-transparent text-sm"
          >
            {canSkip ? 'Pomiń' : `Pomiń (${countdown}s)`}
          </Button>
          <Button
            onClick={onStart}
            className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-sm"
          >
            Zagraj!
          </Button>
        </div>
      </motion.div>
    </div>
  );
}