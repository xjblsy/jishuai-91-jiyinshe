/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Sparkles, X, PlusCircle, Bookmark, Tag } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { MemoryDecrypted } from '../types';

interface AddMemoryFormProps {
  onClose: () => void;
  onAddFriendTrigger: () => void;
  editMemoryData?: MemoryDecrypted | null;
}

const PRESET_TAGS = ["温馨时刻", "幽默搞笑", "旅行记忆", "深夜长谈", "沙雕日常", "温暖治愈"];

export const AddMemoryForm: React.FC<AddMemoryFormProps> = ({ onClose, onAddFriendTrigger, editMemoryData }) => {
  const { friends, addMemory, updateMemory } = useVault();
  
  const [friendId, setFriendId] = useState("");
  const [quote, setQuote] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [tagsInput, setTagsInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // If we have editing state, pre-fill fields
    if (editMemoryData) {
      setFriendId(editMemoryData.friendId);
      setQuote(editMemoryData.quote);
      setImage(editMemoryData.image);
      setSelectedTags(editMemoryData.tags);
    } else if (friends.length > 0) {
      setFriendId(friends[0].id); // select first by default
    }
  }, [editMemoryData, friends]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleTogglePresetTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    const trimmed = tagsInput.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      if (selectedTags.length >= 8) {
        alert("最多可添加8个标签。");
        return;
      }
      setSelectedTags([...selectedTags, trimmed]);
      setTagsInput("");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendId) return alert("请先选择一个挚友关联此条回忆！");
    if (!quote.trim()) return alert("请填写语录或回忆文字描述！");

    setIsSubmitting(true);
    try {
      if (editMemoryData) {
        await updateMemory(
          editMemoryData.id,
          quote.trim(),
          image,
          selectedTags,
          editMemoryData.favorite
        );
      } else {
        await addMemory(friendId, quote.trim(), image, selectedTags);
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert("信息保存失败，请重试！");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-black/50 backdrop-blur-md z-50 flex items-end justify-center sans">
      <div className="w-full max-w-[420px] bg-[#FDFCF8] rounded-t-[32px] border-t border-black/10 p-6 space-y-6 animate-slideUp max-h-[90%] overflow-y-auto">
        
        {/* Modal headers */}
        <div className="flex items-center justify-between border-b border-black/5 pb-4">
          <div className="flex items-center gap-2">
            <h3 className="serif text-base font-bold text-black">
              {editMemoryData ? "修改回忆片段" : "记录新时刻"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-black/10 flex items-center justify-center hover:bg-zinc-100 text-zinc-500 hover:text-black transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {friends.length === 0 ? (
          <div className="text-center p-8 space-y-4">
            <p className="text-xs text-zinc-500">
              您目前还没有建立任何挚友档案。在录入语录/照片之前，请先为您或朋友建立一个专门的档案分类。
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onAddFriendTrigger();
              }}
              className="text-xs bg-black hover:bg-zinc-850 text-white font-bold px-6 py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>前往创建挚友档案</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="space-y-4.5 text-left">
            {/* Friend Selector */}
            <div>
              <label className="block text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-2">
                选择一位挚友 (Who said/did this?)
              </label>
              <select
                id="memory-select-friend"
                value={friendId}
                disabled={!!editMemoryData} // lock on edit
                onChange={(e) => setFriendId(e.target.value)}
                className="w-full bg-white border border-black/10 focus:border-black rounded-xl px-4 py-2.5 text-xs text-black focus:outline-none transition-all font-medium"
              >
                {friends.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} {f.nickname ? `(${f.nickname})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Quote details */}
            <div>
              <label className="block text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-2">
                珍贵语录或文字叙述 (Quote / Memoir)
              </label>
              <textarea
                id="memory-input-quote"
                placeholder="在此记录下他们说过的经典好句、搞笑言论，或是这个瞬间的温暖发生..."
                rows={4}
                required
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                className="w-full bg-white border border-black/10 focus:border-black rounded-xl px-4 py-2.5 text-xs text-black focus:outline-none transition-all font-medium placeholder:text-zinc-400 placeholder:italic resize-none"
              />
            </div>

            {/* Custom Polaroid photo upload */}
            <div>
              <label className="block text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-2">
                定格照/回忆相片 (Polaroid Photo)
              </label>
              
              <div className="flex gap-4 items-center">
                <label className="flex flex-col items-center justify-center w-24 h-24 border border-dashed border-black/20 hover:border-black rounded-xl cursor-pointer bg-white transition-all p-2 text-center group">
                  <ImageIcon className="w-5 h-5 text-zinc-400 group-hover:text-black mb-1" />
                  <span className="text-[9.5px] text-zinc-500 font-bold tracking-tight">上传相片</span>
                  <span className="text-[8px] text-zinc-400 font-mono">Click here</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>

                {image ? (
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-black/10 bg-black group">
                    <img
                      src={image}
                      alt="Polaroid preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setImage(null)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-rose-600 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/50 text-[7px] text-[#ffb03a] rounded font-mono">
                      READY
                    </span>
                  </div>
                ) : (
                  <div className="text-[10px] text-zinc-400 max-w-[170px] leading-relaxed">
                    选择一张相片，相片将以经典的拍立得/宝丽来摄影画框融入卡片画册中。
                  </div>
                )}
              </div>
            </div>

            {/* Custom tags & chips system */}
            <div>
              <label className="block text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-1">
                分类标签 (Memory Tags)
              </label>

              {/* Predefined chips */}
              <div className="flex flex-wrap gap-1.5 mb-2 mt-1">
                {PRESET_TAGS.map((pt) => {
                  const isSel = selectedTags.includes(pt);
                  return (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => handleTogglePresetTag(pt)}
                      className={`text-[9.5px] px-2.5 py-0.5 rounded-md border transition-all cursor-pointer font-bold ${
                        isSel
                          ? "bg-black text-white border-black"
                          : "bg-white border-black/10 text-zinc-500 hover:text-black hover:border-black"
                      }`}
                    >
                      #{pt}
                    </button>
                  );
                })}
              </div>

              {/* Custom tags manual input */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    id="memory-custom-tag"
                    type="text"
                    placeholder="输入并按回车创建自定义标签..."
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomTag())}
                    className="w-full bg-white border border-black/10 focus:border-black rounded-xl pl-9 pr-4 py-2 text-xs text-black focus:outline-none transition-all placeholder:text-zinc-400 placeholder:italic"
                  />
                  <Tag className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs px-4 rounded-xl transition-all border border-black/5 cursor-pointer"
                >
                  添加
                </button>
              </div>

              {/* Selected customized list */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2 p-2 bg-zinc-50 rounded-xl border border-black/5">
                  {selectedTags.map((t) => (
                    <span
                      key={t}
                      className="text-[9px] bg-white border border-black/10 text-[#1a1a1a] px-2 py-0.5 rounded flex items-center gap-1 font-bold"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => setSelectedTags(selectedTags.filter(tag => tag !== t))}
                        className="text-zinc-400 hover:text-rose-600 ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="pt-4 border-t border-black/5 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-750 font-bold py-3 rounded-xl text-xs tracking-wider uppercase transition-all cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-black hover:bg-zinc-800 text-white font-bold py-3 rounded-xl text-xs tracking-wider uppercase transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{editMemoryData ? "保存修改" : "记录心动瞬间"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
