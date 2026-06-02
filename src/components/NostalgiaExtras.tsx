/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { 
  X, 
  Download, 
  Sparkles, 
  Heart, 
  Calendar, 
  Users, 
  Bookmark, 
  Flame, 
  TrendingUp, 
  BarChart3, 
  Smile, 
  Check, 
  Compass, 
  RotateCw 
} from 'lucide-react';
import { FriendDecrypted, MemoryDecrypted } from '../types';

interface MemoryPosterModalProps {
  memory: MemoryDecrypted;
  friend: FriendDecrypted | null;
  onClose: () => void;
}

export const MemoryPosterModal: React.FC<MemoryPosterModalProps> = ({ memory, friend, onClose }) => {
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCopyQuote = () => {
    navigator.clipboard.writeText(`“${memory.quote}” —— 记录于九一档案馆，与 ${friend?.name || '挚友'} 的温馨一刻。`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMock = () => {
    // Elegant Canvas drawer for pixel-perfect Polaroid Export
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Draw elegant ivory paper backing
    ctx.fillStyle = '#FAF9F5';
    ctx.fillRect(0, 0, 600, 800);

    // 2. Vintage black border styling
    ctx.strokeStyle = '#D4AF37'; 
    ctx.lineWidth = 4;
    ctx.strokeRect(12, 12, 576, 776);

    // 3. Draw main Polaroid inner frame
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(40, 40, 520, 500);
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 40, 520, 500);

    // Helper to finish draw and download
    const finishDrawingAndDownload = (imgSrc?: string) => {
      // Draw subtitle & vintage watermarks
      ctx.fillStyle = '#1A1A1A';
      ctx.font = 'italic bold 24px serif';
      
      // Wrap text helper for quotation
      const text = `“${memory.quote}”`;
      const words = text.split('');
      let line = '';
      let y = 590;
      const x = 50;
      const maxWidth = 500;
      const lineHeight = 34;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n];
        if (testLine.length * 12 > maxWidth && n > 0) { // rough character width checking
          ctx.fillText(line, x, y);
          line = words[n];
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, y);

      // Draw meta-details footer
      ctx.fillStyle = '#71717A';
      ctx.font = 'bold 12px monospace';
      const dateStr = new Date(memory.createdAt).toLocaleDateString();
      ctx.fillText(`DATE: ${dateStr}`, 50, 720);
      
      ctx.fillStyle = '#D4AF37';
      ctx.font = 'bold italic 13px serif';
      ctx.fillText(`WITH: ${friend?.name || 'SECRET FRIEND'}${friend?.nickname ? ` (@${friend.nickname})` : ''}`, 50, 742);

      ctx.fillStyle = '#111111';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('九一集英社 • 秘卷记忆档案馆', 370, 742);

      // Download trigger
      try {
        const url = canvas.toDataURL('image/jpeg', 0.95);
        const link = document.createElement('a');
        link.download = `91_Polaroid_${friend?.name || 'Moment'}_${Date.now()}.jpg`;
        link.href = url;
        link.click();
      } catch (err) {
        console.error("Canvas export failed due to local security/tainted images: ", err);
        alert("由于数据高度加密和跨域防护，推荐直接对手机屏幕进行【高画质截图】分享！这样效果更完美、画质无损！");
      }
    };

    // If memory has image, draw it on canvas
    if (memory.image) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Draw the image scaled inside polaroid photo size (520x420)
        // Draw a placeholder dark background inside photo area
        ctx.fillStyle = '#121212';
        ctx.fillRect(50, 50, 500, 420);
        
        const aspect = img.width / img.height;
        let dWidth = 500;
        let dHeight = 500 / aspect;
        if (dHeight > 420) {
          dHeight = 420;
          dWidth = 420 * aspect;
        }
        const dx = 50 + (500 - dWidth) / 2;
        const dy = 50 + (420 - dHeight) / 2;
        
        ctx.drawImage(img, dx, dy, dWidth, dHeight);
        finishDrawingAndDownload();
      };
      img.src = memory.image;
    } else {
      // If no image, draw a beautiful vintage record center badge
      ctx.fillStyle = '#1C1917';
      ctx.fillRect(50, 50, 500, 420);
      ctx.fillStyle = '#D4AF37';
      ctx.font = 'bold 18px serif';
      ctx.fillText('NINE-ONE COLLECTIVE VINTAGE RECORD', 110, 260);
      finishDrawingAndDownload();
    }
  };

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#18181B] border border-zinc-800 rounded-[32px] w-full max-w-[360px] max-h-[780px] overflow-y-auto scrollbar-none flex flex-col p-5 space-y-4 shadow-2xl relative text-left transition-all duration-300">
        
        {/* Header toolbar */}
        <div className="flex justify-between items-center pb-2 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            <span className="text-zinc-200 font-bold text-xs uppercase tracking-wider font-mono">拍立得海报生成器</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Polaroid frame card wrapper (Screenshot target) */}
        <div 
          ref={containerRef}
          className="bg-[#FAF9F5] rounded-2xl p-4 border border-zinc-900/10 shadow-lg text-black space-y-3 relative overflow-hidden"
          style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
        >
          {/* Gold highlight banner border */}
          <div className="absolute top-0 inset-x-0 h-1 bg-[#D4AF37]" />

          {/* Picture Clip frame */}
          <div className="aspect-[4/3] w-full bg-[#1A1A1E] rounded-md overflow-hidden relative border border-black/5 flex items-center justify-center">
            {memory.image ? (
              <img 
                src={memory.image} 
                alt="Memory poster" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="flex flex-col items-center justify-center space-y-2 text-center p-4">
                <Users className="w-8 h-8 text-[#D4AF37] animate-bounce" />
                <p className="text-[10px] font-mono font-bold text-zinc-400 tracking-widest uppercase">
                  NINE ONE ARCHIVES BYPASS
                </p>
              </div>
            )}
            
            {/* Stamp highlight overlay */}
            <div className="absolute top-2 right-2 text-[7.5px] font-bold border border-[#D4AF37]/50 text-[#D4AF37] px-1.5 py-0.5 rounded font-mono bg-black/40 backdrop-blur-sm">
              91 ARCHIVE
            </div>
          </div>

          {/* Quotation writeup */}
          <div className="space-y-3.5 pt-1 text-left">
            <p className="serif text-sm italic font-medium leading-relaxed text-zinc-900 pr-1.5 whitespace-pre-wrap">
              “{memory.quote}”
            </p>

            {/* Visual dividers & sign-off meta */}
            <div className="border-t border-black/5 pt-3.5 space-y-2.5">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-md overflow-hidden border border-black/5 bg-zinc-100 flex items-center justify-center shrink-0">
                  {friend?.avatar ? (
                    <img src={friend.avatar} alt="Poster partner" className="w-full h-full object-cover" />
                  ) : (
                    <Smile className="w-3.5 h-3.5 text-zinc-400" />
                  )}
                </div>
                <div className="leading-none text-left">
                  <p className="text-[10px] font-bold text-zinc-950 uppercase tracking-wide">
                    与 {friend?.name || '秘密好友'} 的秘境邂逅
                  </p>
                  {friend?.nickname && (
                    <p className="text-[7.5px] text-zinc-500 font-mono italic mt-0.5">
                      @{friend.nickname}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-[7.5px] font-bold font-mono text-zinc-400 border-t border-dashed border-black/5 pt-2">
                <span className="flex items-center gap-0.5 uppercase">
                  <Calendar className="w-2.5 h-2.5 text-zinc-400" />
                  {new Date(memory.createdAt).toLocaleDateString()}
                </span>
                <span className="text-[#D4AF37] tracking-wider uppercase italic">
                  九一集英社秘卷专属印章
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sharing Operations Tool rail */}
        <div className="space-y-2.5 pt-1">
          <p className="text-[10px] text-zinc-500 font-medium leading-relaxed text-center bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-805">
            💡 <strong>最佳分享姿势</strong>：长按或者同时按下音量键与电源键，直接对手机屏幕进行<strong>截图</strong>，画质无码、最适合发在死党微信群/朋友圈得瑟！
          </p>

          <div className="grid grid-cols-2 gap-2 shrink-0">
            <button
              onClick={handleCopyQuote}
              className="bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 py-2.5 px-3 rounded-xl text-[10px] font-bold tracking-wider cursor-pointer uppercase transition-all flex items-center justify-center gap-1 border border-zinc-700"
            >
              <Check className={`w-3.5 h-3.5 ${copied ? 'text-emerald-500 animate-bounce' : 'text-zinc-400'}`} />
              <span>{copied ? "已复制妙句" : "复制妙句"}</span>
            </button>
            <button
              onClick={handleDownloadMock}
              className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white py-2.5 px-3 rounded-xl text-[10px] font-bold tracking-wider cursor-pointer uppercase transition-all flex items-center justify-center gap-1 shadow-md shadow-amber-500/10"
            >
              <Download className="w-3.5 h-3.5" />
              <span>下载拍立得</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};


interface TimeMachineModalProps {
  memories: MemoryDecrypted[];
  friends: FriendDecrypted[];
  onClose: () => void;
}

export const TimeMachineModal: React.FC<TimeMachineModalProps> = ({ memories, friends, onClose }) => {
  const [randomMemo, setRandomMemo] = useState<MemoryDecrypted | null>(null);
  const [spinning, setSpinning] = useState(false);

  const shuffleMemory = () => {
    if (memories.length === 0) return;
    setSpinning(true);
    setTimeout(() => {
      const idx = Math.floor(Math.random() * memories.length);
      setRandomMemo(memories[idx]);
      setSpinning(false);
    }, 800);
  };

  // Initialize with first random memory on mount
  React.useEffect(() => {
    shuffleMemory();
  }, []);

  const associatedFriend = useMemo(() => {
    if (!randomMemo) return null;
    return friends.find(f => f.id === randomMemo.friendId) || null;
  }, [randomMemo, friends]);

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#121214] border border-zinc-800 rounded-[32px] w-full max-w-[360px] flex flex-col p-5 space-y-4 shadow-2xl relative text-left">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-1.5">
            <Compass className="w-4.5 h-4.5 text-amber-500 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="text-zinc-200 font-bold text-xs uppercase tracking-wider font-mono">九一集英社 • 随机时光机</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Time machine rolling wheel */}
        <div className="flex flex-col items-center justify-center py-4 relative">
          <div className={`w-32 h-32 rounded-full border-4 border-zinc-800 bg-[#1e1e24] shadow-2xl relative flex items-center justify-center transition-transform duration-700 ${spinning ? 'animate-spin' : ''}`}>
            {/* Tape Vinyl Record mockup */}
            <div className="absolute inset-2 rounded-full border-2 border-dashed border-zinc-700 bg-black/40 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-[#D4AF37]/30 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-[#121214] border border-[#D4AF37]/50" />
              </div>
            </div>
          </div>
          <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest mt-3.5">
            {spinning ? "正在穿越时间线..." : "记忆飞轮已定位"}
          </span>
        </div>

        {/* Loaded Random Memory details */}
        {randomMemo && !spinning && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4.5 text-left space-y-3 shadow-inner relative overflow-hidden transition-all duration-300">
            <div className="absolute right-0 bottom-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />

            <p className="serif text-sm italic font-medium leading-relaxed text-zinc-100 whitespace-pre-wrap pr-1">
              “{randomMemo.quote}”
            </p>

            <div className="border-t border-zinc-800/80 pt-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full overflow-hidden border border-zinc-800 bg-zinc-800 flex items-center justify-center shrink-0">
                  {associatedFriend?.avatar ? (
                    <img src={associatedFriend.avatar} alt="Partner" className="w-full h-full object-cover" />
                  ) : (
                    <Smile className="w-3.5 h-3.5 text-zinc-500" />
                  )}
                </div>
                <span className="text-[10px] font-mono text-zinc-300 font-bold">
                  @{associatedFriend?.name || '某位死党'}
                </span>
              </div>

              <span className="text-[8px] font-mono text-zinc-500 flex items-center gap-0.5">
                <Calendar className="w-3 h-3 text-zinc-500" />
                {new Date(randomMemo.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}

        {/* Action rails */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 py-3 rounded-xl text-xs font-bold text-center cursor-pointer transition-all"
          >
            返回档案馆
          </button>
          <button
            onClick={shuffleMemory}
            disabled={spinning}
            className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 active:scale-95 disabled:opacity-50 text-white py-3 rounded-xl text-xs font-extrabold text-center cursor-pointer transition-all flex items-center justify-center gap-1 shadow-lg shadow-amber-500/10"
          >
            <RotateCw className={`w-3.5 h-3.5 ${spinning ? 'animate-spin' : ''}`} />
            <span>再摇一次时光</span>
          </button>
        </div>

      </div>
    </div>
  );
};


interface CollectiveDashboardStatsProps {
  friends: FriendDecrypted[];
  memories: MemoryDecrypted[];
}

export const CollectiveDashboardStats: React.FC<CollectiveDashboardStatsProps> = ({ friends, memories }) => {
  const [collapsed, setCollapsed] = useState(true);

  const stats = useMemo(() => {
    if (friends.length === 0) return null;

    // 1. Calculate top referenced member (most quotes logged)
    const quoteCountsMap: { [id: string]: number } = {};
    memories.forEach(m => {
      quoteCountsMap[m.friendId] = (quoteCountsMap[m.friendId] || 0) + 1;
    });

    let topFriendId = '';
    let maxQuotesCount = 0;
    Object.entries(quoteCountsMap).forEach(([fId, count]) => {
      if (count > maxQuotesCount) {
        maxQuotesCount = count;
        topFriendId = fId;
      }
    });

    const topFriendObj = friends.find(f => f.id === topFriendId) || null;

    // 2. Favorite quote percentage
    const favoriteCount = memories.filter(m => m.favorite).length;
    const favPercentage = memories.length > 0 ? Math.round((favoriteCount / memories.length) * 100) : 0;

    // 3. Most popular tag across all memories
    const tagCountMap: { [tag: string]: number } = {};
    memories.forEach(m => m.tags.forEach(t => {
      tagCountMap[t] = (tagCountMap[t] || 0) + 1;
    }));

    let topTag = '';
    let maxTagCount = 0;
    Object.entries(tagCountMap).forEach(([tag, count]) => {
      if (count > maxTagCount) {
        maxTagCount = count;
        topTag = tag;
      }
    });

    return {
      topFriend: topFriendObj,
      topFriendCount: maxQuotesCount,
      favCount: favoriteCount,
      favPercentage,
      topTag,
      topTagCount: maxTagCount,
      totalQuotes: memories.length,
      totalFriends: friends.length
    };
  }, [friends, memories]);

  if (!stats) return null;

  return (
    <div className="bg-zinc-50 border border-black/5 rounded-2xl overflow-hidden font-sans text-left transition-all">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full px-4 py-3 flex items-center justify-between text-zinc-450 hover:text-black cursor-pointer bg-white transition-colors"
      >
        <div className="flex items-center gap-2 text-zinc-900">
          <BarChart3 className="w-4 h-4 text-[#D4AF37]" />
          <span className="serif text-xs font-bold tracking-wider">🗃️ 九一绘卷群像透视统计报告</span>
        </div>
        <span className="text-[10px] font-mono leading-none font-bold bg-zinc-150 px-2 py-0.5 rounded text-zinc-650">
          {collapsed ? '展开查看' : '收起折叠'}
        </span>
      </button>

      {!collapsed && (
        <div className="p-4 border-t border-black/5 grid grid-cols-2 gap-3 bg-[#FAF8F5]">
          
          <div className="bg-white border border-black/5 rounded-xl p-3 flex flex-col justify-between shadow-sm relative overflow-hidden text-left">
            <span className="text-[8px] font-mono font-bold text-zinc-400 tracking-widest uppercase">
              社群话题王 (MOST QUOTED)
            </span>
            <div className="pt-2 flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-black/5 bg-zinc-150 flex items-center justify-center">
                {stats.topFriend?.avatar ? (
                  <img src={stats.topFriend.avatar} className="w-full h-full object-cover" />
                ) : (
                  <Smile className="w-3.5 h-3.5 text-zinc-400" />
                )}
              </div>
              <span className="text-[11px] font-bold text-black truncate max-w-[80px]">
                {stats.topFriend?.name || "暂无数据"}
              </span>
            </div>
            <p className="text-[9px] font-mono text-zinc-450 mt-1 leading-none">
              共归档 <strong className="text-black font-semibold font-mono">{stats.topFriendCount}</strong> 条精彩对话
            </p>
          </div>

          <div className="bg-white border border-black/5 rounded-xl p-3 flex flex-col justify-between shadow-sm relative overflow-hidden text-left">
            <span className="text-[8px] font-mono font-bold text-zinc-400 tracking-widest uppercase">
              高精喜好比例 (FAV RATE)
            </span>
            <div className="pt-2.5 flex items-baseline gap-1">
              <span className="text-sm font-extrabold font-mono text-rose-600">
                {stats.favPercentage}%
              </span>
              <span className="text-[9px] text-zinc-400">已贴红心</span>
            </div>
            <p className="text-[9px] font-mono text-zinc-450 mt-1 leading-none">
              珍藏语录 <strong className="text-black font-semibold font-mono">{stats.favCount}</strong> 条
            </p>
          </div>

          <div className="bg-white border border-black/5 rounded-xl p-3 flex flex-col justify-between shadow-sm relative overflow-hidden text-left col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-mono font-bold text-zinc-400 tracking-widest uppercase">
                秘密高热社交标签 (TOP HOT TAG)
              </span>
              <span className="text-[8.5px] font-bold bg-amber-500/10 text-amber-700 py-0.5 px-1.5 rounded font-mono uppercase tracking-wider scale-90">
                {stats.topTag ? `#${stats.topTag}` : 'N/A'}
              </span>
            </div>
            <p className="text-[9.5px] text-zinc-500 mt-2 font-medium">
              大家最频繁、最默契使用的回忆对齐标签是 {stats.topTag ? <strong className="text-zinc-950 font-bold">#{stats.topTag}</strong> : "暂无"}，已关联 <strong className="text-zinc-950 font-mono font-bold">{stats.topTagCount}</strong> 段对白。
            </p>
          </div>

        </div>
      )}
    </div>
  );
};


interface CustomConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDanger?: boolean;
}

export const CustomConfirmModal: React.FC<CustomConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = "确认执行",
  cancelText = "取消返回",
  onConfirm,
  onCancel,
  isDanger = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-[70] flex items-center justify-center p-5 text-left select-none">
      <div className="bg-white border border-black/10 rounded-3xl w-full max-w-[310px] p-5 space-y-4 shadow-2xl text-center font-sans">
        <div className="space-y-1.5">
          <h3 className="serif text-base font-extrabold text-zinc-950 tracking-wide text-center">
            {title}
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed text-center">
            {message}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1 pb-1">
          <button
            onClick={onCancel}
            className="bg-zinc-100 hover:bg-zinc-200 active:scale-95 text-zinc-700 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`active:scale-95 text-white py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-sm ${
              isDanger
                ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/10"
                : "bg-amber-500 hover:bg-amber-600 shadow-amber-500/10"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};


interface GlobalProcessOverlayProps {
  isProcessing: boolean;
  message: string;
}

export const GlobalProcessOverlay: React.FC<GlobalProcessOverlayProps> = ({ isProcessing, message }) => {
  if (!isProcessing) return null;

  return (
    <div className="absolute inset-0 bg-black/70 backdrop-blur-md z-[80] flex flex-col items-center justify-center p-6 text-center select-none animate-fade-in">
      <div className="space-y-6 flex flex-col items-center">
        {/* Glowing floating ring loader */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-[#D4AF37]/20" />
          <div className="absolute inset-0 rounded-full border-4 border-t-[#D4AF37] border-r-transparent animate-spin" style={{ animationDuration: '0.8s' }} />
          <div className="absolute inset-2 bg-gradient-to-tr from-amber-500/5 to-yellow-500/10 rounded-full blur-xs pointer-events-none animate-pulse" />
        </div>

        {/* Message and secondary hardware/E2E watermarks */}
        <div className="space-y-2 max-w-[280px]">
          <p className="text-zinc-100 font-extrabold text-xs tracking-wider leading-relaxed">
            {message || "正在进行本地 AES 端对端加密安全排布..."}
          </p>
          <p className="text-[8px] font-mono font-bold text-zinc-500 tracking-widest uppercase animate-pulse">
            91 COLLECTIVE DECRYPT PROTOCOL SECURED
          </p>
        </div>
      </div>
    </div>
  );
};
