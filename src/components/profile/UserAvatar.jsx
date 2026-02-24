import React from 'react';

export default function UserAvatar({ user, size = 'md', className = '' }) {
  const sizes = { sm: 'w-8 h-8 text-lg', md: 'w-10 h-10 text-2xl', lg: 'w-14 h-14 text-4xl', xl: 'w-20 h-20 text-5xl' };
  const sz = sizes[size] || sizes.md;

  if (user?.avatar_url) {
    return (
      <div className={`${sz} rounded-full overflow-hidden border border-purple-500/40 shrink-0 ${className}`}>
        <img src={user.avatar_url} className="w-full h-full object-cover" alt={user.display_name || user.full_name} />
      </div>
    );
  }

  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center border border-purple-500/40 shrink-0 ${className}`}>
      <span>{user?.avatar_emoji || '😀'}</span>
    </div>
  );
}