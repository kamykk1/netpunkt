import React from 'react';

const FRAME_STYLES = {
  'neon-purple': 'p-[3px] bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 shadow-[0_0_12px_rgba(139,92,246,0.6)]',
  'gold': 'p-[3px] bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.5)]',
  'cyberpunk': 'p-[3px] bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 shadow-[0_0_12px_rgba(6,182,212,0.6)]',
};

export default function UserAvatar({ user, size = 'md', className = '' }) {
  const sizes = { sm: 'w-8 h-8 text-lg', md: 'w-10 h-10 text-2xl', lg: 'w-14 h-14 text-4xl', xl: 'w-20 h-20 text-5xl' };
  const sz = sizes[size] || sizes.md;
  const frame = user?.active_frame ? FRAME_STYLES[user.active_frame] : null;

  const inner = user?.avatar_url ? (
    <img src={user.avatar_url} className="w-full h-full object-cover rounded-full" alt={user.display_name || user.full_name} />
  ) : (
    <div className={`w-full h-full rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center`}>
      <span>{user?.avatar_emoji || '😀'}</span>
    </div>
  );

  if (frame) {
    return (
      <div className={`${sz} rounded-full ${frame} ${className}`}>
        <div className="w-full h-full rounded-full overflow-hidden bg-[#0a0a0f]">
          {inner}
        </div>
      </div>
    );
  }

  return (
    <div className={`${sz} rounded-full overflow-hidden border border-purple-500/40 shrink-0 ${className}`}>
      {inner}
    </div>
  );
}