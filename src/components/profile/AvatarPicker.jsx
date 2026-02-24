import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Camera, Smile } from 'lucide-react';

const EMOJIS = ['😀','😎','🤩','🥷','👑','🦸','🎭','🐉','🦊','🦁','🐯','🦄','🎃','👾','🤖','💀','🎩','🌟','⚡','🔥','💎','🚀','🎮','🏆','🎯'];

export default function AvatarPicker({ user, onUpdated }) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState('emoji'); // 'emoji' | 'photo'
  const fileRef = useRef();

  const handleEmojiSelect = async (emoji) => {
    await base44.auth.updateMe({ avatar_emoji: emoji, avatar_url: null });
    toast.success('Awatar zaktualizowany!');
    onUpdated?.();
    setOpen(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Zdjęcie max 2MB'); return; }
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.auth.updateMe({ avatar_url: file_url, avatar_emoji: null });
    toast.success('Zdjęcie profilowe zaktualizowane!');
    onUpdated?.();
    setUploading(false);
    setOpen(false);
  };

  const avatarDisplay = user?.avatar_url
    ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="avatar" />
    : <span className="text-4xl">{user?.avatar_emoji || '😀'}</span>;

  return (
    <>
      <div className="relative inline-block cursor-pointer group" onClick={() => setOpen(true)}>
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center overflow-hidden border-2 border-purple-500/50">
          {avatarDisplay}
        </div>
        <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="w-5 h-5 text-white" />
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#1a1a2e] border-purple-500/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Zmień awatar</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 mb-4">
            <Button size="sm" variant={tab === 'emoji' ? 'default' : 'outline'}
              className={tab === 'emoji' ? 'bg-purple-600' : 'border-purple-500/30 text-white bg-transparent'}
              onClick={() => setTab('emoji')}>
              <Smile className="w-4 h-4 mr-1" /> Emoji
            </Button>
            <Button size="sm" variant={tab === 'photo' ? 'default' : 'outline'}
              className={tab === 'photo' ? 'bg-purple-600' : 'border-purple-500/30 text-white bg-transparent'}
              onClick={() => setTab('photo')}>
              <Camera className="w-4 h-4 mr-1" /> Zdjęcie
            </Button>
          </div>

          {tab === 'emoji' && (
            <div className="grid grid-cols-5 gap-2">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => handleEmojiSelect(e)}
                  className={`text-3xl p-2 rounded-xl hover:bg-purple-500/20 transition-all ${user?.avatar_emoji === e ? 'bg-purple-500/30 ring-2 ring-purple-500' : ''}`}>
                  {e}
                </button>
              ))}
            </div>
          )}

          {tab === 'photo' && (
            <div className="text-center space-y-4">
              {user?.avatar_url && (
                <img src={user.avatar_url} className="w-24 h-24 rounded-full mx-auto object-cover border-2 border-purple-500" alt="current" />
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              <Button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="bg-purple-600 hover:bg-purple-700">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Camera className="w-4 h-4 mr-2" />}
                {uploading ? 'Przesyłanie...' : 'Wybierz zdjęcie'}
              </Button>
              <p className="text-slate-500 text-xs">Max 2MB, JPG/PNG</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}