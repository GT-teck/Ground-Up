import React, { useState } from 'react';
import { ArrowLeft, Trophy, Gauge, Car, DollarSign, Medal, Flame, Users } from 'lucide-react';
import { LeaderboardCategory } from '../types';
import { LEADERBOARD_DATA } from '../data/gameData';
import { soundFx } from '../utils/audio';

interface LeaderboardMenuProps {
  onBack: () => void;
}

export const LeaderboardMenu: React.FC<LeaderboardMenuProps> = ({ onBack }) => {
  const [activeCategory, setActiveCategory] = useState<LeaderboardCategory>('top_speed');
  const [timeScope, setTimeScope] = useState<'all_time' | 'season'>('all_time');

  const entries = LEADERBOARD_DATA[activeCategory];

  const handleCategoryChange = (cat: LeaderboardCategory) => {
    soundFx.playSelect();
    setActiveCategory(cat);
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-300 to-amber-600 text-black font-black text-xs flex items-center justify-center shadow-lg shadow-amber-500/30">
          1
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-200 to-zinc-400 text-black font-black text-xs flex items-center justify-center shadow">
          2
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 text-amber-200 font-black text-xs flex items-center justify-center shadow">
          3
        </div>
      );
    }
    return (
      <div className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-400 font-bold text-xs flex items-center justify-center font-tech">
        #{rank}
      </div>
    );
  };

  const getCategoryIcon = (cat: LeaderboardCategory) => {
    switch (cat) {
      case 'top_speed':
        return <Gauge size={16} />;
      case 'most_sold_cars':
        return <Car size={16} />;
      case 'money_earned':
        return <DollarSign size={16} />;
    }
  };

  const getCategoryTitle = (cat: LeaderboardCategory) => {
    switch (cat) {
      case 'top_speed':
        return 'Top Speed Records';
      case 'most_sold_cars':
        return 'Most Sold Cars (Restorations)';
      case 'money_earned':
        return 'Total Money Earned';
    }
  };

  return (
    <div className="flex-1 flex flex-col p-5 relative overflow-hidden">
      {/* Ambient lighting */}
      <div className="absolute top-12 -right-10 w-52 h-52 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0">
        <button
          id="btn-leaderboard-back"
          onClick={() => {
            soundFx.playBack();
            onBack();
          }}
          className="flex items-center gap-2 text-xs font-bold font-tech uppercase text-zinc-400 hover:text-amber-400 transition-colors py-1.5 px-2.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Main Menu</span>
        </button>

        <div className="text-right">
          <div className="text-xs font-bold tracking-widest text-amber-500 uppercase font-display flex items-center gap-1.5 justify-end">
            <Trophy size={13} className="text-amber-400" />
            LEADERBOARD
          </div>
          <div className="text-[10px] text-zinc-400 font-tech uppercase">Global Motorsport Rankings</div>
        </div>
      </div>

      {/* THE 3 EXPLICIT LEADERBOARD OPTIONS */}
      <div className="mt-3">
        <div className="text-[10px] font-tech uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center justify-between">
          <span>Ranking Category</span>
          <div className="flex gap-1">
            <button
              onClick={() => {
                soundFx.playClick();
                setTimeScope('all_time');
              }}
              className={`text-[9px] uppercase px-1.5 py-0.5 rounded ${
                timeScope === 'all_time' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                setTimeScope('season');
              }}
              className={`text-[9px] uppercase px-1.5 py-0.5 rounded ${
                timeScope === 'season' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Season 1
            </button>
          </div>
        </div>

        {/* 3 Option Buttons */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-900/90 rounded-xl border border-zinc-800">
          {/* Option 1: Top Speed */}
          <button
            id="tab-lb-top-speed"
            onClick={() => handleCategoryChange('top_speed')}
            className={`py-2 px-1 rounded-lg text-[11px] font-bold font-display uppercase tracking-tight flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeCategory === 'top_speed'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Gauge size={16} />
            <span className="truncate">Top Speed</span>
          </button>

          {/* Option 2: Most Sold Cars */}
          <button
            id="tab-lb-most-sold"
            onClick={() => handleCategoryChange('most_sold_cars')}
            className={`py-2 px-1 rounded-lg text-[11px] font-bold font-display uppercase tracking-tight flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeCategory === 'most_sold_cars'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Car size={16} />
            <span className="truncate">Most Sold</span>
          </button>

          {/* Option 3: Money Earned */}
          <button
            id="tab-lb-money-earned"
            onClick={() => handleCategoryChange('money_earned')}
            className={`py-2 px-1 rounded-lg text-[11px] font-bold font-display uppercase tracking-tight flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeCategory === 'money_earned'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <DollarSign size={16} />
            <span className="truncate">Money Earned</span>
          </button>
        </div>
      </div>

      {/* Category Banner Title */}
      <div className="mt-3 px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-xs font-bold uppercase font-display text-white">
          <span className="text-amber-400">{getCategoryIcon(activeCategory)}</span>
          <span>{getCategoryTitle(activeCategory)}</span>
        </div>
        <span className="text-[10px] font-tech text-zinc-400 uppercase">
          Live Standings
        </span>
      </div>

      {/* Leaderboard Table / Feed */}
      <div className="flex-1 overflow-y-auto mt-2 space-y-2 pr-1">
        {entries.map((entry) => {
          const isMe = entry.isCurrentUser;
          return (
            <div
              key={entry.rank + entry.playerName}
              id={`lb-row-${entry.rank}`}
              className={`p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                isMe
                  ? 'bg-amber-950/30 border-amber-500/70 shadow-md ring-1 ring-amber-500/30'
                  : 'bg-zinc-900/70 border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {getRankBadge(entry.rank)}

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-xs font-bold uppercase font-display truncate ${
                        isMe ? 'text-amber-300' : 'text-zinc-200'
                      }`}
                    >
                      {entry.playerName}
                    </span>
                    {entry.badge && (
                      <span
                        className={`text-[9px] font-tech px-1.5 py-0.2 rounded font-bold uppercase ${
                          isMe
                            ? 'bg-amber-500 text-black'
                            : 'bg-zinc-800 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {entry.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-tech truncate">
                    {entry.carModel} • {entry.subtitle}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0 pl-2">
                <div
                  className={`text-sm font-black font-display tracking-tight ${
                    isMe
                      ? 'text-amber-400'
                      : entry.rank === 1
                      ? 'text-yellow-400'
                      : 'text-zinc-100'
                  }`}
                >
                  {entry.scoreDisplay}
                </div>
                <div className="text-[9px] text-zinc-500 font-tech uppercase">
                  {activeCategory === 'top_speed'
                    ? 'Speed'
                    : activeCategory === 'most_sold_cars'
                    ? 'Units'
                    : 'Revenue'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Player Sticky Rank Footer */}
      <div className="pt-2.5 mt-2 border-t border-zinc-800 flex items-center justify-between shrink-0 text-xs">
        <div className="flex items-center gap-1.5 text-zinc-400 font-tech">
          <Users size={12} className="text-amber-400" />
          <span>Connected: 48,209 Tuners</span>
        </div>
        <div className="text-right font-tech text-amber-400">
          Your Rank: <strong className="text-white font-display">#18 Top Speed</strong>
        </div>
      </div>
    </div>
  );
};
