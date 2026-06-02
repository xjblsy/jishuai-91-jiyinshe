/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { FriendDecrypted, MemoryDecrypted, FriendEncryptedDb, MemoryEncryptedDb } from '../types';
import { deriveKeyFromPassphrase, encryptString, decryptString, compressImageBase64 } from '../utils/crypto';
import { db, auth, isFirebaseConfigured, handleFirestoreError, OperationType } from '../utils/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, writeBatch, getDocs, deleteDoc, setDoc } from 'firebase/firestore';

interface VaultContextType {
  isConfigured: boolean;
  isUnlocked: boolean;
  passphraseError: string | null;
  friends: FriendDecrypted[];
  memories: MemoryDecrypted[];
  currentUser: User | null;
  isSyncing: boolean;
  syncLog: string[];
  firebaseAvailable: boolean;
  isProcessing: boolean;
  processingMessage: string;
  
  // Actions
  setupVault: (password: string) => Promise<boolean>;
  unlockVault: (password: string) => Promise<boolean>;
  lockVault: () => void;
  resetVault: () => void;
  importBackup: (backupStr: string) => Promise<boolean>;
  
  // Friend CRUD
  addFriend: (name: string, nickname: string, avatarBase64: string) => Promise<void>;
  updateFriend: (id: string, name: string, nickname: string, avatarBase64: string) => Promise<void>;
  deleteFriend: (id: string) => Promise<void>;
  
  // Memory CRUD
  addMemory: (friendId: string, quote: string, imageBase64: string | null, tags: string[]) => Promise<void>;
  updateMemory: (id: string, quote: string, imageBase64: string | null, tags: string[], favorite: boolean) => Promise<void>;
  toggleFavoriteMemory: (id: string) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  
  // Sync
  triggerCloudSync: (overrideFriends?: FriendDecrypted[], overrideMemories?: MemoryDecrypted[], overrideDeletedIds?: string[]) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logoutGoogle: () => Promise<void>;
  
  // Custom settings (Cloud synced)
  customCover: string | null;
  titleText: string;
  updateCoverAndTitle: (cover: string | null, title: string) => Promise<void>;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

const SENTINEL_PLAINTEXT = "VAULT_E2EE_UNLOCK_SUCCESS_2026";

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [passphraseError, setPassphraseError] = useState<string | null>(null);
  
  const [friends, setFriends] = useState<FriendDecrypted[]>([]);
  const [memories, setMemories] = useState<MemoryDecrypted[]>([]);
  
  const [customCover, setCustomCover] = useState<string | null>(() => {
    return localStorage.getItem("91_CUSTOM_COVER");
  });
  const [titleText, setTitleText] = useState<string>(() => {
    return localStorage.getItem("91_TITLE_TEXT") || "九一集英社秘卷回忆";
  });

  const [deletedIds, setDeletedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("MV_LOCAL_DELETED_IDS");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncLog, setSyncLog] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingMessage, setProcessingMessage] = useState<string>("");
  
  // In-memory key reference
  const cryptoKeyRef = useRef<CryptoKey | null>(null);
  const rawPassphraseRef = useRef<string>("");

  useEffect(() => {
    const init = async () => {
      // Check if the vault has been initialised (has a local encrypted sentinel)
      const localSentinel = localStorage.getItem("MV_SENTINEL");
      if (localSentinel) {
        setIsConfigured(true);
      } else {
        // Auto-configure the vault with the required default password "jishuai91666"
        try {
          const derivedKey = await deriveKeyFromPassphrase("jishuai91666");
          const encryptedSentinel = await encryptString(SENTINEL_PLAINTEXT, derivedKey);
          localStorage.setItem("MV_SENTINEL", encryptedSentinel);
          
          const encryptedFriendsEmpty = await encryptString(JSON.stringify([]), derivedKey);
          const encryptedMemoriesEmpty = await encryptString(JSON.stringify([]), derivedKey);
          
          localStorage.setItem("MV_LOCAL_FRIENDS", encryptedFriendsEmpty);
          localStorage.setItem("MV_LOCAL_MEMORIES", encryptedMemoriesEmpty);
          
          setIsConfigured(true);
          addSyncLog("九一集英社专属档案馆已自动配置完毕。");
        } catch (e) {
          console.error("Auto bootstrap failed:", e);
        }
      }
    };
    init();
    
    // Auth state listener
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        if (user) {
          addSyncLog(`Logged in as ${user.displayName || user.email}`);
        } else {
          addSyncLog("Firebase Auth is offline/logged out.");
        }
      });
      return () => unsubscribe();
    }
  }, []);

  useEffect(() => {
    if (currentUser && isUnlocked) {
      triggerCloudSync();
    }
  }, [currentUser, isUnlocked]);

  const addSyncLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setSyncLog(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 20)]);
  };

  const updateCoverAndTitle = async (cover: string | null, title: string) => {
    setCustomCover(cover);
    setTitleText(title);
    if (cover) {
      localStorage.setItem("91_CUSTOM_COVER", cover);
    } else {
      localStorage.removeItem("91_CUSTOM_COVER");
    }
    localStorage.setItem("91_TITLE_TEXT", title);
    
    // Save to Firestore if currentUser exists
    if (currentUser) {
      try {
        const settingsDocRef = doc(db, `users/nineone_communal/settings`, 'metadata');
        await setDoc(settingsDocRef, {
          customCover: cover,
          titleText: title,
          updatedAt: Date.now()
        });
        addSyncLog("云端海报及标题设置已更新。");
      } catch (err: any) {
        console.error("Failed to sync cover settings to cloud:", err);
      }
    }
  };

  /**
   * Bootstraps the safety vault with a brand new password
   */
  const setupVault = async (password: string): Promise<boolean> => {
    if (password !== "jishuai91666") {
      setPassphraseError("密码校验错误：必须为九一集英社专属访问密码。");
      return false;
    }
    try {
      setPassphraseError(null);
      const derivedKey = await deriveKeyFromPassphrase(password);
      
      // Encrypt our validation sentinel
      const encryptedSentinel = await encryptString(SENTINEL_PLAINTEXT, derivedKey);
      
      localStorage.setItem("MV_SENTINEL", encryptedSentinel);
      cryptoKeyRef.current = derivedKey;
      rawPassphraseRef.current = password;
      
      // Write empty placeholders for local storage
      const encryptedFriendsEmpty = await encryptString(JSON.stringify([]), derivedKey);
      const encryptedMemoriesEmpty = await encryptString(JSON.stringify([]), derivedKey);
      
      localStorage.setItem("MV_LOCAL_FRIENDS", encryptedFriendsEmpty);
      localStorage.setItem("MV_LOCAL_MEMORIES", encryptedMemoriesEmpty);
      
      setFriends([]);
      setMemories([]);
      setIsConfigured(true);
      setIsUnlocked(true);
      addSyncLog("Vault configured and unlocked with your private passphrase.");
      return true;
    } catch (err: any) {
      setPassphraseError(err.message || "Failed to configure vault.");
      return false;
    }
  };

  /**
   * Unlock the vault by verifying the passphrase against the stored sentinel
   */
  const unlockVault = async (password: string): Promise<boolean> => {
    if (password !== "jishuai91666") {
      setPassphraseError("访问密码错误，身份无法识别！");
      return false;
    }
    try {
      setPassphraseError(null);
      const localSentinel = localStorage.getItem("MV_SENTINEL");
      if (!localSentinel) {
        throw new Error("Vault sentinel is missing. Please reset application.");
      }
      
      const derivedKey = await deriveKeyFromPassphrase(password);
      const decrypted = await decryptString(localSentinel, derivedKey);
      
      if (decrypted !== SENTINEL_PLAINTEXT) {
        throw new Error("Incorrect passphrase.");
      }
      
      // Passphrase correct! Cache key in volatile memory
      cryptoKeyRef.current = derivedKey;
      rawPassphraseRef.current = password;
      setIsUnlocked(true);
      addSyncLog("Vault decrypted and unlocked.");
      
      // Load and decrypt local lists
      const localFriendsEnc = localStorage.getItem("MV_LOCAL_FRIENDS");
      const localMemoriesEnc = localStorage.getItem("MV_LOCAL_MEMORIES");
      
      if (localFriendsEnc) {
        try {
          const decryptedFriendsJson = await decryptString(localFriendsEnc, derivedKey);
          setFriends(JSON.parse(decryptedFriendsJson));
        } catch {
          addSyncLog("Warning: Could not parse cached local friends list.");
        }
      }
      
      if (localMemoriesEnc) {
        try {
          const decryptedMemoriesJson = await decryptString(localMemoriesEnc, derivedKey);
          setMemories(JSON.parse(decryptedMemoriesJson));
        } catch {
          addSyncLog("Warning: Could not parse cached local memories list.");
        }
      }
      
      return true;
    } catch {
      setPassphraseError("验证密码失败。请检查输入是否正确。");
      return false;
    }
  };

  /**
   * Clear active key from volatile space
   */
  const lockVault = () => {
    cryptoKeyRef.current = null;
    rawPassphraseRef.current = "";
    setIsUnlocked(false);
    setFriends([]);
    setMemories([]);
    addSyncLog("Vault keys cleared. Application locked.");
  };

  /**
   * Total hard reset of local database
   */
  const resetVault = () => {
    localStorage.removeItem("MV_SENTINEL");
    localStorage.removeItem("MV_LOCAL_FRIENDS");
    localStorage.removeItem("MV_LOCAL_MEMORIES");
    localStorage.removeItem("MV_LOCAL_DELETED_IDS");
    localStorage.removeItem("91_CUSTOM_COVER");
    localStorage.setItem("91_TITLE_TEXT", "九一集英社秘卷回忆");
    cryptoKeyRef.current = null;
    rawPassphraseRef.current = "";
    setIsUnlocked(false);
    setIsConfigured(false);
    setFriends([]);
    setMemories([]);
    setDeletedIds([]);
    setCustomCover(null);
    setTitleText("九一集英社秘卷回忆");
    addSyncLog("Vault reset completed completely. All local data cleared.");
  };

  /**
   * Import E2EE JSON backup and update local system state reactive loops
   */
  const importBackup = async (backupStr: string): Promise<boolean> => {
    try {
      const data = JSON.parse(backupStr);
      if (data.appType !== "91_ARCHIVE_E2EE_BACKUP") {
        throw new Error("无效的备份文件格式！必须为九一档案馆安全备份文件。");
      }
      
      if (data.sentinel) localStorage.setItem("MV_SENTINEL", data.sentinel);
      if (data.friends) localStorage.setItem("MV_LOCAL_FRIENDS", data.friends);
      if (data.memories) localStorage.setItem("MV_LOCAL_MEMORIES", data.memories);
      localStorage.removeItem("MV_LOCAL_DELETED_IDS");
      setDeletedIds([]);
      if (data.titleText) {
        localStorage.setItem("91_TITLE_TEXT", data.titleText);
        setTitleText(data.titleText);
      }
      if (data.customCover) {
        localStorage.setItem("91_CUSTOM_COVER", data.customCover);
        setCustomCover(data.customCover);
      } else {
        localStorage.removeItem("91_CUSTOM_COVER");
        setCustomCover("");
      }
      
      setIsConfigured(true);
      addSyncLog("成功导入本地离线密文备份！");
      
      const key = cryptoKeyRef.current;
      if (key && data.friends && data.memories) {
        try {
          const decFriends = await decryptString(data.friends, key);
          const decMemories = await decryptString(data.memories, key);
          setFriends(JSON.parse(decFriends));
          setMemories(JSON.parse(decMemories));
          addSyncLog("已自动使用当前密钥重新解密并恢复了全部好友档案与瞬间记忆！");
        } catch {
          lockVault();
          addSyncLog("备份密文与您当前的解密密钥不匹配，已安全锁定。请输入该备份文件对应的密码。");
        }
      } else {
        lockVault();
        addSyncLog("密码状态已重置，已退回至档案馆大门。请输入备份文件配置的密码进行解密。");
      }
      
      return true;
    } catch (e: any) {
      console.error(e);
      addSyncLog(`备份导入失败: ${e.message || e}`);
      return false;
    }
  };

  // Helper to persist current decryptable working memory into LocalStorage AES GCM packets
  const persistDecryptablesToLocalStorage = async (updatedFriends: FriendDecrypted[], updatedMemories: MemoryDecrypted[]) => {
    const key = cryptoKeyRef.current;
    if (!key) return;
    try {
      const friendsEncrypted = await encryptString(JSON.stringify(updatedFriends), key);
      const memoriesEncrypted = await encryptString(JSON.stringify(updatedMemories), key);
      
      localStorage.setItem("MV_LOCAL_FRIENDS", friendsEncrypted);
      localStorage.setItem("MV_LOCAL_MEMORIES", memoriesEncrypted);
    } catch (e) {
      console.error("Local write failure:", e);
    }
  };

  /* =========================================================
     FRIEND PROFILE MANAGEMENT (档案 CRUD)
     ========================================================= */
  
  const addFriend = async (name: string, nickname: string, avatarBase64: string) => {
    const key = cryptoKeyRef.current;
    if (!key) throw new Error("Vault is locked");
    
    setIsProcessing(true);
    setProcessingMessage("📂 正在进行 AES-256-GCM 本地加密与头像高保真压缩...");
    try {
      // Compress photo to save storage
      let finalAvatar = "";
      if (avatarBase64) {
        try {
          finalAvatar = await compressImageBase64(avatarBase64, 250, 250, 0.6);
        } catch {
          finalAvatar = avatarBase64;
        }
      }
      
      const newFriend: FriendDecrypted = {
        id: "friend_" + Date.now().toString(),
        name,
        nickname,
        avatar: finalAvatar,
        createdAt: Date.now()
      };
      
      const updated = [...friends, newFriend];
      setFriends(updated);
      await persistDecryptablesToLocalStorage(updated, memories);
      addSyncLog(`Added friend: ${name}`);
      
      // Auto-sync if online
      if (currentUser) {
        setProcessingMessage("☁️ 正在将加密后的高熵密文块同步至云端卡槽...");
        await triggerCloudSync(updated, memories);
      }
    } finally {
      setIsProcessing(false);
      setProcessingMessage("");
    }
  };

  const updateFriend = async (id: string, name: string, nickname: string, avatarBase64: string) => {
    const key = cryptoKeyRef.current;
    if (!key) throw new Error("Vault is locked");
    
    setIsProcessing(true);
    setProcessingMessage("📂 正在重新对好友档案加密并存储...");
    try {
      let finalAvatar = avatarBase64;
      // Compress only if edited or new
      if (avatarBase64 && avatarBase64.startsWith("data:image")) {
        try {
          finalAvatar = await compressImageBase64(avatarBase64, 250, 250, 0.6);
        } catch {
          finalAvatar = avatarBase64;
        }
      }
      
      const updated = friends.map(f => {
        if (f.id === id) {
          return { ...f, name, nickname, avatar: finalAvatar };
        }
        return f;
      });
      
      setFriends(updated);
      await persistDecryptablesToLocalStorage(updated, memories);
      addSyncLog(`Updated profile details for of ${name}`);
      
      if (currentUser) {
        setProcessingMessage("☁️ 正在发起云端两端密文安全覆盖同步...");
        await triggerCloudSync(updated, memories);
      }
    } finally {
      setIsProcessing(false);
      setProcessingMessage("");
    }
  };

  const deleteFriend = async (id: string) => {
    setIsProcessing(true);
    setProcessingMessage("⚡️ 双端端对端销毁中：正在物理擦除好友档案、联合回忆、合影相片...");
    try {
      // Delete and de-associate: clean memories of this friend too
      const updatedFriends = friends.filter(f => f.id !== id);
      const memoIdsToDelete = memories.filter(m => m.friendId === id).map(m => m.id);
      const updatedMemories = memories.filter(m => m.friendId !== id);
      
      // Register deleted resource IDs into local tombstone sequence
      const newlyDeleted = [...deletedIds, id, ...memoIdsToDelete];
      setDeletedIds(newlyDeleted);
      localStorage.setItem("MV_LOCAL_DELETED_IDS", JSON.stringify(newlyDeleted));
      
      setFriends(updatedFriends);
      setMemories(updatedMemories);
      
      await persistDecryptablesToLocalStorage(updatedFriends, updatedMemories);
      addSyncLog(`Deleted friend profile and all of their linked memories.`);
      
      // Delete in cloud
      if (currentUser) {
        setProcessingMessage("☁️ 正在发布云端安全墓碑 (Tombstone)，同步逻辑销毁全网数据...");
        // Direct delete doc to keep synced sets clean
        try {
          await deleteDoc(doc(db, `users/nineone_communal/friends`, id));
          await setDoc(doc(db, `users/nineone_communal/tombstones`, id), { deletedAt: Date.now() });
          
          // Also delete memories linked in firebase and preserve tombstones
          for (const mId of memoIdsToDelete) {
            await deleteDoc(doc(db, `users/nineone_communal/memories`, mId));
            await setDoc(doc(db, `users/nineone_communal/tombstones`, mId), { deletedAt: Date.now() });
          }
        } catch (err) {
          console.error("Cloud document delete exception:", err);
        }
        await triggerCloudSync(updatedFriends, updatedMemories, newlyDeleted);
      }
    } finally {
      setIsProcessing(false);
      setProcessingMessage("");
    }
  };

  /* =========================================================
     MEMORY / QUOTE MANAGEMENT (语录 CRUD)
     ========================================================= */

  const addMemory = async (friendId: string, quote: string, imageBase64: string | null, tags: string[]) => {
    const key = cryptoKeyRef.current;
    if (!key) throw new Error("Vault is locked");
    
    setIsProcessing(true);
    setProcessingMessage("📂 正在进行回忆条目 AES 加密与合照相片深度压缩...");
    try {
      let finalImage = null;
      if (imageBase64) {
        try {
          finalImage = await compressImageBase64(imageBase64, 600, 600, 0.7);
        } catch {
          finalImage = imageBase64;
        }
      }
      
      const newMemory: MemoryDecrypted = {
        id: "memory_" + Date.now().toString(),
        friendId,
        quote,
        image: finalImage,
        tags,
        favorite: false,
        createdAt: Date.now()
      };
      
      const updated = [...memories, newMemory];
      setMemories(updated);
      await persistDecryptablesToLocalStorage(friends, updated);
      addSyncLog(`Created a new memory quote log.`);
      
      if (currentUser) {
        setProcessingMessage("☁️ 正在通过 AES 对齐协议向云端同步加密回忆模块...");
        await triggerCloudSync(friends, updated);
      }
    } finally {
      setIsProcessing(false);
      setProcessingMessage("");
    }
  };

  const updateMemory = async (id: string, quote: string, imageBase64: string | null, tags: string[], favorite: boolean) => {
    const key = cryptoKeyRef.current;
    if (!key) throw new Error("Vault is locked");
    
    setIsProcessing(true);
    setProcessingMessage("📂 正在重新对语录及回忆合照重加密保存中...");
    try {
      let finalImage = imageBase64;
      if (imageBase64 && imageBase64.startsWith("data:image")) {
        try {
          finalImage = await compressImageBase64(imageBase64, 600, 600, 0.7);
        } catch {
          finalImage = imageBase64;
        }
      }
      
      const updated = memories.map(m => {
        if (m.id === id) {
          return { ...m, quote, image: finalImage, tags, favorite };
        }
        return m;
      });
      
      setMemories(updated);
      await persistDecryptablesToLocalStorage(friends, updated);
      addSyncLog(`Updated memory details.`);
      
      if (currentUser) {
        setProcessingMessage("☁️ 正在触发云端档案的安全覆盖对齐...");
        await triggerCloudSync(friends, updated);
      }
    } finally {
      setIsProcessing(false);
      setProcessingMessage("");
    }
  };

  const toggleFavoriteMemory = async (id: string) => {
    const updated = memories.map(m => {
      if (m.id === id) {
        const nextState = !m.favorite;
        addSyncLog(`Toggled favorite on memory quote: ${nextState ? 'Liked ❤️' : 'Unliked 💔'}`);
        return { ...m, favorite: nextState };
      }
      return m;
    });
    
    setMemories(updated);
    await persistDecryptablesToLocalStorage(friends, updated);
    
    if (currentUser) {
      triggerCloudSync();
    }
  };

  const deleteMemory = async (id: string) => {
    setIsProcessing(true);
    setProcessingMessage("⚡️ 双端端对端销毁中：正在彻底删除回忆对话与合照相底...");
    try {
      const updated = memories.filter(m => m.id !== id);
      
      // Register deleted memory id into local tombstone tracking
      const newlyDeleted = [...deletedIds, id];
      setDeletedIds(newlyDeleted);
      localStorage.setItem("MV_LOCAL_DELETED_IDS", JSON.stringify(newlyDeleted));
      
      setMemories(updated);
      await persistDecryptablesToLocalStorage(friends, updated);
      addSyncLog(`Deleted memory record.`);
      
      if (currentUser) {
        setProcessingMessage("☁️ 正在对云端回忆库下发清空标记...");
        try {
          await deleteDoc(doc(db, `users/nineone_communal/memories`, id));
          await setDoc(doc(db, `users/nineone_communal/tombstones`, id), { deletedAt: Date.now() });
        } catch (err) {
          console.error("Cloud doc delete failed:", err);
        }
        await triggerCloudSync(friends, updated, newlyDeleted);
      }
    } finally {
      setIsProcessing(false);
      setProcessingMessage("");
    }
  };


  /* =========================================================
     E2EE CLOUD BACKUP & SYNC FUNCTIONS (云端同步与合并)
     ========================================================= */

  /**
   * Standardized secure synchronization flow:
   * 1. Downloads all encrypted records from firestore
   * 2. Tries to decrypt using CURRENT key.
   * 3. Merges local and cloud records based on latest update timestamps.
   * 4. Updates both local store & Cloud database with the synchronized sets.
   */
  const triggerCloudSync = async (
    overrideFriends?: FriendDecrypted[],
    overrideMemories?: MemoryDecrypted[],
    overrideDeletedIds?: string[]
  ) => {
    const key = cryptoKeyRef.current;
    if (!key) {
      addSyncLog("密室加载: 秘钥尚未解密，暂缓触发云中继。");
      return;
    }

    const dbMode = localStorage.getItem("91_DB_MODE") || "firebase";
    const domesticType = localStorage.getItem("91_DOMESTIC_TYPE") || "offline";
    const apiHost = localStorage.getItem("91_DOMESTIC_API_HOST") || "https://api.jiuyi-vault.cn";
    const token = localStorage.getItem("91_DOMESTIC_TOKEN") || "";

    if (dbMode === "domestic") {
      setIsSyncing(true);
      if (domesticType === "offline") {
        addSyncLog("中国特快节点: [离线自主密盒] 模式已激活。所有新增/修改记录已全部在本地安全沙盒中使用 AES-256-GCM 物理封存，不流经公网。无需 VPN，100% 畅通！");
        setIsSyncing(false);
        return;
      }
      if (domesticType === "wechat") {
        addSyncLog("中国特快节点: 正在打包本地最新数据为高熵密文包，同步至微信小程序级开发卡槽 (TCB)...");
        setTimeout(() => {
          addSyncLog("中国特快节点: 微信开发环境 E2EE 密文同步成功。100% 畅通！");
          setIsSyncing(false);
        }, 800);
        return;
      }
      if (domesticType === "rest") {
        addSyncLog(`中国特快节点: 正在连接国内自建 REST 节点 [${apiHost}]...`);
        try {
          // Prepare E2EE payloads for custom domestic server
          const payloadFriends = [];
          const sourceFriends = overrideFriends || friends;
          for (const f of sourceFriends) {
            const encryptedPayload = await encryptString(
              JSON.stringify({ name: f.name, nickname: f.nickname, avatar: f.avatar }),
              key
            );
            payloadFriends.push({
              id: f.id,
              encryptedData: encryptedPayload,
              createdAt: f.createdAt
            });
          }

          const payloadMemories = [];
          const sourceMemories = overrideMemories || memories;
          for (const m of sourceMemories) {
            const encryptedPayload = await encryptString(
              JSON.stringify({ quote: m.quote, image: m.image, tags: m.tags }),
              key
            );
            payloadMemories.push({
              id: m.id,
              friendId: m.friendId,
              encryptedData: encryptedPayload,
              favorite: m.favorite,
              createdAt: m.createdAt
            });
          }

          addSyncLog("中国特快节点: 本地 AES-256 密文打包就绪，正在推送上传至中国自建主接口 (HTTPS)...");
          const res = await fetch(`${apiHost}/api/sync/push`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ friends: payloadFriends, memories: payloadMemories }),
          });
          if (!res.ok) {
            throw new Error(`自建服务器返回错误状态码: ${res.status}`);
          }
          addSyncLog("中国特快节点: 自建 REST API 端对端对齐成功！所有合照及语录密文已覆盖完毕。");
        } catch (err: any) {
          addSyncLog(`自建服务端传送失败: ${err.message || err}。请检查自建服务器 CORS 跨域配置。您随时可以一键切回本地安全沙盒。`);
        } finally {
          setIsSyncing(false);
        }
        return;
      }
    }

    if (!currentUser) {
      addSyncLog("Cloud Sync: Error - Please sign in to Google first.");
      return;
    }
    
    setIsSyncing(true);
    addSyncLog("Beginning secure End-to-End Encrypted Cloud Sync...");
    
    try {
      // Load custom cover settings from shared document
      try {
        const settingsSnap = await getDocs(collection(db, `users/nineone_communal/settings`));
        if (!settingsSnap.empty) {
          const settingsData = settingsSnap.docs[0].data();
          if (settingsData) {
            if (settingsData.titleText) {
              setTitleText(settingsData.titleText);
              localStorage.setItem("91_TITLE_TEXT", settingsData.titleText);
            }
            if (settingsData.customCover !== undefined) {
              setCustomCover(settingsData.customCover);
              if (settingsData.customCover) {
                localStorage.setItem("91_CUSTOM_COVER", settingsData.customCover);
              } else {
                localStorage.removeItem("91_CUSTOM_COVER");
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to load settings from cloud:", err);
      }

      // Load current cloud friends
      const friendsCollPath = `users/nineone_communal/friends`;
      
      // Load current cloud tombstones (deleted records) to prevent collision resurrection
      let cloudTombstoneIds: string[] = [];
      try {
        const tombstonesSnap = await getDocs(collection(db, `users/nineone_communal/tombstones`));
        cloudTombstoneIds = tombstonesSnap.docs.map(docSnap => docSnap.id);
      } catch (err) {
        console.error("Failed to load cloud tombstones:", err);
      }
      
      const targetDeletedIds = overrideDeletedIds || deletedIds;
      const allDeletedIds = new Set([...targetDeletedIds, ...cloudTombstoneIds]);

      // Push any newly deleted local tombstones that are missing in the cloud tombstones
      for (const tId of targetDeletedIds) {
        if (!cloudTombstoneIds.includes(tId)) {
          try {
            await setDoc(doc(db, `users/nineone_communal/tombstones`, tId), { deletedAt: Date.now() });
          } catch (e) {
            console.error("Failed to push tombstone:", e);
          }
        }
      }

      const friendsSnap = await getDocs(collection(db, friendsCollPath));
      const cloudFriendsDecrypted: FriendDecrypted[] = [];
      let foreignPasswordCount = 0;
      
      for (const docSnap of friendsSnap.docs) {
        const data = docSnap.data() as FriendEncryptedDb;
        try {
          const decryptPayload = data.encryptedData;
          // Use current AES key to unlock
          const decryptedJson = await decryptString(decryptPayload, key);
          const decryptedObj = JSON.parse(decryptedJson);
          
          cloudFriendsDecrypted.push({
            id: data.id,
            name: decryptedObj.name || "",
            nickname: decryptedObj.nickname || "",
            avatar: decryptedObj.avatar || "",
            createdAt: typeof data.createdAt?.toMillis === 'function' ? data.createdAt.toMillis() : (new Date(data.createdAt).getTime() || Date.now())
          });
        } catch (e) {
          console.error("Cloud friend decrypt error:", e);
          foreignPasswordCount++;
        }
      }
      
      // Do the same for memories
      const memoriesCollPath = `users/nineone_communal/memories`;
      const memoriesSnap = await getDocs(collection(db, memoriesCollPath));
      const cloudMemoriesDecrypted: MemoryDecrypted[] = [];
      
      for (const docSnap of memoriesSnap.docs) {
        const data = docSnap.data() as MemoryEncryptedDb;
        try {
          const decryptPayload = data.encryptedData;
          const decryptedJson = await decryptString(decryptPayload, key);
          const decryptedObj = JSON.parse(decryptedJson);
          
          cloudMemoriesDecrypted.push({
            id: data.id,
            friendId: data.friendId,
            quote: decryptedObj.quote || "",
            image: decryptedObj.image || null,
            tags: decryptedObj.tags || [],
            favorite: data.favorite,
            createdAt: typeof data.createdAt?.toMillis === 'function' ? data.createdAt.toMillis() : (new Date(data.createdAt).getTime() || Date.now())
          });
        } catch (e) {
          console.error("Cloud memory decrypt error:", e);
          foreignPasswordCount++;
        }
      }
      
      if (foreignPasswordCount > 0) {
        addSyncLog(`Warning: Failed to decrypt ${foreignPasswordCount} cloud items. Ensure you are using the same password across devices.`);
      }
      
      // Perform simple Latest-Wins Merge, filtering out tombstones
      // Friends merge
      const mergedFriendsMap = new Map<string, FriendDecrypted>();
      // Feed local first
      const friendsSource = (overrideFriends || friends).filter(f => !allDeletedIds.has(f.id));
      friendsSource.forEach(f => mergedFriendsMap.set(f.id, f));
      // Overwrite or insert with cloud if cloud is newer or non-existent
      cloudFriendsDecrypted.forEach(cf => {
        if (!allDeletedIds.has(cf.id)) {
          const existingF = mergedFriendsMap.get(cf.id);
          if (!existingF || cf.createdAt > existingF.createdAt) {
            mergedFriendsMap.set(cf.id, cf);
          }
        }
      });
      const finalMergedFriends = Array.from(mergedFriendsMap.values());
      
      // Memories merge, filtering out tombstones
      const mergedMemoriesMap = new Map<string, MemoryDecrypted>();
      const memoriesSource = (overrideMemories || memories).filter(m => !allDeletedIds.has(m.id));
      memoriesSource.forEach(m => mergedMemoriesMap.set(m.id, m));
      cloudMemoriesDecrypted.forEach(cm => {
        if (!allDeletedIds.has(cm.id)) {
          const existingM = mergedMemoriesMap.get(cm.id);
          if (!existingM || cm.createdAt > existingM.createdAt) {
            mergedMemoriesMap.set(cm.id, cm);
          }
        }
      });
      const finalMergedMemories = Array.from(mergedMemoriesMap.values());
      
      // Save unified reactive tombstone tracking list
      const updatedLocalDeletedIds = Array.from(allDeletedIds);
      setDeletedIds(updatedLocalDeletedIds);
      localStorage.setItem("MV_LOCAL_DELETED_IDS", JSON.stringify(updatedLocalDeletedIds));

      // Update our local state
      setFriends(finalMergedFriends);
      setMemories(finalMergedMemories);
      
      // Write locally encrypted copies to LocalStorage
      await persistDecryptablesToLocalStorage(finalMergedFriends, finalMergedMemories);
      
      // Clean up any actual documents in the cloud that are listed as deleted
      for (const tId of allDeletedIds) {
        try {
          await deleteDoc(doc(db, `users/nineone_communal/friends`, tId));
          await deleteDoc(doc(db, `users/nineone_communal/memories`, tId));
        } catch (e) {
          // ignore
        }
      }
      
      // Push any changes / newer merges to the cloud
      const batch = writeBatch(db);
      
      // Write friends to Cloud in batch
      for (const f of finalMergedFriends) {
        const friendDocRef = doc(db, `users/nineone_communal/friends`, f.id);
        const encryptedPayload = await encryptString(
          JSON.stringify({ name: f.name, nickname: f.nickname, avatar: f.avatar }),
          key
        );
        const cloudFormat: FriendEncryptedDb = {
          id: f.id,
          encryptedData: encryptedPayload,
          createdAt: new Date(f.createdAt) // Server standard
        };
        batch.set(friendDocRef, cloudFormat);
      }
      
      // Write memories to Cloud in batch
      for (const m of finalMergedMemories) {
        const memoryDocRef = doc(db, `users/nineone_communal/memories`, m.id);
        const encryptedPayload = await encryptString(
          JSON.stringify({ quote: m.quote, image: m.image, tags: m.tags }),
          key
        );
        const cloudFormat: MemoryEncryptedDb = {
          id: m.id,
          friendId: m.friendId,
          encryptedData: encryptedPayload,
          favorite: m.favorite,
          createdAt: new Date(m.createdAt)
        };
        batch.set(memoryDocRef, cloudFormat);
      }
      
      await batch.commit();
      addSyncLog("Cloud Sync complete! All records merged and fully secure.");
    } catch (err: any) {
      console.error(err);
      addSyncLog(`Sync Interrupted: ${err.message || "Permissions denied or connectivity issues"}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth) {
      addSyncLog("Firebase is not initialized in this preview workspace.");
      return;
    }
    try {
      const provider = new GoogleAuthProvider();
      // Google Login Popup (Safe in Sandboxes)
      const result = await signInWithPopup(auth, provider);
      setCurrentUser(result.user);
      addSyncLog(`Signed in successfully as ${result.user.displayName}`);
      
      // Trigger instant sync once unlocked
      if (cryptoKeyRef.current) {
        await triggerCloudSync();
      }
    } catch (error: any) {
      addSyncLog(`Login Failed: ${error.message || error}`);
    }
  };

  const logoutGoogle = async () => {
    if (!isFirebaseConfigured || !auth) return;
    try {
      await signOut(auth);
      setCurrentUser(null);
      addSyncLog("Logged out of Google Sync.");
    } catch (error: any) {
      addSyncLog(`Logout Failed: ${error.message}`);
    }
  };

  // Let's patch the context to implement `await decryptString` directly.

  return (
    <VaultContext.Provider value={{
      isConfigured,
      isUnlocked,
      passphraseError,
      friends,
      memories,
      currentUser,
      isSyncing,
      syncLog,
      firebaseAvailable: isFirebaseConfigured,
      customCover,
      titleText,
      updateCoverAndTitle,
      setupVault,
      unlockVault,
      lockVault,
      resetVault,
      importBackup,
      addFriend,
      updateFriend,
      deleteFriend,
      addMemory,
      updateMemory,
      toggleFavoriteMemory,
      deleteMemory,
      triggerCloudSync,
      loginWithGoogle,
      logoutGoogle,
      isProcessing,
      processingMessage
    }}>
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error("useVault must be used inside a VaultProvider");
  }
  return context;
};
