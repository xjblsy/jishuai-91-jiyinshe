/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Camera, User2, X, Sparkles, Smile } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { FriendDecrypted } from '../types';

interface AddFriendModalProps {
  onClose: () => void;
  editFriendData?: FriendDecrypted | null;
}

export const AddFriendModal: React.FC<AddFriendModalProps> = ({ onClose, editFriendData }) => {
  const { addFriend, updateFriend } = useVault();
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editFriendData) {
      setName(editFriendData.name);
      setNickname(editFriendData.nickname);
      setAvatar(editFriendData.avatar);
    }
  }, [editFriendData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("请填写姓名！");

    setIsSubmitting(true);
    try {
      if (editFriendData) {
        await updateFriend(editFriendData.id, name.trim(), nickname.trim(), avatar);
      } else {
        await addFriend(name.trim(), nickname.trim(), avatar);
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert("保存失败，请检查数据！");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-black/50 backdrop-blur-md z-50 flex items-end justify-center sans">
      <div className="w-full max-w-[420px] bg-[#FDFCF8] rounded-t-[32px] border-t border-black/10 p-6 space-y-6 animate-slideUp max-h-[90%] overflow-y-auto">
        
        {/* Header control */}
        <div className="flex items-center justify-between border-b border-black/5 pb-4">
          <div className="flex items-center gap-2">
            <h3 className="serif text-base font-bold text-black">
              {editFriendData ? "修改挚友档案" : "新增分类/人物"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-black/10 flex items-center justify-center hover:bg-zinc-100 text-zinc-500 hover:text-black transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Input Form container */}
        <form onSubmit={handleFormSubmit} className="space-y-5">
          {/* Avatar upload center */}
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="relative w-24 h-24 rounded-full bg-zinc-100 border border-black/10 flex items-center justify-center overflow-hidden shadow-sm group transition-all">
              {avatar ? (
                <img
                  src={avatar}
                  alt="Avatar preview"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User2 className="w-8 h-8 text-zinc-400" />
              )}
              
              {/* Invisible file picker cover */}
              <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all gap-1">
                <Camera className="w-4 h-4 text-white" />
                <span className="text-[9px] text-white font-mono font-bold">UPLOADS</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
            
            <p className="text-[10px] text-zinc-400 font-mono">
              头像大小将经过无损自适应压缩
            </p>
          </div>

          <div className="space-y-4 text-left">
            <div>
              <label className="block text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-2">
                挚友真实姓名 (Username) <span className="text-red-500">*</span>
              </label>
              <input
                id="friend-input-name"
                type="text"
                placeholder="例如：陈萨拉 (Leo Thorne)"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-black/10 focus:border-black rounded-xl px-4 py-2.5 text-xs text-black focus:outline-none transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-2">
                形象标签 / 语录注记 (Character Class / Role)
              </label>
              <input
                id="friend-input-nickname"
                type="text"
                placeholder="例如：主理人 / 咖啡诗人 (1-2词)"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full bg-white border border-black/10 focus:border-black rounded-xl px-4 py-2.5 text-xs text-black focus:outline-none transition-all font-medium"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-black/5 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold py-3 rounded-xl text-xs tracking-wider uppercase transition-all cursor-pointer"
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
                  <span>{editFriendData ? "更新" : "创建"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
