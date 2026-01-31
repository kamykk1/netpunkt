import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign, Eye, ExternalLink, CheckCircle2 } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function AdCard({ ad, isCompleted }) {
  const formatCurrency = (cents) => `${(cents / 100).toFixed(2)} zł`;

  const handleViewAd = () => {
    window.open(createPageUrl('AdViewer') + `?id=${ad.id}`, '_blank');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`relative overflow-hidden rounded-2xl bg-white border transition-all duration-300 ${
        isCompleted ? 'border-slate-200 opacity-60' : 'border-slate-100 hover:border-emerald-200 hover:shadow-md'
      }`}
    >
      {ad.image_url && (
        <div className="relative h-40 overflow-hidden">
          <img 
            src={ad.image_url} 
            alt={ad.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <Badge className="absolute top-3 left-3 bg-white/90 text-slate-700 hover:bg-white">
            {ad.category}
          </Badge>
        </div>
      )}
      
      <div className="p-5">
        <h3 className="font-semibold text-slate-900 text-lg mb-2">{ad.title}</h3>
        <p className="text-sm text-slate-500 line-clamp-2 mb-4">{ad.description}</p>
        
        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1.5 text-emerald-600">
            <DollarSign className="w-4 h-4" />
            <span className="font-semibold">{formatCurrency(ad.reward_amount)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <Clock className="w-4 h-4" />
            <span>{ad.view_duration || 30}s</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <Eye className="w-4 h-4" />
            <span>{ad.current_views || 0}/{ad.max_views}</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isCompleted ? (
            <motion.div
              key="completed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 text-slate-500"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">Ukończone</span>
            </motion.div>
          ) : (
            <motion.div key="action" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Button
                onClick={handleViewAd}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl h-11"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Oglądaj i zarabiaj {formatCurrency(ad.reward_amount)}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}