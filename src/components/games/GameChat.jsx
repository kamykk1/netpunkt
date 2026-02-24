import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageCircle, Flag } from 'lucide-react';
import UserAvatar from '@/components/profile/UserAvatar.jsx';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function GameChat({ roomId, currentUser, opponent, chatEnabled, onReport }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    if (!roomId) return;
    base44.entities.GameChat.filter({ room_id: roomId }, 'created_date', 50).then(setMessages);
    const unsub = base44.entities.GameChat.subscribe((ev) => {
      if (ev.data?.room_id === roomId) {
        setMessages(prev => {
          if (ev.type === 'create') return [...prev, ev.data];
          return prev;
        });
      }
    });
    return unsub;
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const moderateAndSend = async (raw) => {
    // AI moderation
    let moderated = raw;
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Jesteś moderatorem czatu gry. Sprawdź tę wiadomość po polsku lub angielsku.
Jeśli zawiera wulgaryzmy, groźby lub mowę nienawiści - zastąp obraźliwe słowa gwiazdkami (***).
Jeśli wiadomość jest normalna - zwróć ją bez zmian.
Wiadomość: "${raw}"`,
        response_json_schema: {
          type: "object",
          properties: {
            message: { type: "string" },
            was_moderated: { type: "boolean" }
          }
        }
      });
      moderated = result.message || raw;
      if (result.was_moderated) toast.warning('Twoja wiadomość została ocenzurowana przez moderatora AI.');
    } catch {}
    await base44.entities.GameChat.create({
      room_id: roomId,
      sender_id: currentUser.id,
      sender_email: currentUser.email,
      sender_name: currentUser.display_name || currentUser.full_name,
      message: moderated
    });
  };

  const sendMessage = async () => {
    if (!text.trim() || !chatEnabled || currentUser?.chat_blocked) return;
    setSending(true);
    await moderateAndSend(text.trim());
    setText('');
    setSending(false);
  };

  if (!chatEnabled) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-3 text-center text-slate-500 text-sm">
        <MessageCircle className="w-5 h-5 mx-auto mb-1 opacity-40" />
        Czat wyłączony
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a2e]/80 border border-purple-500/20 rounded-xl flex flex-col h-64">
      <div className="flex items-center justify-between px-3 py-2 border-b border-purple-500/20">
        <span className="text-white text-sm font-medium flex items-center gap-1">
          <MessageCircle className="w-4 h-4 text-cyan-400" /> Czat
        </span>
        {opponent && (
          <button onClick={() => onReport?.(opponent)}
            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors">
            <Flag className="w-3 h-3" /> Zgłoś
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUser?.id;
          return (
            <div key={msg.id} className={`flex items-start gap-1.5 ${isMe ? 'flex-row-reverse' : ''}`}>
              <div className={`max-w-[80%] px-2.5 py-1.5 rounded-xl text-sm ${
                isMe ? 'bg-purple-500/30 text-white' : 'bg-slate-700/60 text-slate-200'
              }`}>
                {!isMe && <p className="text-cyan-400 text-xs mb-0.5">{msg.sender_name}</p>}
                {msg.message}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {currentUser?.chat_blocked ? (
        <div className="px-3 py-2 text-xs text-red-400 text-center border-t border-purple-500/10">
          Twój czat jest zablokowany przez administratora
        </div>
      ) : (
        <div className="flex gap-2 p-2 border-t border-purple-500/10">
          <Input value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Wpisz wiadomość..." maxLength={200}
            className="bg-slate-800 border-purple-500/30 text-white text-sm h-8" />
          <Button size="icon" className="h-8 w-8 bg-purple-600 shrink-0" onClick={sendMessage} disabled={sending || !text.trim()}>
            <Send className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
}