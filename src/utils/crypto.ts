/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Native helpers for base64 conversions of ArrayBuffers
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Convert a clear text string to encryption-ready Uint8Array
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

// Salt for PBKDF2 (constant so we can re-derive the same key of a master passphrase on different devices)
const SALT_BYTES = textEncoder.encode("MemoryVault_Salt_E2EE_2026");

/**
 * Derives a CryptoKey from a user passphrase using PBKDF2 with SHA-256
 */
export async function deriveKeyFromPassphrase(passphrase: string): Promise<CryptoKey> {
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    textEncoder.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: SALT_BYTES,
      iterations: 30000,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a plaintext string using AES-GCM 256.
 * Returns a combined string containing base64 IV and base64 Ciphertext: "IV.CIPHERTEXT"
 */
export async function encryptString(plaintext: string, key: CryptoKey): Promise<string> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedText = textEncoder.encode(plaintext);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    key,
    encodedText
  );

  const ivBase64 = arrayBufferToBase64(iv.buffer);
  const cipherBase64 = arrayBufferToBase64(encryptedBuffer);

  return `${ivBase64}.${cipherBase64}`;
}

/**
 * Decrypts a combined string "IV.CIPHERTEXT" using AES-GCM 256 with the key.
 */
export async function decryptString(ciphertextCombo: string, key: CryptoKey): Promise<string> {
  const parts = ciphertextCombo.split('.');
  if (parts.length !== 2) {
    throw new Error("Invalid cipher text format");
  }

  const ivBuffer = base64ToArrayBuffer(parts[0]);
  const cipherBuffer = base64ToArrayBuffer(parts[1]);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(ivBuffer)
    },
    key,
    cipherBuffer
  );

  return textDecoder.decode(decryptedBuffer);
}

/**
 * Image helper: Compress base64 images client-side to prevent memory blowups.
 * Scales images down dynamically while maintaining correct bounds and aspect ratio.
 */
export function compressImageBase64(base64Str: string, maxWidth = 400, maxHeight = 400, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(base64Str); // fallback to original
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = (err) => {
      reject(err);
    };
  });
}
