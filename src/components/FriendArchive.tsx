/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { ChevronLeft, Edit, Trash2, Heart, Search, Calendar, HeartOff, User2 } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { FriendDecrypted } from '../types';
import { CustomConfirmModal, GlobalProcessOverlay } from './NostalgiaExtras';

interface FriendArchiveProps {
  friend: FriendDecrypted;
  onBack: () => void;
  onEditFriend: (friend: FriendDecrypted) => void;
  onEditMemory: (id: string) => void;
}

export const FriendArchive: React.FC<FriendArchiveProps> = ({ friend, onBack, onEditFriend, onEditMemory }) => {
  const { memories, toggleFavoriteMemory, deleteMemory, deleteFriend, isProcessing, processingMessage } = useVault();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [deleteFriendConfirm, setDeleteFriendConfirm] = useState(false);
  const [deleteMemoryTargetId, setDeleteMemoryTargetId] = useState<string | null>(null);

  // Filter memories belonging only to this friend
  const friendMemories = useMemo(() => {
    return memories.filter(m => m.friendId === friend.id);
  }, [memories, friend.id]);

  // Aggregate tags for this friend specifically
  const tagStats = useMemo(() => {
    const counts: { [tag: string]: number } = {};
    friendMemories.forEach(m => {
      m.tags.forEach(t => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return counts;
  }, [friendMemories]);

  // Apply search filtering
  const filteredMemories = useMemo(() => {
    return friendMemories.filter(m => {
      const matchesSearch = m.quote.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            m.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesTag = tagFilter ? m.tags.includes(tagFilter) : true;
      return matchesSearch && matchesTag;
    });
  }, [friendMemories, searchTerm, tagFilter]);

  const handleDeleteProfileClick = () => {
    setDeleteFriendConfirm(true);
  };

  const handleConfirmDeleteFriend = async () => {
    setDeleteFriendConfirm(false);
    await deleteFriend(friend.id);
    onBack();
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FDFCF8] h-full overflow-hidden text-[#1A1A1A] sans">
      
      {/* Scrollable Sub-container */}
      <div className="flex-1 overflow-y-auto px-4 pb-12 space-y-5 scrollbar-thin">
        
        {/* Navigation back and commands */}
        <div className="flex items-center justify-between pt-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-[10.5px] text-zinc-800 font-bold tracking-widest uppercase cursor-pointer hover:text-black"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>← 返回画册目录</span>
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEditFriend(friend)}
              className="p-2 rounded-xl bg-white border border-black/10 hover:bg-zinc-50 text-zinc-500 hover:text-black transition-colors cursor-pointer"
              title="编辑基本信息"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDeleteProfileClick}
              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 transition-colors cursor-pointer"
              title="彻底删除档案"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Friend Profile Card Header */}
        <div className="bg-white rounded-3xl p-5 border border-black/5 flex items-center gap-4 shadow-sm relative overflow-hidden">
          {/* Subtle design element */}
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-gradient-to-tr from-zinc-500/5 to-transparent rounded-full blur-xl pointer-events-none" />

          {/* Avatar image container */}
          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-black/5 bg-zinc-100 flex items-center justify-center shrink-0">
            {friend.avatar ? (
              <img
                src={friend.avatar}
                alt={friend.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <User2 className="w-7 h-7 text-zinc-400" />
            )}
          </div>

          <div className="space-y-0.5 text-left font-sans">
            <div className="flex items-baseline gap-1.5">
              <h2 className="serif text-xl italic font-bold text-zinc-950">{friend.name}</h2>
              {friend.nickname && (
                <span className="text-[10px] bg-zinc-100 text-zinc-650 px-2 py-0.5 rounded font-mono font-bold">
                  {friend.nickname}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500">
              相册：共 <span className="text-black font-bold font-mono">{friendMemories.length}</span> 条珍贵时刻归档
            </p>
            <p className="text-[9px] font-mono text-zinc-400">
              建档日：{new Date(friend.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Local Search and filter controls inside profile */}
        {friendMemories.length > 0 && (
          <div className="space-y-2.5 text-left font-sans">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder={`搜搜我和 ${friend.name} 的珍贵碎片...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-black/10 focus:border-black rounded-xl py-2 px-9 text-xs text-black focus:outline-none placeholder:text-zinc-400 placeholder:italic"
              />
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black text-xs font-semibold"
                >
                  清除
                </button>
              )}
            </div>

            {/* Tag pills filtered specifically */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                onClick={() => setTagFilter(null)}
                className={`text-[9px] font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  tagFilter === null
                    ? "bg-black text-white"
                    : "bg-white border border-black/5 text-zinc-500 hover:text-black hover:border-black"
                }`}
              >
                全部段落 ({friendMemories.length})
              </button>
              {Object.entries(tagStats).map(([tag, count]) => (
                <button
                  key={tag}
                  onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                  className={`text-[9px] font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    tagFilter === tag
                      ? "bg-black text-white"
                      : "bg-white border border-black/5 text-zinc-500 hover:text-black hover:border-black"
                  }`}
                >
                  #{tag} ({count})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Private Memory wall list */}
        <div className="space-y-4 pt-1">
          {filteredMemories.length === 0 ? (
            <div className="text-center py-12 bg-zinc-50 border border-dashed border-black/10 rounded-2xl p-6">
              <p className="text-xs text-zinc-500">
                {friendMemories.length === 0
                  ? "目前该朋友档案里空空如也。在主页上传照片与语录对齐好友吧。"
                  : "没有搜到符合筛选项的相关语录。"}
              </p>
            </div>
          ) : (
            filteredMemories.map((memo) => (
              <div 
                key={memo.id}
                className="bg-white text-zinc-900 rounded-2xl p-5 shadow-sm hover:shadow-md flex flex-col space-y-4 border border-black/5 transition-all relative group text-left"
              >
                {/* Polaroid Visual Design Card */}
                {memo.image && (
                  <div className="w-full aspect-[4/3] rounded-lg overflow-hidden border border-black/5 bg-[#121212] shadow-inner">
                    <img
                      src={memo.image}
                      alt="Polaroid clip"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover select-none"
                    />
                  </div>
                )}

                {/* Body elements */}
                <div className="space-y-3 flex-1 text-left">
                  {/* Quote Paragraph */}
                  <p className="serif text-base italic leading-relaxed font-medium pr-2 whitespace-pre-wrap text-[#1A1A1A]">
                    “{memo.quote}”
                  </p>

                  {/* Date and tags block */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-black/5 pt-2.5">
                    <div className="flex items-center gap-1 text-[9px] font-mono text-zinc-400 font-bold uppercase">
                      <Calendar className="w-3 h-3 text-zinc-450" />
                      <span>{new Date(memo.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {memo.tags.map(t => (
                        <span 
                          key={t} 
                          className="text-[9px] bg-zinc-100 text-[#1a1a1a] px-2.5 py-0.5 rounded font-bold"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Operations overlap header */}
                <div className="flex items-center justify-between border-t border-black/5 pt-2.5 mt-1.5">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleFavoriteMemory(memo.id)}
                      className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 hover:text-rose-600 active:scale-95 transition-all cursor-pointer"
                    >
                      {memo.favorite ? (
                        <Heart className="w-4 h-4 fill-rose-600 text-rose-600" />
                      ) : (
                        <Heart className="w-4 h-4 text-zinc-400" />
                      )}
                      <span>收藏</span>
                    </button>
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      onClick={() => onEditMemory(memo.id)}
                      className="text-[10px] font-bold text-zinc-500 hover:text-black transition-colors"
                    >
                      编辑内容
                    </button>
                    <button
                      onClick={() => setDeleteMemoryTargetId(memo.id)}
                      className="text-[10px] font-bold text-rose-600 hover:text-rose-800 transition-all cursor-pointer"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {deleteFriendConfirm && (
        <CustomConfirmModal
          isOpen={deleteFriendConfirm}
          title={`⚠️ 确认销毁 ${friend.name} 的全部档案吗？`}
          message={`警告：该操作将同时清除与 ${friend.name} 关联的所有约 ${friendMemories.length} 条定格回忆及合照。此操作在本地和云端同步物理擦除，无法回滚。`}
          confirmText="彻底销毁"
          cancelText="放弃返回"
          isDanger={true}
          onConfirm={handleConfirmDeleteFriend}
          onCancel={() => setDeleteFriendConfirm(false)}
        />
      )}

      {deleteMemoryTargetId && (
        <CustomConfirmModal
          isOpen={!!deleteMemoryTargetId}
          title="⚠️ 确认擦除此条珍贵记忆吗？"
          message="该行为会永久删除本段语录、相册胶片。在所有对齐设备中无法再次展现该痕迹。"
          confirmText="彻底擦除"
          cancelText="保留珍藏"
          isDanger={true}
          onConfirm={async () => {
            const mId = deleteMemoryTargetId;
            setDeleteMemoryTargetId(null);
            await deleteMemory(mId);
          }}
          onCancel={() => setDeleteMemoryTargetId(null)}
        />
      )}

      <GlobalProcessOverlay isProcessing={isProcessing} message={processingMessage} />

    </div>
  );
};
