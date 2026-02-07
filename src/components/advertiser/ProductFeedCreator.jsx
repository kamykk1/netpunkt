import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShoppingBag, Search, Plus, Loader2, ExternalLink, 
  Sparkles, Image, Tag, Star, Package
} from 'lucide-react';

// Symulowane produkty - w produkcji pobierane z API
const MOCK_ALIEXPRESS_PRODUCTS = [
  { id: 'ali1', name: 'Bezprzewodowe słuchawki TWS', price: 45.99, originalPrice: 89.99, rating: 4.8, orders: 15420, image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=200', source: 'aliexpress' },
  { id: 'ali2', name: 'Smart Watch Sport', price: 129.00, originalPrice: 249.00, rating: 4.6, orders: 8932, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200', source: 'aliexpress' },
  { id: 'ali3', name: 'LED Ring Light 26cm', price: 35.50, originalPrice: 70.00, rating: 4.9, orders: 23451, image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=200', source: 'aliexpress' },
];

const MOCK_TEMU_PRODUCTS = [
  { id: 'temu1', name: 'Organizer biurkowy', price: 19.99, originalPrice: 45.00, rating: 4.7, orders: 5621, image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=200', source: 'temu' },
  { id: 'temu2', name: 'Zestaw pędzli do makijażu', price: 24.99, originalPrice: 59.00, rating: 4.5, orders: 12890, image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200', source: 'temu' },
  { id: 'temu3', name: 'Kubek termiczny 500ml', price: 15.50, originalPrice: 35.00, rating: 4.8, orders: 34521, image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=200', source: 'temu' },
];

export default function ProductFeedCreator({ onSelectProduct }) {
  const [activeTab, setActiveTab] = useState('aliexpress');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [generating, setGenerating] = useState(false);

  const searchProducts = async () => {
    setLoading(true);
    // Symulacja wyszukiwania - w produkcji wywołanie API
    setTimeout(() => {
      if (activeTab === 'aliexpress') {
        setProducts(MOCK_ALIEXPRESS_PRODUCTS.filter(p => 
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) || !searchQuery
        ));
      } else {
        setProducts(MOCK_TEMU_PRODUCTS.filter(p => 
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) || !searchQuery
        ));
      }
      setLoading(false);
    }, 1000);
  };

  const toggleProduct = (product) => {
    setSelectedProducts(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) {
        return prev.filter(p => p.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const generateDynamicAd = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Wybierz przynajmniej jeden produkt');
      return;
    }

    setGenerating(true);
    
    // Generuj kreację z AI
    const productNames = selectedProducts.map(p => p.name).join(', ');
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Stwórz krótki, chwytliwy tekst reklamowy dla produktów: ${productNames}. 
      Tekst ma być po polsku, max 2 zdania, zachęcający do kliknięcia.`,
      response_json_schema: {
        type: "object",
        properties: {
          headline: { type: "string" },
          description: { type: "string" },
          cta: { type: "string" }
        }
      }
    });

    const adConfig = {
      type: 'product_feed',
      products: selectedProducts,
      headline: result.headline,
      description: result.description,
      cta: result.cta,
      source: activeTab
    };

    onSelectProduct?.(adConfig);
    setGenerating(false);
    toast.success('Dynamiczna kreacja wygenerowana!');
  };

  const discount = (original, current) => Math.round((1 - current / original) * 100);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-purple-500/20">
          <TabsTrigger value="aliexpress" className="data-[state=active]:bg-orange-500">
            🛒 AliExpress
          </TabsTrigger>
          <TabsTrigger value="temu" className="data-[state=active]:bg-orange-600">
            📦 Temu
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {/* Search Bar */}
          <div className="flex gap-2 mb-4">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Szukaj produktów..."
              className="bg-slate-800 border-purple-500/30 text-white"
              onKeyDown={(e) => e.key === 'Enter' && searchProducts()}
            />
            <Button onClick={searchProducts} disabled={loading} className="bg-purple-600">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>

          {/* Selected Products */}
          {selectedProducts.length > 0 && (
            <Card className="bg-purple-500/10 border-purple-500/30 mb-4">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white font-medium">
                    Wybrano: {selectedProducts.length} produkt(ów)
                  </span>
                  <Button
                    onClick={generateDynamicAd}
                    disabled={generating}
                    className="bg-gradient-to-r from-purple-600 to-cyan-600"
                  >
                    {generating ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Generuj kreację
                  </Button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {selectedProducts.map((p) => (
                    <Badge
                      key={p.id}
                      className="bg-purple-500/20 text-purple-300 cursor-pointer hover:bg-purple-500/30"
                      onClick={() => toggleProduct(p)}
                    >
                      {p.name} ✕
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(products.length > 0 ? products : activeTab === 'aliexpress' ? MOCK_ALIEXPRESS_PRODUCTS : MOCK_TEMU_PRODUCTS).map((product) => {
              const isSelected = selectedProducts.find(p => p.id === product.id);
              return (
                <Card
                  key={product.id}
                  className={`bg-[#1a1a2e]/50 border-2 cursor-pointer transition-all ${
                    isSelected ? 'border-purple-500 ring-2 ring-purple-500/30' : 'border-purple-500/20 hover:border-purple-500/40'
                  }`}
                  onClick={() => toggleProduct(product)}
                >
                  <CardContent className="p-4">
                    <div className="relative mb-3">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                      <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                        -{discount(product.originalPrice, product.price)}%
                      </Badge>
                    </div>
                    <h4 className="text-white font-medium text-sm line-clamp-2 mb-2">{product.name}</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-emerald-400 font-bold">{product.price.toFixed(2)} zł</span>
                        <span className="text-slate-500 text-xs line-through ml-2">{product.originalPrice.toFixed(2)} zł</span>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-400 text-xs">
                        <Star className="w-3 h-3 fill-current" />
                        {product.rating}
                      </div>
                    </div>
                    <p className="text-slate-500 text-xs mt-1">
                      <Package className="w-3 h-3 inline mr-1" />
                      {product.orders.toLocaleString()} zamówień
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {products.length === 0 && !loading && (
            <div className="text-center py-8 text-slate-400">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Wyszukaj produkty lub wybierz z dostępnych</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}