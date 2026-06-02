/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { VaultProvider, useVault } from './context/VaultContext';
import { MobileFrame } from './components/MobileFrame';
import { compressImageBase64 } from './utils/crypto';
import { VaultLockscreen } from './components/VaultLockscreen';
import { AddFriendModal } from './components/AddFriendModal';
import { AddMemoryForm } from './components/AddMemoryForm';
import { FriendArchive } from './components/FriendArchive';
import { SyncSettings } from './components/SyncSettings';
import { MemoryPosterModal, TimeMachineModal, CollectiveDashboardStats, CustomConfirmModal, GlobalProcessOverlay } from './components/NostalgiaExtras';
import { FriendDecrypted, MemoryDecrypted } from './types';
import { 
  PlusCircle, 
  Search, 
  Heart, 
  Calendar, 
  MapPin, 
  Camera, 
  Smile, 
  Plus, 
  ChevronRight, 
  Tag, 
  ShieldCheck, 
  Users, 
  PenTool,
  Bookmark,
  Sparkles,
  Feather
} from 'lucide-react';

const APP_COVER_PRESETS = [
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=600"
];

interface MainAppContentProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

function MainAppContent({ activeTab, setActiveTab }: MainAppContentProps) {
  const { 
    isUnlocked, 
    friends, 
    memories, 
    toggleFavoriteMemory, 
    deleteMemory, 
    lockVault,
    customCover,
    titleText,
    updateCoverAndTitle,
    isProcessing,
    processingMessage
  } = useVault();

  
  // Header, modal and list states
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [editFriendData, setEditFriendData] = useState<FriendDecrypted | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [editMemoryData, setEditMemoryData] = useState<MemoryDecrypted | null>(null);
  
  // Active friend archive being viewed (null if general lists)
  const [activeFriendArchive, setActiveFriendArchive] = useState<FriendDecrypted | null>(null);
  
  // Exporter & Time machine states
  const [exportMemory, setExportMemory] = useState<MemoryDecrypted | null>(null);
  const [showTimeMachine, setShowTimeMachine] = useState(false);
  
  // Cover config
  const [coverIndex, setCoverIndex] = useState(0);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Home Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  // Gather unique tags globally
  const globalTags = useMemo(() => {
    const tagsSet = new Set<string>();
    memories.forEach(m => m.tags.forEach(t => tagsSet.add(t)));
    return Array.from(tagsSet);
  }, [memories]);

  // General Filtered memory list for homepage feed
  const filteredMemories = useMemo(() => {
    return memories.filter(m => {
      // Find friend for cross reference search (search friend name)
      const linkedFriend = friends.find(f => f.id === m.friendId);
      const friendName = linkedFriend ? linkedFriend.name : "";
      const friendNickname = linkedFriend ? linkedFriend.nickname : "";

      const matchSearch = 
        m.quote.toLowerCase().includes(searchTerm.toLowerCase()) || 
        m.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        friendName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        friendNickname.toLowerCase().includes(searchTerm.toLowerCase());

      const matchTag = selectedTag ? m.tags.includes(selectedTag) : true;
      const matchFav = favoritesOnly ? m.favorite === true : true;

      return matchSearch && matchTag && matchFav;
    });
  }, [memories, friends, searchTerm, selectedTag, favoritesOnly]);

  const handleEditFriendTrigger = (friend: FriendDecrypted) => {
    setEditFriendData(friend);
    setShowAddFriend(true);
  };

  const handleEditMemoryTrigger = (id: string) => {
    const memo = memories.find(m => m.id === id);
    if (memo) {
      setEditMemoryData(memo);
      setShowAddMemory(true);
    }
  };

  const cycleCover = async () => {
    if (customCover) {
      // Clear custom cover to fallback to preset cycle
      await updateCoverAndTitle(null, titleText);
    } else {
      setCoverIndex((coverIndex + 1) % APP_COVER_PRESETS.length);
    }
  };

  const handleCustomCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        try {
          const compressed = await compressImageBase64(base64, 800, 450, 0.75);
          await updateCoverAndTitle(compressed, titleText);
        } catch {
          await updateCoverAndTitle(base64, titleText);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // If locked, just render lock screen wrapper
  if (!isUnlocked) {
    return (
      <div className="w-full h-full bg-[#0E0E11] flex flex-col justify-between">
        <VaultLockscreen />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FDFCF8] text-[#1A1A1A] overflow-hidden select-none font-sans">
      
      {/* Header element */}
      <div className="h-14 bg-white border-b border-black/5 px-4 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse" />
          <span className="serif text-sm font-bold tracking-widest text-black">
            九一集英社
          </span>
          <span className="text-[8px] bg-zinc-100 text-zinc-550 border border-zinc-250 py-0.5 px-1.5 rounded font-mono font-bold uppercase tracking-wider scale-90">
            CLAN
          </span>
        </div>
        
        {/* Dynamic header quick buttons */}
        <div className="flex items-center gap-2">
          {activeTab === 'feed' && (
            <button
              onClick={() => {
                setEditMemoryData(null);
                setShowAddMemory(true);
              }}
              className="bg-black hover:bg-zinc-800 text-white py-1.5 px-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1 shrink-0"
            >
              <Plus className="w-2.5 h-2.5 stroke-[3]" />
              <span>新 Moment</span>
            </button>
          )}

          {activeTab === 'friends' && (
            <button
              onClick={() => {
                setEditFriendData(null);
                setShowAddFriend(true);
              }}
              className="bg-black hover:bg-zinc-800 text-white py-1.5 px-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1 shrink-0"
            >
              <Plus className="w-2.5 h-2.5 stroke-[3]" />
              <span>新增人物</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary body switcher */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        
        {/* VIEW 1: HOME MEMORIES STREAM */}
        {activeTab === 'feed' && (
          <div className="flex-1 flex flex-col overflow-hidden h-full">
            {activeFriendArchive ? (
              /* Inner detailed folder database wrapper */
              <FriendArchive 
                friend={activeFriendArchive}
                onBack={() => setActiveFriendArchive(null)}
                onEditFriend={handleEditFriendTrigger}
                onEditMemory={handleEditMemoryTrigger}
              />
            ) : (
              /* Main scrollable feed feed */
              <div className="flex-1 overflow-y-auto pb-12">
                {/* 1. scrap book custom Cover Banner/Poster */}
                <div className="relative h-44 bg-zinc-950 overflow-hidden shadow-md group border-b border-black/10">
                  <img
                    src={customCover || APP_COVER_PRESETS[coverIndex]}
                    alt="App Cover"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-all duration-750 select-none pointer-events-none"
                  />
                  <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-black/80 to-transparent" />
                  
                  {/* Title and stats overlap */}
                  <div className="absolute bottom-4 left-4 right-4 text-left space-y-1 font-sans">
                    <div className="flex items-center justify-between">
                      {isEditingTitle ? (
                        <input
                          id="cover-title-editor"
                          type="text"
                          defaultValue={titleText}
                          onBlur={async (e) => {
                            setIsEditingTitle(false);
                            await updateCoverAndTitle(customCover, e.target.value.trim() || "九一集英社秘卷回忆");
                          }}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              setIsEditingTitle(false);
                              await updateCoverAndTitle(customCover, (e.target as HTMLInputElement).value.trim() || "九一集英社秘卷回忆");
                            }
                          }}
                          autoFocus
                          maxLength={16}
                          className="bg-white border text-black font-semibold text-sm border-black/20 focus:outline-none tracking-wide rounded px-2"
                        />
                      ) : (
                        <h2 
                          onClick={() => setIsEditingTitle(true)}
                          className="serif text-lg font-bold italic text-white drop-shadow-md tracking-wide cursor-pointer hover:text-zinc-200 transition-all flex items-center gap-1.5"
                          title="点击编辑画册名称"
                        >
                          {titleText}
                          <PenTool className="w-3 h-3 text-white/50" />
                        </h2>
                      )}
 
                      {/* Cover Actions: Cycle & Upload */}
                      <div className="flex items-center gap-1.5">
                        {memories.length > 0 && (
                          <button
                            onClick={() => setShowTimeMachine(true)}
                            className="bg-amber-500 hover:bg-amber-600 active:scale-95 rounded-full px-2.5 py-1 text-[8.5px] font-extrabold tracking-wider text-white uppercase cursor-pointer transition-all shrink-0 flex items-center gap-0.5"
                            title="开启随机时光机回响"
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>时光机</span>
                          </button>
                        )}
                        <button
                          onClick={cycleCover}
                          className="bg-white/10 hover:bg-white/20 active:scale-95 rounded-full px-2 py-1 text-[8.5px] font-bold tracking-wider text-white uppercase border border-white/10 cursor-pointer transition-all"
                          title={customCover ? "恢复预设" : "切换预设封面"}
                        >
                          {customCover ? "恢复预设" : "切背景"}
                        </button>
                        <label
                          className="bg-white/10 hover:bg-white/20 active:scale-95 rounded-full px-2 py-1 text-[8.5px] font-bold tracking-wider text-white uppercase border border-white/10 cursor-pointer transition-all shrink-0 flex items-center gap-0.5"
                          title="选择一张精美照片自定义背景海报"
                        >
                          <span>换海报</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleCustomCoverUpload}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center gap-3.5 text-[10px] text-zinc-200 font-mono font-bold">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-white/70" />
                        <strong>{friends.length}</strong> 人物
                      </span>
                      <span className="flex items-center gap-1">
                        <Bookmark className="w-3.5 h-3.5 text-white/70" />
                        <strong>{memories.length}</strong> 记忆碎片
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Interactive instant upload text button row */}
                <div className="py-2.5 px-4 bg-white border-b border-black/5 flex gap-3.5 items-center relative overflow-hidden shrink-0">
                  <div className="w-7 h-7 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900 shadow-sm">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </div>
                  <button
                    onClick={() => {
                      setEditMemoryData(null);
                      setShowAddMemory(true);
                    }}
                    className="flex-1 bg-zinc-50 hover:bg-zinc-100 text-zinc-400 text-xs text-left px-4 py-2 rounded-xl transition-all border border-black/5 cursor-pointer font-medium"
                  >
                    定格一个新的美妙语录或瞬间...
                  </button>
                </div>

                {/* 3. Search Bar and filters */}
                <div className="px-4 py-3 space-y-2.5 bg-[#FDFCF8] border-b border-black/5 z-20">
                  <div className="flex gap-2">
                    {/* Search Field */}
                    <div className="relative flex-1 font-sans">
                      <input
                        type="text"
                        placeholder="检索：语录文字 / 人物姓名 / 标签..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-black/10 focus:border-black rounded-xl py-2 px-9 text-xs text-black focus:outline-none placeholder:text-zinc-400 transition-all placeholder:italic"
                      />
                      <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black font-semibold text-xs"
                        >
                          清除
                        </button>
                      )}
                    </div>

                    {/* Favorites quick toggle */}
                    <button
                      onClick={() => setFavoritesOnly(!favoritesOnly)}
                      className={`px-3 py-2 rounded-xl transition-all border focus:outline-none flex items-center justify-center shrink-0 cursor-pointer ${
                        favoritesOnly
                          ? "bg-rose-50 border-rose-200 text-rose-600"
                          : "bg-white border-black/10 text-zinc-400 hover:text-black hover:border-black"
                      }`}
                      title={favoritesOnly ? "仅看已收藏宝贝" : "看所有宝贝"}
                    >
                      <Heart className={`w-4 h-4 ${favoritesOnly ? 'fill-rose-600 text-rose-600' : ''}`} />
                    </button>
                  </div>

                  {/* Hot tags list */}
                  {globalTags.length > 0 && (
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none shrink-0">
                      <button
                        onClick={() => setSelectedTag(null)}
                        className={`text-[8.5px] font-bold px-2.5 py-1 rounded-md shrink-0 transition-all cursor-pointer ${
                          selectedTag === null
                            ? "bg-black text-white shadow-sm"
                            : "bg-white text-zinc-500 border border-black/5 hover:text-black hover:border-black"
                        }`}
                      >
                        全部回忆 ({memories.length})
                      </button>
                      
                      {globalTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                          className={`text-[8.5px] font-bold px-2.5 py-1 rounded-md shrink-0 transition-all cursor-pointer ${
                            selectedTag === tag
                              ? "bg-black text-white shadow-sm"
                              : "bg-white text-zinc-500 border border-black/5 hover:text-black hover:border-black"
                          }`}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Memories stream */}
                <div className="px-4 py-2 space-y-5">
                  {filteredMemories.length === 0 ? (
                    <div className="text-center py-16 bg-zinc-50 border border-dashed border-black/10 rounded-2xl p-6">
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        {memories.length === 0
                          ? "您的私人密室展本空无一物。点击上方输入框并选立挚友，开始锁上您们的第一段合照语录吧！"
                          : "未检索到匹配的记忆结果，换个词检索一下。"}
                      </p>
                    </div>
                  ) : (
                    filteredMemories.map((memo) => {
                      // Find allied friend details
                      const f = friends.find(f => f.id === memo.friendId);
                      
                      return (
                        <div
                          key={memo.id}
                          className="bg-white text-zinc-900 border border-black/5 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col space-y-4 relative text-left font-sans"
                        >
                          {/* Polaroid image holder */}
                          {memo.image && (
                            <div className="w-full aspect-[4/3] rounded-xl overflow-hidden border border-black/5 bg-[#121212] shadow-inner relative group select-none">
                              <img
                                src={memo.image}
                                alt="Polaroid Memory"
                                loading="lazy"
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          {/* Quote message details */}
                          <div className="space-y-3.5">
                            <p className="font-serif text-base italic leading-relaxed text-[#1a1a1a] pr-1.5 whitespace-pre-wrap">
                              “{memo.quote}”
                            </p>

                            {/* Friend profile association link */}
                            <div className="flex items-center justify-between border-t border-black/5 pt-3">
                              {f ? (
                                <div 
                                  onClick={() => setActiveFriendArchive(f)}
                                  className="flex items-center gap-2 group cursor-pointer"
                                  title="查看好友档案"
                                >
                                  <div className="w-7 h-7 rounded-lg overflow-hidden border border-black/5 bg-zinc-50 shadow-inner flex items-center justify-center shrink-0">
                                    {f.avatar ? (
                                      <img src={f.avatar} alt={f.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <Smile className="w-4 h-4 text-zinc-400" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-bold text-zinc-900 group-hover:text-black leading-tight">
                                      {f.name}
                                    </p>
                                    <p className="text-[8.5px] text-zinc-400 leading-none mt-0.5">
                                      {f.nickname ? `@${f.nickname}` : "查看专属档案"} →
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[9px] text-zinc-400 italic font-medium">人物档案已解关联</span>
                              )}

                              {/* Tags container */}
                              <div className="flex flex-wrap gap-1">
                                {memo.tags.map(t => (
                                  <span
                                    key={t}
                                    className="text-[9px] bg-zinc-100 text-zinc-650 px-2 py-0.5 rounded font-bold"
                                  >
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Actions Footer */}
                          <div className="flex items-center justify-between border-t border-black/5 pt-2.5 mt-1.5">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => toggleFavoriteMemory(memo.id)}
                                className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 hover:text-rose-600 active:scale-95 transition-all cursor-pointer"
                              >
                                {memo.favorite ? (
                                  <Heart className="w-4 h-4 fill-rose-600 text-rose-600" />
                                ) : (
                                  <Heart className="w-4 h-4 text-zinc-400 hover:text-rose-600" />
                                )}
                                <span className={memo.favorite ? "text-rose-600 font-bold" : "text-zinc-400 hover:text-rose-600"}>
                                  收藏
                                </span>
                              </button>
                            </div>

                            <div className="flex gap-2.5">
                              <button
                                onClick={() => setExportMemory(memo)}
                                className="text-[10px] font-bold text-amber-600 hover:text-amber-850 transition-colors cursor-pointer"
                                title="生成可供保存在微信/朋友圈的拍立得海报"
                              >
                                生成海报
                              </button>
                              <button
                                onClick={() => handleEditMemoryTrigger(memo.id)}
                                className="text-[10px] font-bold text-zinc-500 hover:text-black transition-colors cursor-pointer"
                              >
                                编辑
                              </button>
                              <button
                                onClick={() => setDeleteTargetId(memo.id)}
                                className="text-[10px] font-bold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
                              >
                                删除
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: FRIENDS DIRECTORY VIEW */}
        {activeTab === 'friends' && (
          <div className="flex-1 flex flex-col bg-[#FDFCF8] text-[#1A1A1A] h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 pb-12 scrollbar-thin">
              
              <div className="border-b border-black/5 pb-2 text-left">
                <h2 className="serif text-sm font-bold tracking-wider text-black">
                  挚友档案目录 ({friends.length})
                </h2>
                <p className="text-[9px] font-mono font-bold text-zinc-400 tracking-widest uppercase mt-0.5">
                  MEMBERS DIRECTORY (CLASSIFICATIONS)
                </p>
              </div>

              {friends.length > 0 && (
                <CollectiveDashboardStats friends={friends} memories={memories} />
              )}

              {friends.length === 0 ? (
                <div className="text-center py-16 bg-zinc-50 border border-dashed border-black/10 rounded-2xl p-6">
                  <p className="text-xs text-zinc-500 leading-normal max-w-xs mx-auto">
                    您暂未建立任何人名档案。赶紧点击右上角“新增人物”按钮，添加您的死党、伴侣或挚友分类，为他们归档专属美好。
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3.5 pb-4">
                  {friends.map((f) => {
                    const count = memories.filter(m => m.friendId === f.id).length;
                    return (
                      <div
                        key={f.id}
                        className="bg-white border border-black/5 rounded-2xl p-5 flex flex-col items-center justify-between text-center relative group hover:border-black/20 hover:shadow-md transition-all shadow-sm"
                      >
                        {/* Avatar */}
                        <div className="w-14 h-14 rounded-full overflow-hidden border border-black/5 bg-zinc-50 flex items-center justify-center mb-3.5 text-zinc-450 shadow-inner shrink-0 transition-transform group-hover:scale-105 duration-300">
                          {f.avatar ? (
                            <img src={f.avatar} alt={f.name} className="w-full h-full object-cover" />
                          ) : (
                            <Users className="w-6 h-6 text-zinc-400" />
                          )}
                        </div>

                        {/* Friend names */}
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-black group-hover:underline transition-all leading-tight">
                            {f.name}
                          </p>
                          {f.nickname && (
                            <p className="text-[8.5px] bg-zinc-100 text-zinc-650 px-2 py-0.5 rounded font-bold uppercase tracking-wider mt-1 w-fit mx-auto">
                              @{f.nickname}
                            </p>
                          )}
                        </div>

                        {/* Counts and access action */}
                        <div className="pt-3 w-full border-t border-black/5 mt-3.5 flex flex-col gap-2.5">
                          <span className="text-[10px] font-bold text-zinc-400">
                            归档：{count} 条回忆
                          </span>
                          
                          <button
                            onClick={() => {
                              setActiveFriendArchive(f);
                              setActiveTab('feed'); // transition back to feed under friend focus
                            }}
                            className="bg-zinc-100 hover:bg-zinc-200 text-[10px] font-bold text-black py-2 rounded-xl w-full text-center transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-0.5"
                          >
                            <span>查阅档案</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: CLOUD SYNC & SETTINGS */}
        {activeTab === 'sync' && (
          <SyncSettings />
        )}
      </div>

      {/* OVERLAY DRAWERS */}
      
      {/* 1. Add/Edit Friend Overlay */}
      {showAddFriend && (
        <AddFriendModal
          onClose={() => {
            setShowAddFriend(false);
            setEditFriendData(null);
          }}
          editFriendData={editFriendData}
        />
      )}

       {/* 2. Add/Edit Memory Overlay */}
      {showAddMemory && (
        <AddMemoryForm
          onClose={() => {
            setShowAddMemory(false);
            setEditMemoryData(null);
          }}
          onAddFriendTrigger={() => {
            setShowAddMemory(false);
            setEditFriendData(null);
            setShowAddFriend(true);
          }}
          editMemoryData={editMemoryData}
        />
      )}

      {/* 3. Export Memory Poster Modal */}
      {exportMemory && (
        <MemoryPosterModal
          memory={exportMemory}
          friend={friends.find(f => f.id === exportMemory.friendId) || null}
          onClose={() => setExportMemory(null)}
        />
      )}

      {/* 4. Time Machine Nostalgic Roulette Modal */}
      {showTimeMachine && (
        <TimeMachineModal
          memories={memories}
          friends={friends}
          onClose={() => setShowTimeMachine(false)}
        />
      )}

      {/* 5. Custom Deletion Confirmation Dialog */}
      {deleteTargetId && (
        <CustomConfirmModal
          isOpen={!!deleteTargetId}
          title="⚠️ 确认删除此条定格时刻吗？"
          message="语录一旦擦除，本地缓存与云端同步的密文块都将被彻底清理，关联照片无法重新还原，该操作不可逆。"
          confirmText="彻底擦除"
          cancelText="放弃返回"
          isDanger={true}
          onConfirm={() => {
            deleteMemory(deleteTargetId);
            setDeleteTargetId(null);
          }}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}

      {/* 6. Dynamic Crypto Process Overlay */}
      <GlobalProcessOverlay isProcessing={isProcessing} message={processingMessage} />

    </div>
  );
}

export default function App() {
  const [frameTab, setFrameTab] = useState('feed');

  return (
    <VaultProvider>
      <MobileFrame 
        activeTab={frameTab} 
        setActiveTab={setFrameTab}
        onLock={() => {
          // Simply lock applet by clearing master key state
          // VaultProvider automatically provides clear logic.
          // Since the lock action resides in parent, let's call lock directly.
          // By locking, the provider state becomes locked, rendering lockscreen.
          // Let's implement active tab reset as well.
          setFrameTab('feed');
        }}
      >
        <VaultWrapper frameTab={frameTab} setFrameTab={setFrameTab} />
      </MobileFrame>
    </VaultProvider>
  );
}

// Inner wrapper to correctly extract useVault inside provider context
function VaultWrapper({ frameTab, setFrameTab }: { frameTab: string; setFrameTab: (tab: string) => void }) {
  const { isUnlocked, lockVault } = useVault();
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full">
      <MainAppContent activeTab={frameTab} setActiveTab={setFrameTab} />
    </div>
  );
}
