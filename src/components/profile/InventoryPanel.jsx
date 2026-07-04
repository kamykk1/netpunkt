import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crown, Smile, Check, Loader2, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const FRAME_STYLES = {
  'neon-purple': 'p-[3px] bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 shadow-[0_0_12px_rgba(139,92,246,0.6)]',
  'gold': 'p-[3px] bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.5)]',
  'cyberpunk': 'p-[3px] bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 shadow-[0_0_12px_rgba(6,182,212,0.6)]',
  'rainbow': 'p-[3px] bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.5)]',
  'ice': 'p-[3px] bg-gradient-to-r from-cyan-300 via-blue-400 to-cyan-300 shadow-[0_0_12px_rgba(59,130,246,0.5)]',
  'fire': 'p-[3px] bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]',
};

export default function InventoryPanel({ user }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('frames');

  const { data: shopProducts = [] } = useQuery({
    queryKey: ['inventoryProducts'],
    queryFn: () => base44.entities.ShopProduct.filter({ status: 'active' }),
  });

  const parseList = (val) => {
    try { return JSON.parse(val || '[]'); } catch { return []; }
  };

  const ownedFrames = parseList(user?.owned_frames);
  const ownedAvatars = parseList(user?.owned_avatars);
  const ownedEmojis = parseList(user?.owned_emojis);
  const activeFrame = user?.active_frame || '';
  const activeEmoji = user?.avatar_emoji || '😀';

  // Map product keys to product data for display info
  const productMap = {};
  shopProducts.forEach(p => {
    const key = p.item_key || p.name;
    productMap[key] = p;
  });

  const equipMutation = useMutation({
    mutationFn: async ({ type, key }) => {
      if (type === 'frame') {
        if (activeFrame === key) {
          // Unequip
          await base44.auth.updateMe({ active_frame: '' });
        } else {
          await base44.auth.updateMe({ active_frame: key });
        }
      } else if (type === 'avatar') {
        if (activeEmoji === key) {
          await base44.auth.updateMe({ avatar_emoji: '😀', avatar_url: null });
        } else {
          await base44.auth.updateMe({ avatar_emoji: key, avatar_url: null });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Wyposażono!');
    },
    onError: (e) => toast.error(e.message),
  });

  const renderFramePreview = (frameKey) => {
    const style = FRAME_STYLES[frameKey] || '';
    return (
      <div className={`w-16 h-16 rounded-full ${style}`}>
        <div className="w-full h-full rounded-full overflow-hidden bg-[#0a0a0f] flex items-center justify-center">
          <span className="text-2xl">{activeEmoji}</span>
        </div>
      </div>
    );
  };

  const renderEmpty = (type) => (
    <div className="text-center py-12">
      <ShoppingBag className="w-12 h-12 mx-auto text-slate-600 mb-3" />
      <p className="text-slate-400 mb-4">Nie masz jeszcze żadnych przedmiotów w tej kategorii</p>
      <Link to={createPageUrl('Shop')}>
        <Button className="bg-gradient-to-r from-purple-600 to-cyan-600">
          <ShoppingBag className="w-4 h-4 mr-2" /> Przejdź do sklepu
        </Button>
      </Link>
    </div>
  );

  return (
    <Card className="bg-[#1a1a2e]/50 border-purple-500/20">
      <CardHeader>
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <Crown className="w-5 h-5 text-cyan-400" /> Ekwipunek
        </CardTitle>
        <p className="text-slate-400 text-sm">Wyposaż zakupione ramki i awatary</p>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-slate-800/50 border border-purple-500/20 mb-4 flex flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="frames" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white text-xs px-3">
              <Crown className="w-3.5 h-3.5 mr-1" /> Ramki ({ownedFrames.length})
            </TabsTrigger>
            <TabsTrigger value="avatars" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white text-xs px-3">
              <Smile className="w-3.5 h-3.5 mr-1" /> Awatary ({ownedAvatars.length})
            </TabsTrigger>
          </TabsList>

          {/* FRAMES */}
          <TabsContent value="frames">
            {ownedFrames.length === 0 ? renderEmpty('frame') : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {ownedFrames.map(key => {
                  const product = productMap[key] || {};
                  const isActive = activeFrame === key;
                  return (
                    <div key={key}
                      className={`p-4 rounded-xl border ${isActive ? 'border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500' : 'border-purple-500/20 bg-slate-800/50'}`}>
                      <div className="flex justify-center mb-3">
                        {renderFramePreview(key)}
                      </div>
                      <p className="text-white text-sm font-medium text-center mb-2">{product.name || key}</p>
                      <Button
                        size="sm"
                        variant={isActive ? 'default' : 'outline'}
                        className={`w-full ${isActive ? 'bg-cyan-600' : 'border-purple-500/30 text-white bg-transparent hover:bg-purple-500/10'}`}
                        disabled={equipMutation.isPending}
                        onClick={() => equipMutation.mutate({ type: 'frame', key })}>
                        {isActive ? <><Check className="w-3 h-3 mr-1" /> Aktywna</> : 'Wyposaż'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* AVATARS */}
          <TabsContent value="avatars">
            {ownedAvatars.length === 0 ? renderEmpty('avatar') : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {ownedAvatars.map(key => {
                  const product = productMap[key] || {};
                  const emojiValue = product.item_value || key;
                  const isActive = activeEmoji === emojiValue;
                  return (
                    <div key={key}
                      className={`p-4 rounded-xl border ${isActive ? 'border-pink-500 bg-pink-500/10 ring-2 ring-pink-500' : 'border-purple-500/20 bg-slate-800/50'}`}>
                      <div className="flex justify-center mb-3">
                        <span className="text-4xl">{emojiValue}</span>
                      </div>
                      <p className="text-white text-xs font-medium text-center mb-2 truncate">{product.name || key}</p>
                      <Button
                        size="sm"
                        variant={isActive ? 'default' : 'outline'}
                        className={`w-full ${isActive ? 'bg-pink-600' : 'border-purple-500/30 text-white bg-transparent hover:bg-purple-500/10'}`}
                        disabled={equipMutation.isPending}
                        onClick={() => equipMutation.mutate({ type: 'avatar', key: emojiValue })}>
                        {isActive ? <><Check className="w-3 h-3 mr-1" /> Aktywny</> : 'Wyposaż'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}