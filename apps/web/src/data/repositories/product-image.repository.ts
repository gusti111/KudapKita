import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, storage } from '@/infrastructure/firebase/client';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function uploadProductPhoto(file: File): Promise<string> {
  if (!storage) throw new Error('Firebase Storage belum dikonfigurasi. Isi VITE_FIREBASE_STORAGE_BUCKET terlebih dahulu.');
  const ownerUid = auth?.currentUser?.uid;
  if (!ownerUid || auth?.currentUser?.isAnonymous) throw new Error('Sesi owner tidak ditemukan. Silakan masuk ulang.');
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) throw new Error('Format foto harus JPG, PNG, atau WebP.');
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) throw new Error('Ukuran foto harus lebih dari 0 dan maksimal 5 MB.');

  const extension = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
  const safeName = file.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-|-$/g, '').slice(-70) || 'product-photo';
  const randomId = globalThis.crypto?.randomUUID?.() ?? (Date.now() + '-' + Math.random().toString(36).slice(2));
  const storagePath = 'product-images/' + ownerUid + '/' + Date.now() + '-' + randomId + '-' + safeName + '.' + extension;
  const objectRef = ref(storage, storagePath);
  await uploadBytes(objectRef, file, {
    contentType: file.type,
    cacheControl: 'public,max-age=3600',
    customMetadata: { ownerUid },
  });
  return getDownloadURL(objectRef);
}
