import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, MapPin, Users, TrendingUp } from 'lucide-react';

const COUNTRIES_DATA = [
  { code: 'PL', name: 'Polska', flag: '🇵🇱', users: 12450, growth: 15, x: 52, y: 32 },
  { code: 'DE', name: 'Niemcy', flag: '🇩🇪', users: 3210, growth: 8, x: 45, y: 30 },
  { code: 'GB', name: 'UK', flag: '🇬🇧', users: 2890, growth: 12, x: 38, y: 28 },
  { code: 'FR', name: 'Francja', flag: '🇫🇷', users: 1540, growth: 5, x: 40, y: 38 },
  { code: 'US', name: 'USA', flag: '🇺🇸', users: 980, growth: 22, x: 15, y: 35 },
  { code: 'NL', name: 'Holandia', flag: '🇳🇱', users: 720, growth: 10, x: 44, y: 28 },
  { code: 'CZ', name: 'Czechy', flag: '🇨🇿', users: 650, growth: 7, x: 50, y: 33 },
  { code: 'ES', name: 'Hiszpania', flag: '🇪🇸', users: 430, growth: 18, x: 35, y: 45 },
];

export default function GeographicReachMap({ campaignData }) {
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  
  const totalUsers = COUNTRIES_DATA.reduce((sum, c) => sum + c.users, 0);
  const maxUsers = Math.max(...COUNTRIES_DATA.map(c => c.users));

  return (
    <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center gap-2">
          <Globe className="w-5 h-5 text-cyan-400" />
          Zasięg geograficzny
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Simplified World Map */}
          <div className="lg:col-span-2 relative h-80 bg-slate-800/50 rounded-xl overflow-hidden">
            {/* Background gradient representing world */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800" />
            
            {/* Continent shapes (simplified) */}
            <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full opacity-20">
              {/* Europe */}
              <path d="M35 20 L55 18 L58 25 L55 35 L45 40 L35 35 L32 28 Z" fill="#6366f1" />
              {/* Americas */}
              <path d="M5 15 L20 10 L25 25 L22 45 L15 55 L8 45 L5 30 Z" fill="#6366f1" />
              {/* Asia */}
              <path d="M60 15 L85 10 L95 25 L90 40 L75 45 L60 35 Z" fill="#6366f1" />
            </svg>
            
            {/* Country markers */}
            {COUNTRIES_DATA.map((country, i) => {
              const size = 8 + (country.users / maxUsers) * 20;
              const isHovered = hoveredCountry === country.code;
              const isSelected = selectedCountry === country.code;
              
              return (
                <motion.div
                  key={country.code}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="absolute cursor-pointer"
                  style={{ left: `${country.x}%`, top: `${country.y}%` }}
                  onMouseEnter={() => setHoveredCountry(country.code)}
                  onMouseLeave={() => setHoveredCountry(null)}
                  onClick={() => setSelectedCountry(country.code === selectedCountry ? null : country.code)}
                >
                  {/* Pulse effect */}
                  <div 
                    className={`absolute rounded-full animate-ping ${isHovered || isSelected ? 'bg-purple-400' : 'bg-cyan-400'}`}
                    style={{ 
                      width: size + 8, 
                      height: size + 8, 
                      left: -4, 
                      top: -4,
                      opacity: 0.3 
                    }}
                  />
                  {/* Marker */}
                  <div 
                    className={`rounded-full transition-all duration-300 flex items-center justify-center text-xs ${
                      isHovered || isSelected 
                        ? 'bg-purple-500 shadow-lg shadow-purple-500/50' 
                        : 'bg-cyan-500'
                    }`}
                    style={{ width: size, height: size }}
                  >
                    {size > 20 && country.flag}
                  </div>
                  
                  {/* Tooltip */}
                  {(isHovered || isSelected) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute left-1/2 -translate-x-1/2 -top-16 z-10 bg-slate-800 border border-purple-500/30 rounded-lg p-3 min-w-32 shadow-xl"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{country.flag}</span>
                        <span className="text-white font-medium">{country.name}</span>
                      </div>
                      <div className="text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Użytkownicy:</span>
                          <span className="text-cyan-400">{country.users.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Wzrost:</span>
                          <span className="text-emerald-400">+{country.growth}%</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
            
            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur rounded-lg p-3">
              <p className="text-slate-400 text-xs mb-2">Rozmiar = liczba użytkowników</p>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-500" />
                <span className="text-slate-300 text-xs">Aktywni użytkownicy</span>
              </div>
            </div>
          </div>

          {/* Country List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-sm">Top kraje</span>
              <Badge className="bg-purple-500/20 text-purple-400">
                <Users className="w-3 h-3 mr-1" />
                {totalUsers.toLocaleString()}
              </Badge>
            </div>
            
            {COUNTRIES_DATA.sort((a, b) => b.users - a.users).map((country, i) => (
              <motion.div
                key={country.code}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  selectedCountry === country.code 
                    ? 'bg-purple-500/20 border border-purple-500/50' 
                    : 'bg-slate-800/50 hover:bg-slate-800'
                }`}
                onClick={() => setSelectedCountry(country.code === selectedCountry ? null : country.code)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{country.flag}</span>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{country.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-xs">{country.users.toLocaleString()} użytkowników</span>
                      <Badge className="bg-emerald-500/20 text-emerald-400 text-xs py-0">
                        <TrendingUp className="w-2 h-2 mr-1" />
                        {country.growth}%
                      </Badge>
                    </div>
                  </div>
                  <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"
                      style={{ width: `${(country.users / maxUsers) * 100}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}