'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Search, X, Clock } from 'lucide-react';

const EMOJI_CATEGORIES: { name: string; icon: string; emojis: string[] }[] = [
  {
    name: 'Smileys',
    icon: '😀',
    emojis: [
      '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃',
      '😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙',
      '🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🫢',
      '🤫','🤔','🫡','🤐','🤨','😐','😑','😶','🫥','😏',
      '😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷',
      '🤒','🤕','🤢','🤮','🥵','🥶','🥴','😵','🤯','🤠',
      '🥳','🥸','😎','🤓','🧐','😕','🫤','😟','🙁','😮',
      '😯','😲','😳','🥺','🥹','😦','😧','😨','😰','😥',
      '😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱',
      '😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡',
    ],
  },
  {
    name: 'Gestures',
    icon: '👋',
    emojis: [
      '👋','🤚','🖐️','✋','🖖','🫱','🫲','🫳','🫴','👌',
      '🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉',
      '👆','🖕','👇','☝️','🫵','👍','👎','✊','👊','🤛',
      '🤜','👏','🙌','🫶','👐','🤲','🤝','🙏','✍️','💅',
      '🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🧠',
    ],
  },
  {
    name: 'Hearts',
    icon: '❤️',
    emojis: [
      '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔',
      '❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💘','💝',
      '💟','♥️','🫶','💑','💏','👫','👬','👭','💐','🌹',
    ],
  },
  {
    name: 'Objects',
    icon: '📎',
    emojis: [
      '📱','💻','⌨️','🖥️','🖨️','🖱️','🖲️','💾','💿','📀',
      '📷','📸','📹','🎥','📽️','🎞️','📞','☎️','📟','📠',
      '📺','📻','🎙️','🎚️','🎛️','⏱️','⏲️','⏰','🕰️','⌛',
      '📡','🔋','🔌','💡','🔦','🕯️','📁','📂','📄','📃',
      '📑','📊','📈','📉','📌','📍','📎','🖇️','📏','📐',
      '✂️','🗑️','📝','✏️','🖊️','🖋️','✒️','📖','📚','📒',
    ],
  },
  {
    name: 'Symbols',
    icon: '✅',
    emojis: [
      '✅','❌','⭕','❗','❓','‼️','⁉️','💯','🔥','✨',
      '⭐','🌟','💫','⚡','💥','💢','💤','💬','👁️‍🗨️','🗨️',
      '🗯️','💭','🔔','🔕','📣','📢','🏷️','🔖','⚠️','🚫',
      '🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','🔶',
      '🔷','🔸','🔹','🔺','🔻','💠','🔘','🔳','🔲','🏁',
    ],
  },
  {
    name: 'Nature',
    icon: '🌿',
    emojis: [
      '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨',
      '🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐒',
      '🌸','🌺','🌻','🌹','🌷','🌼','💐','🌿','🍀','🍁',
      '🍂','🍃','🌲','🌳','🌴','🌵','🌾','🍄','🌊','🌈',
    ],
  },
];

const RECENTLY_USED_KEY = 'kgisl_recent_emojis';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState(0);
  const [search, setSearch] = useState('');
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Load recent emojis
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENTLY_USED_KEY);
      if (stored) setRecentEmojis(JSON.parse(stored));
    } catch {}
    searchRef.current?.focus();
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    // Update recent
    const updated = [emoji, ...recentEmojis.filter((e) => e !== emoji)].slice(0, 24);
    setRecentEmojis(updated);
    try {
      localStorage.setItem(RECENTLY_USED_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Filter emojis by search
  const filteredCategories = search.trim()
    ? EMOJI_CATEGORIES.map((cat) => ({
        ...cat,
        emojis: cat.emojis.filter(() => {
          // Simple: just show all when searching by name
          return cat.name.toLowerCase().includes(search.toLowerCase());
        }),
      })).filter((cat) => cat.emojis.length > 0)
    : EMOJI_CATEGORIES;

  // If searching, flatten and search all
  const allEmojis = search.trim()
    ? EMOJI_CATEGORIES.flatMap((c) => c.emojis)
    : null;

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 mb-2 w-[320px] bg-white rounded-2xl border border-[#d2d2d7] shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 overflow-hidden"
    >
      {/* Search */}
      <div className="p-2.5 border-b border-[#d2d2d7]/50">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#86868b]" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search emoji…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-8 rounded-lg bg-[#f5f5f7] border border-[#d2d2d7]/50 text-[13px] text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:ring-1 focus:ring-[#0071e3]/30"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Category tabs */}
      {!search && (
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[#d2d2d7]/30 overflow-x-auto">
          {recentEmojis.length > 0 && (
            <button
              onClick={() => setActiveCategory(-1)}
              className={cn(
                'shrink-0 h-7 w-7 rounded-lg flex items-center justify-center text-[14px] transition-colors',
                activeCategory === -1 ? 'bg-[#0071e3]/10' : 'hover:bg-[#f5f5f7]'
              )}
              title="Recently Used"
            >
              <Clock className="h-3.5 w-3.5 text-[#86868b]" />
            </button>
          )}
          {EMOJI_CATEGORIES.map((cat, i) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(i)}
              className={cn(
                'shrink-0 h-7 w-7 rounded-lg flex items-center justify-center text-[14px] transition-colors',
                activeCategory === i ? 'bg-[#0071e3]/10' : 'hover:bg-[#f5f5f7]'
              )}
              title={cat.name}
            >
              {cat.icon}
            </button>
          ))}
        </div>
      )}

      {/* Emoji grid */}
      <div className="h-[220px] overflow-y-auto p-2">
        {search ? (
          // Search results
          allEmojis && allEmojis.length > 0 ? (
            <div className="grid grid-cols-8 gap-0.5">
              {allEmojis.map((emoji, i) => (
                <button
                  key={`${emoji}-${i}`}
                  onClick={() => handleSelect(emoji)}
                  className="h-9 w-9 rounded-lg hover:bg-[#f5f5f7] flex items-center justify-center text-[22px] transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-center text-[13px] text-[#86868b] py-8">No emojis found</p>
          )
        ) : (
          <>
            {/* Recent */}
            {activeCategory === -1 && recentEmojis.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider px-1 mb-1.5">Recently Used</p>
                <div className="grid grid-cols-8 gap-0.5">
                  {recentEmojis.map((emoji, i) => (
                    <button
                      key={`recent-${i}`}
                      onClick={() => handleSelect(emoji)}
                      className="h-9 w-9 rounded-lg hover:bg-[#f5f5f7] flex items-center justify-center text-[22px] transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Active category */}
            {activeCategory >= 0 && (
              <div>
                <p className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider px-1 mb-1.5">
                  {EMOJI_CATEGORIES[activeCategory].name}
                </p>
                <div className="grid grid-cols-8 gap-0.5">
                  {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji, i) => (
                    <button
                      key={`${emoji}-${i}`}
                      onClick={() => handleSelect(emoji)}
                      className="h-9 w-9 rounded-lg hover:bg-[#f5f5f7] flex items-center justify-center text-[22px] transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
