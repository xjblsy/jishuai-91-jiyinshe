/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, KeyRound, Unlock, Eye, EyeOff, RotateCcw, Lock, Feather, ShieldAlert, Award } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { CustomConfirmModal } from './NostalgiaExtras';

export const VaultLockscreen: React.FC = () => {
  const { isConfigured, setupVault, unlockVault, passphraseError, resetVault } = useVault();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showModalReset, setShowModalReset] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setTimeout(async () => {
      if (!isConfigured) {
        if (password !== confirmPassword) {
          alert("两次输入密码不一致，请重新检查！");
          setLoading(false);
          return;
        }
        await setupVault(password);
      } else {
        await unlockVault(password);
      }
      setLoading(false);
    }, 500); // UI smoother delay
  };

  const handleHardReset = () => {
    setShowModalReset(true);
  };

  const handleConfirmReset = () => {
    resetVault();
    setPassword("");
    setConfirmPassword("");
    setShowResetConfirm(false);
    setShowModalReset(false);
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-6 bg-[#0E0E11] text-zinc-100 overflow-y-auto font-sans relative select-none">
      {/* Immersive Dark Cosmic Background Elements (鲲鹏之海/天空) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
        <div className="absolute -top-[10%] -left-[10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.06)_0%,transparent_60%)]" />
        {/* Subtle dynamic background graphic: grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)]" />
      </div>

      {/* Immersive Kunpeng Soaring Wings in the background */}
      <div className="absolute inset-x-0 top-[20%] flex justify-between px-6 pointer-events-none opacity-[0.03] select-none">
        <Feather className="w-36 h-36 text-[#D4AF37] -rotate-45 transform origin-bottom-right" />
        <Feather className="w-36 h-36 text-[#D4AF37] rotate-45 transform origin-bottom-left scale-x-[-1]" />
      </div>

      {/* Top Section: Shield Trust Bar */}
      <div className="flex items-center justify-between w-full max-w-sm mx-auto bg-zinc-900/60 border border-zinc-800 px-3.5 py-1.5 rounded-full z-10">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span className="text-[9px] tracking-wider font-bold text-zinc-300 uppercase">
            端对端安全加密保护
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[8.5px] font-mono font-bold text-emerald-500">SECURE</span>
        </div>
      </div>

      {/* Center Section: "91" Creative Fusion Logo & Totem Banner with Kunpeng Elements */}
      <div className="flex flex-col items-center text-center mt-8 z-10">
        {/* Creative "91" Fusion Icon Frame with Kunpeng Feather Accents */}
        <div className="relative flex items-center justify-center mb-5">
          {/* Left Feather Accent */}
          <div className="absolute -left-12 opacity-30 animate-pulse duration-[3000ms] pointer-events-none">
            <Feather className="w-6 h-6 text-[#D4AF37] -rotate-12" />
          </div>

          <div className="relative w-22 h-22 flex items-center justify-center bg-gradient-to-b from-zinc-800/80 to-zinc-950/90 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-zinc-700/50 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/10 to-transparent" />
            {/* A glowing circular indicator in center */}
            <div className="absolute inset-[3px] rounded-[21px] border border-zinc-800 bg-zinc-950 flex flex-col items-center justify-center p-1">
              
              {/* Overlay graphics resembling Kunpeng wing feathers */}
              <div className="absolute -bottom-1 -right-1 opacity-20 transform rotate-12">
                <Feather className="w-10 h-10 text-[#D4AF37]" />
              </div>

              {/* "9" and "1" Creative Fusion Display */}
              <div className="relative flex items-baseline leading-none select-none pl-1">
                <span className="text-4xl font-black text-[#D4AF37] tracking-tighter filter drop-shadow-[0_2px_8px_rgba(212,175,55,0.4)] font-sans">9</span>
                <span className="text-4.5xl font-extralight text-zinc-100 tracking-tighter font-serif relative -left-0.5 select-none text-shadow-sm">1</span>
              </div>
            </div>
          </div>

          {/* Right Feather Accent */}
          <div className="absolute -right-12 opacity-30 animate-pulse duration-[3000ms] pointer-events-none">
            <Feather className="w-6 h-6 text-[#D4AF37] rotate-12 scale-x-[-1]" />
          </div>
        </div>

        {/* Brand Name Typography */}
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white tracking-widest leading-none">
            九一集英社
          </h1>
          <div className="flex items-center justify-center gap-1.5 text-[9px] font-mono tracking-widest text-[#D4AF37] font-bold uppercase">
            <span>JIUYI JIYINGSHE CLAN</span>
            <span className="text-zinc-650">•</span>
            <span>MEMORIES ARCHIVES</span>
          </div>
        </div>
      </div>

      {/* Bottom Form Section */}
      <div className="my-auto py-6 max-w-sm w-full mx-auto z-10">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2 px-1">
              <label className="block text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                {!isConfigured ? "1. 请创建九一专属密钥密码" : "校验密码证书以开启档案馆目录"}
              </label>
              <div className="flex items-center gap-1">
                <span className="text-[8px] bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 px-1.5 py-0.5 rounded font-bold font-mono">
                  AES-256 GCM
                </span>
              </div>
            </div>

            <div className="relative">
              <input
                id="vault-passphrase-input"
                type={showPassword ? "text" : "password"}
                autoFocus
                placeholder="请输入解密档案馆的专属密码..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#D4AF37]/50 rounded-2xl py-3.5 pl-11 pr-11 text-center font-bold tracking-widest text-white shadow-xl focus:outline-none transition-all placeholder:font-sans placeholder:tracking-normal placeholder:text-zinc-550"
              />
              <KeyRound className="w-4 h-4 text-zinc-550 absolute left-4 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {!isConfigured && (
            <div className="animate-fadeIn">
              <label className="block text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-2">
                2. 重复输入密码作为二次校准
              </label>
              <div className="relative">
                <input
                  id="vault-confirm-passphrase"
                  type={showPassword ? "text" : "password"}
                  placeholder="重复输入安全口令..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#D4AF37]/50 rounded-2xl py-3.5 pl-12 text-center font-bold tracking-widest text-zinc-350 shadow-sm focus:outline-none transition-all placeholder:font-sans placeholder:tracking-normal placeholder:text-zinc-650"
                />
                <ShieldCheck className="w-4.5 h-4.5 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          {passphraseError && (
            <div className="text-[#F15D5D] text-xs text-center border border-red-950/45 bg-red-950/20 py-2.5 px-3 rounded-xl font-medium animate-pulse flex items-center justify-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{passphraseError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-100 hover:bg-white text-black font-extrabold uppercase text-xs tracking-widest py-3.5 rounded-2xl transition-all shadow-[0_4px_16px_rgba(255,255,255,0.05)] active:scale-98 cursor-pointer flex items-center justify-center gap-2 font-mono"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5" />
                <span>进入九一集英社档案馆</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer copyright and reset escape option */}
      <div className="text-center mt-auto z-10 space-y-3 pt-4">
        {isConfigured ? (
          <div>
            {!showResetConfirm ? (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="text-[9.5px] text-zinc-500 hover:text-rose-400 hover:underline transition-colors cursor-pointer flex items-center gap-1.5 mx-auto font-bold"
              >
                <RotateCcw className="w-3 h-3" />
                <span>忘记九一密钥口令？重置缓存数据</span>
              </button>
            ) : (
              <div className="bg-rose-950/20 border border-rose-900/40 p-4 rounded-2xl max-w-sm mx-auto space-y-2.5 animate-fadeIn">
                <p className="text-[10px] text-rose-400 font-bold leading-relaxed">
                  ⚠️ 警告：重置档案馆将彻底抹除本地暂存的全部密文和快照，如果是从新设备进入，请在登录后使用云同步还原。
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleHardReset}
                    className="text-[10px] px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold transition-all cursor-pointer"
                  >
                    确认销毁重设
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="text-[10px] px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-bold transition-all cursor-pointer"
                  >
                     取消
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}
        
      {showModalReset && (
        <CustomConfirmModal
          isOpen={showModalReset}
          title="🚨 决定彻底销毁并重置密室吗？"
          message="警告：这将会完全清空本地的所有加密好友档案、定格相片以及私密记忆对白！销毁后无法挽回。"
          confirmText="彻底撤销重设"
          cancelText="保留密室"
          isDanger={true}
          onConfirm={handleConfirmReset}
          onCancel={() => setShowModalReset(false)}
        />
      )}

      <p className="text-[8px] tracking-widest text-zinc-650 font-bold font-mono">
          © JIUYI JIYINGSHE CLOUD PRIVATE SERVERS. CO-AUTHORITY RESERVED.
        </p>
      </div>
    </div>
  );
};
