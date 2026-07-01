import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { 
  ShoppingBag, Coins, Star, Zap, Gift, Crown, Tag,
  Loader2, ShoppingCart, Check, ExternalLink
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PRODUCT_TYPE_CONFIG = {
  vip: { name: 'VIP', icon: Crown, color: 'from-yellow-500 to-amber-600' },
  boost: { name: 'Boost', icon: Zap, color: 'from-purple-500 to-pink-500' },
  voucher: { name: 'Voucher', icon: Gift, color: 'from-emerald-500 to-teal-500' },
  physical: { name: 'Fizyczny', icon: ShoppingBag, color: 'from-blue-500 to-indigo-500' },
  aliexpress: { name: 'AliExpress', icon: Tag, color: 'from-orange-500 to-red-500' },
  avatar: { name: 'Awatar', icon: Star, color: 'from-pink-500 to-rose-600' },
  chat_emoji: { name: 'Emotki', icon: Star, color: 'from-violet-500 to-purple-600' },
  profile_frame: { name: 'Ramka', icon: Crown, color: 'from-cyan-500 to-blue-600' },
};

export default function Shop() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeType, setActiveType] = useState('all');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['shopProducts'],
    queryFn: () => base44.entities.ShopProduct.filter({ status: 'active' })
  });

  const { data: settings = [] } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: () => base44.entities.SiteSettings.list()
  });

  const getSetting = (key, defaultValue) => {
    const setting = settings.find(s => s.setting_key === key);
    return setting ? setting.setting_value : defaultValue;
  };

  const pointRate = parseFloat(getSetting('point_rate', '0.10'));

  const purchaseMutation = useMutation({
    mutationFn: async (product) => {
      const newBalance = (user.points_balance || 0) - product.points_price;
      
      await base44.entities.ShopOrder.create({
        user_id: user.id,
        user_email: user.email,
        product_id: product.id,
        product_name: product.name,
        points_paid: product.points_price,
        payment_method: 'points',
        status: product.product_type === 'vip' || product.product_type === 'boost' ? 'completed' : 'pending'
      });

      await base44.auth.updateMe({
        points_balance: newBalance
      });

      await base44.entities.PointsHistory.create({
        user_id: user.id,
        user_email: user.email,
        amount: -product.points_price,
        balance_after: newBalance,
        type: 'shop_purchase',
        description: `Zakup: ${product.name}`,
        reference_id: product.id
      });

      // Aktywuj VIP lub Boost
      if (product.product_type === 'vip' && product.vip_days) {
        const vipUntil = new Date();
        vipUntil.setDate(vipUntil.getDate() + product.vip_days);
        await base44.auth.updateMe({ vip_until: vipUntil.toISOString() });
      }

      if (product.product_type === 'boost' && product.boost_multiplier) {
        const boostUntil = new Date();
        boostUntil.setHours(boostUntil.getHours() + (product.boost_hours || 24));
        await base44.auth.updateMe({ 
          active_boost_multiplier: product.boost_multiplier,
          boost_until: boostUntil.toISOString()
        });
      }

      // Awatary, emotki, ramki — dodaj do kolekcji użytkownika
      if (['avatar', 'chat_emoji', 'profile_frame'].includes(product.product_type)) {
        const fieldMap = {
          avatar: 'owned_avatars',
          chat_emoji: 'owned_emojis',
          profile_frame: 'owned_frames',
        };
        const fieldName = fieldMap[product.product_type];
        const currentList = JSON.parse(user[fieldName] || '[]');
        if (!currentList.includes(product.item_key || product.name)) {
          currentList.push(product.item_key || product.name);
          const update = { [fieldName]: JSON.stringify(currentList) };
          // Automatycznie aktywuj ramkę przy zakupie
          if (product.product_type === 'profile_frame') update.active_frame = product.item_key || product.name;
          // Automatycznie aktywuj awatar-emoji przy zakupie
          if (product.product_type === 'avatar' && product.item_value) update.avatar_emoji = product.item_value;
          await base44.auth.updateMe(update);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setSelectedProduct(null);
      toast.success('Zakup udany! 🎉');
    }
  });

  const filteredProducts = products.filter(p => {
    if (activeType === 'all') return true;
    return p.product_type === activeType;
  });

  const canAfford = (product) => (user?.points_balance || 0) >= product.points_price;

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
              <h1 className="text-3xl font-bold text-white">Sklep z nagrodami</h1>
              <p className="text-slate-400 mt-1">Wymieniaj punkty na nagrody</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-full border border-purple-500/30">
              <Coins className="w-5 h-5 text-yellow-400" />
              <span className="font-bold text-white text-lg">{(user?.points_balance || 0).toLocaleString()}</span>
              <span className="text-slate-400">pkt</span>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeType} onValueChange={setActiveType} className="mb-6">
          <TabsList className="bg-[#1a1a2e] border border-purple-500/20 p-1 flex-wrap h-auto">
            <TabsTrigger value="all" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              Wszystkie
            </TabsTrigger>
            <TabsTrigger value="vip" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <Crown className="w-4 h-4 mr-1" /> VIP
            </TabsTrigger>
            <TabsTrigger value="boost" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <Zap className="w-4 h-4 mr-1" /> Boost
            </TabsTrigger>
            <TabsTrigger value="voucher" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <Gift className="w-4 h-4 mr-1" /> Vouchery
            </TabsTrigger>
            <TabsTrigger value="aliexpress" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <Tag className="w-4 h-4 mr-1" /> AliExpress
            </TabsTrigger>
            <TabsTrigger value="avatar" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <Star className="w-4 h-4 mr-1" /> Awatary
            </TabsTrigger>
            <TabsTrigger value="chat_emoji" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <Star className="w-4 h-4 mr-1" /> Emotki
            </TabsTrigger>
            <TabsTrigger value="profile_frame" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <Crown className="w-4 h-4 mr-1" /> Ramki
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => {
              const config = PRODUCT_TYPE_CONFIG[product.product_type] || PRODUCT_TYPE_CONFIG.voucher;
              const Icon = config.icon;
              const affordable = canAfford(product);
              
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`bg-[#1a1a2e]/50 border-purple-500/20 overflow-hidden group ${!affordable ? 'opacity-60' : ''}`}>
                    {product.image_url ? (
                      <div className="relative h-40 overflow-hidden">
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e] to-transparent" />
                        <Badge className={`absolute top-3 left-3 bg-gradient-to-r ${config.color} text-white`}>
                          <Icon className="w-3 h-3 mr-1" />
                          {config.name}
                        </Badge>
                      </div>
                    ) : (
                      <div className={`h-32 bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                        <Icon className="w-12 h-12 text-white/80" />
                      </div>
                    )}
                    <CardContent className="p-5">
                      <h3 className="font-semibold text-white text-lg mb-2">{product.name}</h3>
                      <p className="text-slate-400 text-sm line-clamp-2 mb-4">{product.description}</p>
                      
                      {/* Benefits */}
                      {product.product_type === 'vip' && product.vip_days && (
                        <p className="text-purple-400 text-sm mb-2">🎖️ {product.vip_days} dni VIP</p>
                      )}
                      {product.product_type === 'boost' && product.boost_multiplier && (
                        <p className="text-pink-400 text-sm mb-2">⚡ x{product.boost_multiplier} przez {product.boost_hours}h</p>
                      )}
                      {product.product_type === 'avatar' && (
                        <p className="text-pink-400 text-sm mb-2">{product.item_value ? `Awatar: ${product.item_value}` : 'Specjalny awatar'}</p>
                      )}
                      {product.product_type === 'chat_emoji' && (
                        <p className="text-violet-400 text-sm mb-2">Unikalne emotki do czatu w grze</p>
                      )}
                      {product.product_type === 'profile_frame' && (
                        <p className="text-cyan-400 text-sm mb-2">Unikalna ramka dla Twojego profilu</p>
                      )}
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-1.5 text-yellow-400">
                          <Coins className="w-5 h-5" />
                          <span className="font-bold text-lg">{product.points_price.toLocaleString()}</span>
                          <span className="text-slate-400 text-sm">pkt</span>
                        </div>
                        {product.cash_price > 0 && (
                          <span className="text-slate-500 text-sm">
                            lub {(product.cash_price / 100).toFixed(2)} zł
                          </span>
                        )}
                      </div>

                      <Button
                        onClick={() => setSelectedProduct(product)}
                        disabled={!affordable}
                        className={`w-full ${affordable 
                          ? `bg-gradient-to-r ${config.color} hover:opacity-90` 
                          : 'bg-slate-700 cursor-not-allowed'} text-white`}
                      >
                        {affordable ? (
                          <>
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Kup za punkty
                          </>
                        ) : (
                          'Brak punktów'
                        )}
                      </Button>

                      {product.aliexpress_url && (
                        <a 
                          href={product.aliexpress_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block mt-2"
                        >
                          <Button variant="outline" className="w-full border-orange-500/30 text-orange-400">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Zobacz na AliExpress
                          </Button>
                        </a>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <ShoppingBag className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Brak produktów</h3>
            <p className="text-slate-400">Wróć później, aby zobaczyć nowe nagrody</p>
          </motion.div>
        )}
      </div>

      {/* Purchase Confirmation */}
      <AlertDialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <AlertDialogContent className="bg-[#1a1a2e] border-purple-500/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Potwierdź zakup</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Czy na pewno chcesz kupić <span className="text-white font-semibold">{selectedProduct?.name}</span> za{' '}
              <span className="text-yellow-400 font-semibold">{selectedProduct?.points_price.toLocaleString()} pkt</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-purple-500/30 text-white">Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => purchaseMutation.mutate(selectedProduct)}
              disabled={purchaseMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-cyan-600"
            >
              {purchaseMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Kup teraz
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}