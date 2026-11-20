import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, storage } from '@/infrastructure/firebase/client';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

async function optimizeProductPhoto(file: File): Promise<File> {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return file;
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    if (scale === 1 && file.size < 420 * 1024 && file.type === 'image/webp') return file;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.84));
    if (!blob || blob.size >= file.size) return file;
    const baseName = file.name.replace(/\.[^.]+$/, '').normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').slice(-60) || 'product-photo';
    return new File([blob], `${baseName}.webp`, { type: 'image/webp', lastModified: Date.now() });
  } catch {
    return file;
  } finally {
    bitmap?.close();
  }
}

export async function uploadProductPhoto(file: File): Promise<string> {
  if (!storage) throw new Error('Firebase Storage belum dikonfigurasi. Isi VITE_FIREBASE_STORAGE_BUCKET terlebih dahulu.');
  const ownerUid = auth?.currentUser?.uid;
  if (!ownerUid || auth?.currentUser?.isAnonymous) throw new Error('Sesi owner tidak ditemukan. Silakan masuk ulang.');
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) throw new Error('Format foto harus JPG, PNG, atau WebP.');
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) throw new Error('Ukuran foto harus lebih dari 0 dan maksimal 5 MB.');

  const optimizedFile = await optimizeProductPhoto(file);
  const extension = optimizedFile.type === 'image/jpeg' ? 'jpg' : optimizedFile.type === 'image/png' ? 'png' : 'webp';
  const safeName = optimizedFile.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-|-$/g, '').slice(-70) || 'product-photo';
  const randomId = globalThis.crypto?.randomUUID?.() ?? (Date.now() + '-' + Math.random().toString(36).slice(2));
  const storagePath = 'product-images/' + ownerUid + '/' + Date.now() + '-' + randomId + '-' + safeName.replace(/\.[^.]+$/, '') + '.' + extension;
  const objectRef = ref(storage, storagePath);
  await uploadBytes(objectRef, optimizedFile, {
    contentType: optimizedFile.type,
    cacheControl: 'public,max-age=3600',
    customMetadata: { ownerUid, optimized: String(optimizedFile !== file) },
  });
  return getDownloadURL(objectRef);
}

/** Delete only objects inside the configured project's public product-images bucket. */
export async function deleteProductPhoto(imageUrl: string): Promise<boolean> {
  if (!storage || !imageUrl) return false;
  const ownerUid = auth?.currentUser?.uid;
  if (!ownerUid || auth?.currentUser?.isAnonymous) throw new Error('Sesi owner tidak ditemukan. Silakan masuk ulang.');
  const bucket = storage.app.options.storageBucket;
  if (!bucket) return false;
  let parsed: URL;
  try { parsed = new URL(imageUrl); } catch { return false; }
  if (parsed.hostname !== 'firebasestorage.googleapis.com' || !parsed.pathname.startsWith(`/v0/b/${bucket}/o/product-images%2F${ownerUid}%2F`)) return false;
  await deleteObject(ref(storage, imageUrl));
  return true;
}
