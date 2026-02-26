import React from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { 
  LayoutDashboard, Shield, Coins, ShoppingBag, LogOut,
  Target, Trophy, Zap, Mail, CreditCard, Users, TrendingUp,
  Gift, Crown, Gamepad2, User
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotificationCenter from '@/components/notifications/NotificationCenter.jsx';

export default function Layout({ children, currentPageName }) {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getMembershipBadge = (level) => {
    const badges = {
      1: { name: 'Bronze', color: 'bg-amber-600' },
      2: { name: 'Silver', color: 'bg-slate-400' },
      3: { name: 'Gold', color: 'bg-yellow-500' },
      4: { name: 'Platinum', color: 'bg-cyan-400' },
      5: { name: 'Diamond', color: 'bg-purple-500' },
    };
    return badges[level] || badges[1];
  };

  const badge = getMembershipBadge(user?.membership_level);

  const menuItems = [
    { name: 'Moje dane', icon: User, page: 'Profile' },
    null,
    { name: 'Panel', icon: LayoutDashboard, page: 'Dashboard' },
    { name: 'Zarabiaj', icon: Coins, page: 'EarnAds' },
    { name: 'Misje', icon: Target, page: 'Missions' },
    { name: 'Sklep', icon: ShoppingBag, page: 'Shop' },
    { name: 'Ranking', icon: Trophy, page: 'Ranking' },
    { name: 'Cashback', icon: Gift, page: 'Cashback' },
    { name: 'Battle Pass', icon: Zap, page: 'BattlePass' },
    { name: 'Partnerzy', icon: Users, page: 'Partners' },
    { name: 'Gry', icon: Gamepad2, page: 'Games' },
    ...(user?.is_advertiser ? [{ name: 'Reklamodawca', icon: TrendingUp, page: 'AdvertiserPanel' }] : [{ name: 'Reklama', icon: TrendingUp, page: 'AdvertiserRegister' }]),
    ...(user?.role === 'admin' || user?.is_moderator ? [{ name: 'Admin', icon: Shield, page: 'AdminPanel' }] : []),
    { name: 'Kontakt', icon: Mail, page: 'Contact' },
    null,
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@700;900&display=swap');
        /* CZCIONKA LOGO: Exo 2 (Bold/Black) — geometryczna, futurystyczna, pełne polskie znaki */
        :root {
          --primary: 139 92 246;
          --primary-foreground: 255 255 255;
          --neon-purple: #8b5cf6;
          --neon-cyan: #06b6d4;
          --neon-pink: #ec4899;
          --neon-green: #10b981;
        }
        .neon-glow {
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(139, 92, 246, 0.3);
        }
        .neon-text {
          text-shadow: 0 0 10px rgba(139, 92, 246, 0.8), 0 0 20px rgba(139, 92, 246, 0.5);
        }
        .gradient-border {
          background: linear-gradient(135deg, #8b5cf6, #06b6d4, #ec4899);
          padding: 1px;
        }
        .logo-text {
          font-family: 'Exo 2', sans-serif;
          font-weight: 900;
          background: linear-gradient(90deg, #8b5cf6, #06b6d4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.5px;
        }
      `}</style>
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f0f18]/90 backdrop-blur-xl border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl('Dashboard')} className="flex items-center">
              <span className="logo-text text-2xl hidden sm:block">netpunkt.pl</span>
              <span className="logo-text text-2xl sm:hidden">np.</span>
            </Link>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              {/* Points Display */}
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-full border border-purple-500/30">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span className="font-bold text-white">{(user?.points_balance || 0).toLocaleString()}</span>
                <span className="text-slate-400 text-sm">pkt</span>
              </div>

              {/* Membership Badge */}
              <Badge className={`${badge.color} text-white hidden sm:flex`}>
                <Crown className="w-3 h-3 mr-1" />
                {badge.name}
              </Badge>

              {/* Notifications */}
              <NotificationCenter userId={user?.id} />

              {/* User avatar dropdown — całe menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-purple-500/30 p-0 overflow-hidden">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="avatar" className="h-10 w-10 object-cover rounded-full" />
                    ) : user?.avatar_emoji ? (
                      <span className="text-xl leading-none">{user.avatar_emoji}</span>
                    ) : (
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-purple-600 to-cyan-500 text-white">
                          {getInitials(user?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#1a1a2e] border-purple-500/30 text-white max-h-[80vh] overflow-y-auto">
                  <div className="px-2 py-1.5">
                    <p className="font-medium text-sm">{user?.full_name}</p>
                    <p className="text-xs text-slate-400">{user?.email}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Coins className="w-3.5 h-3.5 text-yellow-400" />
                      <span className="text-yellow-400 text-xs font-bold">{(user?.points_balance || 0).toLocaleString()} pkt</span>
                      <Badge className={`${badge.color} text-white text-xs py-0 px-1.5 ml-1`}>
                        <Crown className="w-2.5 h-2.5 mr-0.5" />{badge.name}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-purple-500/20" />
                  {menuItems.map((item, i) =>
                    item === null ? (
                      <DropdownMenuSeparator key={`sep-${i}`} className="bg-purple-500/20" />
                    ) : (
                      <DropdownMenuItem key={item.page} asChild>
                        <Link to={createPageUrl(item.page)} className={`flex items-center gap-2 ${currentPageName === item.page ? 'text-purple-400' : 'text-slate-300 hover:text-white'}`}>
                          <item.icon className="w-4 h-4" /> {item.name}
                        </Link>
                      </DropdownMenuItem>
                    )
                  )}
                  <DropdownMenuItem onClick={() => base44.auth.logout()} className="text-red-400 gap-2">
                    <LogOut className="w-4 h-4" /> Wyloguj się
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>


      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-64px)]">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#0f0f18] border-t border-purple-500/20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="logo-text text-xl">netpunkt.pl</span>
            <p className="text-sm text-slate-500">© 2025 netpunkt.pl. Wszelkie prawa zastrzeżone.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}