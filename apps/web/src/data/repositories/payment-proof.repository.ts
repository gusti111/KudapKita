import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, storage } from '@/infrastructure/firebase/client';
import { callKudapKita } from '@/infrastructure/firebase/functions';

const MAX_PROOF_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

export async function uploadAndSubmitPaymentProof(
  orderId: string,
  paymentMethod: 'BANK_TRANSFER' | 'EWALLET' | 'QRIS',
  file: File,
): Promise<void> {
  if (!storage) throw new Error('Firebase Storage belum dikonfigurasi.');
  const uid = auth?.currentUser?.uid;
  if (!uid) throw new Error('Sesi pelanggan tidak ditemukan. Silakan muat ulang halaman.');
  if (!ALLOWED_TYPES.has(file.type)) throw new Error('Bukti harus berupa JPG, PNG, WebP, atau PDF.');
  if (file.size <= 0 || file.size > MAX_PROOF_BYTES) throw new Error('Ukuran bukti harus lebih dari 0 dan maksimal 5 MB.');

  const extension = file.type === 'application/pdf'
    ? 'pdf'
    : file.type === 'image/jpeg'
      ? 'jpg'
      : file.type === 'image/png'
        ? 'png'
        : 'webp';
  const storagePath = `payment-proofs/${uid}/${orderId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  await uploadBytes(ref(storage, storagePath), file, {
    contentType: file.type,
    cacheControl: 'private,max-age=300',
    customMetadata: { orderId, customerUid: uid },
  });

  await callKudapKita(
    'submitOrderPaymentProof',
    { orderId, paymentMethod, paymentProofPath: storagePath },
  );
}

export async function getOwnerPaymentProofUrl(storagePath: string): Promise<string> {
  if (!storage) throw new Error('Firebase Storage belum dikonfigurasi.');
  return getDownloadURL(ref(storage, storagePath));
}
