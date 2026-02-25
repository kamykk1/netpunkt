import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const DEFAULT_SEGMENTS = [
  { label: '10 pkt', points: 10, color: '#8b5cf6' },
  { label: '25 pkt', points: 25, color: '#06b6d4' },
  { label: '5 pkt', points: 5, color: '#ec4899' },
  { label: '50 pkt', points: 50, color: '#f59e0b' },
  { label: '0 pkt', points: 0, color: '#475569' },
  { label: '100 pkt', points: 100, color: '#10b981' },
  { label: '15 pkt', points: 15, color: '#3b82f6' },
  { label: '💎 500', points: 500, color: '#f43f5e' },
];

export default function FortuneWheel({ user }) {
  const canvasRef = useRef(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [rotation, setRotation] = useState(0);
  const rotRef = useRef(0);
  const [lastSpin, setLastSpin] = useState(null);
  const [segments, setSegments] = useState(DEFAULT_SEGMENTS);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  const { data: siteSettings = [] } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: () => base44.entities.SiteSettings.list()
  });

  useEffect(() => {
    const wSeg = siteSettings.find(s => s.setting_key === 'wheel_segments');
    const wCd = siteSettings.find(s => s.setting_key === 'wheel_cooldown_hours');
    if (wSeg) { try { setSegments(JSON.parse(wSeg.setting_value)); } catch {} }
    // Check last spin from user data
    if (user?.last_wheel_spin) {
      const hours = parseInt(wCd?.setting_value || '24');
      const elapsed = (Date.now() - new Date(user.last_wheel_spin).getTime()) / 3600000;
      const left = Math.max(0, hours - elapsed);
      setCooldownLeft(left);
    }
  }, [siteSettings, user]);

  useEffect(() => {
    drawWheel(rotRef.current);
  }, [segments, rotation]);

  const drawWheel = (rot) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 10;
    const n = segments.length;
    const arc = (2 * Math.PI) / n;
    ctx.clearRect(0, 0, W, H);

    segments.forEach((seg, i) => {
      const start = rot + i * arc - Math.PI / 2;
      const end = start + arc;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, start, end);
      ctx.fillStyle = seg.color;
      ctx.fill();
      ctx.strokeStyle = '#0a0a0f';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(seg.label, R - 10, 4);
      ctx.restore();
    });

    // Center circle
    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f0f18';
    ctx.fill();
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Pointer
    ctx.beginPath();
    ctx.moveTo(cx + R + 8, cy);
    ctx.lineTo(cx + R - 14, cy - 10);
    ctx.lineTo(cx + R - 14, cy + 10);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
  };

  const spin = async () => {
    if (spinning || cooldownLeft > 0) return;
    setSpinning(true);
    setResult(null);

    const n = segments.length;
    const winIdx = Math.floor(Math.random() * n);
    const arc = (2 * Math.PI) / n;
    // Extra full rotations + land on winIdx
    const extra = (5 + Math.floor(Math.random() * 5)) * 2 * Math.PI;
    const targetAngle = extra + (2 * Math.PI - (winIdx * arc)) - Math.PI / 2 - arc / 2;

    const startRot = rotRef.current;
    const duration = 4000;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentRot = startRot + targetAngle * eased;
      rotRef.current = currentRot % (2 * Math.PI);
      drawWheel(rotRef.current);
      if (progress < 1) { requestAnimationFrame(animate); }
      else {
        setRotation(rotRef.current);
        setSpinning(false);
        const won = segments[winIdx];
        setResult(won);
        if (won.points > 0) {
          base44.auth.updateMe({
            points_balance: (user.points_balance || 0) + won.points,
            last_wheel_spin: new Date().toISOString()
          });
          toast.success(`🎡 Wygrałeś ${won.label}!`);
        } else {
          base44.auth.updateMe({ last_wheel_spin: new Date().toISOString() });
          toast('Tym razem bez wygranej. Spróbuj jutro!');
        }
        const wCd = siteSettings.find(s => s.setting_key === 'wheel_cooldown_hours');
        setCooldownLeft(parseInt(wCd?.setting_value || '24'));
      }
    };
    requestAnimationFrame(animate);
  };

  const fmtCd = (h) => {
    const hh = Math.floor(h);
    const mm = Math.floor((h - hh) * 60);
    return `${hh}h ${mm}m`;
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="relative">
        <canvas ref={canvasRef} width={280} height={280} className="rounded-full" />
      </div>
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
            className={`px-6 py-3 rounded-2xl text-white font-bold text-lg text-center`}
            style={{ background: result.color }}>
            {result.points > 0 ? `🎉 Wygrałeś ${result.label}!` : '😔 Tym razem nic...'}
          </motion.div>
        )}
      </AnimatePresence>
      {cooldownLeft > 0 ? (
        <div className="text-center">
          <Badge className="bg-slate-700 text-slate-300 text-sm px-4 py-2">
            ⏳ Następny spin za: {fmtCd(cooldownLeft)}
          </Badge>
        </div>
      ) : (
        <Button onClick={spin} disabled={spinning}
          className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold px-8 h-12 text-base">
          {spinning ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Kręci się...</> : <><Gift className="w-4 h-4 mr-2" />Zakręć!</>}
        </Button>
      )}
      <p className="text-slate-500 text-xs">Jedno kręcenie raz na 24h</p>
    </div>
  );
}