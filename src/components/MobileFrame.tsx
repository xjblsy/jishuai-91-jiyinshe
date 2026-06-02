/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShieldAlert, LogOut, Lock, Cloud, Wifi, Battery } from 'lucide-react';
import { useVault } from '../context/VaultContext';

interface MobileFrameProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLock: () => void;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children, activeTab, setActiveTab, onLock }) => {
  const { isUnlocked, isSyncing, currentUser, friends, lockVault } = useVault();
  const [time, setTime] = useState<string>("09:41");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours().toString().padStart(2, '0');
      let minutes = now.getMinutes().toString().padStart(2, '0');
      setTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#1A1A1A] flex flex-col md:flex-row items-center justify-center p-0 md:p-4 sans">
      
      {/* Visual background details to establish context */}
      <div className="absolute top-6 left-8 hidden lg:block max-w-xs text-xs text-[#1A1A1A]/50 font-mono space-y-1 select-none">
        <div className="serif italic text-3xl font-bold tracking-tight text-[#1A1A1A] mb-2">ECHOES.</div>
        <div className="flex items-center gap-1.5 text-emerald-700 font-semibold mb-2">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
          <span>VAULT STATUS: SECURE</span>
        </div>
        <p className="text-[10px]">E2E AES-GCM Encrypted</p>
        <p className="text-[10px]">Client PBKDF2 Derivation</p>
        {currentUser && <p className="text-emerald-700 text-[10px]">Sync: Connected as {currentUser.email?.slice(0, 15)}...</p>}
      </div>

      {/* Main smartphone device outer shell */}
      <div className="w-full h-screen md:max-w-[420px] md:h-[840px] bg-white md:rounded-[48px] md:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.12)] border-0 md:border-[10px] md:border-[#1a1a1a] relative flex flex-col overflow-hidden leading-relaxed">
        
        {/* Dynamic status bar/notch decoration */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-transparent z-50 hidden md:flex items-center justify-between px-7">
          {/* Mock Time */}
          <span className="text-xs font-semibold text-[#1a1a1a]/80 tracking-tight">{time}</span>
          
          {/* Center physical notch */}
          <div className="w-28 h-4.5 bg-[#1a1a1a] rounded-b-xl absolute left-1/2 -translate-x-1/2 top-0 flex items-center justify-center">
            <div className="w-10 h-1 bg-[#333333] rounded-full" />
          </div>

          {/* Device indicators */}
          <div className="flex items-center gap-1.5 text-[#1a1a1a]/80">
            {isUnlocked && <Lock className="w-2.5 h-2.5 text-amber-600" />}
            {currentUser && <Cloud className={`w-3 h-3 ${isSyncing ? 'text-zinc-800 animate-spin' : 'text-emerald-600'}`} />}
            <Wifi className="w-3 h-3" />
            <Battery className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Dynamic Application body screen */}
        <div className="flex-1 bg-[#FDFCF8] pt-0 md:pt-8 pb-[env(safe-area-inset-bottom,0px)] overflow-hidden flex flex-col relative">
          {children}
        </div>

        {/* Dynamic Mobile Tab Navigation Bar (Visible only when unlocked) */}
        {isUnlocked && (
          <div className="h-14 bg-white border-t border-black/5 flex items-center justify-around px-2 z-40 pb-2">
            <button
              id="tab-home"
              onClick={() => setActiveTab('feed')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                activeTab === 'feed' ? 'text-black font-semibold' : 'text-black/40 hover:text-black'
              }`}
            >
              <span className="text-[10px] tracking-widest uppercase font-bold">语录画集</span>
              <span className="text-[9px] font-mono opacity-60">HOMEPAGE</span>
            </button>

            <button
              id="tab-friends"
              onClick={() => setActiveTab('friends')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                activeTab === 'friends' ? 'text-black font-semibold' : 'text-black/40 hover:text-black'
              }`}
            >
              <div className="relative">
                <span className="text-[10px] tracking-widest uppercase font-bold">挚友档案</span>
                {friends.length > 0 && (
                  <span className="absolute -top-1.5 -right-3 px-1 bg-black text-white text-[8px] font-extrabold rounded-full">
                    {friends.length}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-mono opacity-60">FRIENDS</span>
            </button>

            <button
              id="tab-sync"
              onClick={() => setActiveTab('sync')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                activeTab === 'sync' ? 'text-black font-semibold' : 'text-black/40 hover:text-black'
              }`}
            >
              <span className="text-[10px] tracking-widest uppercase font-bold">云端同步</span>
              <span className="text-[9px] font-mono opacity-60">BACKUP</span>
            </button>

            <button
              id="tab-lock"
              onClick={() => {
                onLock();
                lockVault();
              }}
              className="flex flex-col items-center justify-center flex-1 py-1 text-rose-600 hover:text-rose-700 transition-colors"
            >
              <span className="text-[10px] tracking-widest uppercase font-bold">紧急上锁</span>
              <span className="text-[9px] font-mono opacity-60">LOCK</span>
            </button>
          </div>
        )}

        {/* Bottom indicator bar mockup */}
        <div className="h-4 bg-white border-t border-black/5 hidden md:flex items-center justify-center pb-1">
          <div className="w-28 h-1 bg-[#1a1a1a]/20 rounded-full" />
        </div>
      </div>
    </div>
  );
};
