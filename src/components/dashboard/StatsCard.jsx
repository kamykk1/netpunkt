import React from 'react';
import { motion } from 'framer-motion';

export default function StatsCard({ title, value, icon: Icon, gradient, subtitle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 p-6 shadow-sm hover:shadow-lg transition-shadow duration-300"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 -mr-10 -mt-10 ${gradient}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 tracking-wide uppercase">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${gradient}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
}