import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ExternalLink, Clock, DollarSign, CheckCircle2, X } from 'lucide-react';

export default function AdViewModal({ ad, isOpen, onClose, onComplete }) {
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(ad?.view_duration || 30);
  const intervalRef = useRef(null);

  const formatCurrency = (cents) => `$${(cents / 100).toFixed(2)}`;

  useEffect(() => {
    if (isOpen && ad) {
      setProgress(0);
      setIsCompleted(false);
      setTimeLeft(ad.view_duration || 30);
      
      const duration = (ad.view_duration || 30) * 1000;
      const startTime = Date.now();
      
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min((elapsed / duration) * 100, 100);
        setProgress(newProgress);
        setTimeLeft(Math.max(0, Math.ceil((duration - elapsed) / 1000)));
        
        if (newProgress >= 100) {
          clearInterval(intervalRef.current);
          setIsCompleted(true);
        }
      }, 100);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isOpen, ad]);

  const handleComplete = () => {
    onComplete(ad);
    onClose();
  };

  if (!ad) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
        <div className="relative">
          {ad.image_url && (
            <div className="h-48 overflow-hidden">
              <img 
                src={ad.image_url} 
                alt={ad.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            </div>
          )}
          
          <div className={`${ad.image_url ? 'absolute bottom-0 left-0 right-0 p-6 text-white' : 'p-6 pt-10'}`}>
            <h2 className={`text-2xl font-bold ${ad.image_url ? 'text-white' : 'text-slate-900'}`}>{ad.title}</h2>
          </div>
        </div>

        <div className="p-6 pt-0">
          <p className="text-slate-600 mb-6">{ad.description}</p>

          {ad.url && (
            <a
              href={ad.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-6 font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              Visit Advertiser
            </a>
          )}

          <div className="bg-slate-50 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-400" />
                <span className="text-slate-600">Time Remaining</span>
              </div>
              <span className="text-2xl font-bold text-slate-900">{timeLeft}s</span>
            </div>
            
            <Progress value={progress} className="h-3 mb-4" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                <span className="text-slate-600">Reward</span>
              </div>
              <span className="text-2xl font-bold text-emerald-600">{formatCurrency(ad.reward_amount)}</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {isCompleted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-center gap-3 p-4 bg-emerald-50 rounded-xl">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  <span className="font-semibold text-emerald-700">View Complete!</span>
                </div>
                <Button
                  onClick={handleComplete}
                  className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-lg"
                >
                  Claim {formatCurrency(ad.reward_amount)}
                </Button>
              </motion.div>
            ) : (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-slate-500"
              >
                Keep this window open to complete the view
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}