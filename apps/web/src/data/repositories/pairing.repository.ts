import { callKudapKita } from '@/infrastructure/firebase/functions';

export type OwnerPairingStatus = {
  status: 'CREATED' | 'REQUESTED' | 'APPROVED' | 'CONSUMED' | 'EXPIRED' | 'REJECTED';
  deviceLabel: string;
};
export type OwnerDeviceRecord = {
  id: string;
  label: string;
  status: 'ACTIVE' | 'REVOKED';
  authMethod: 'QR_PAIRING';
  createdAt?: unknown;
  lastSeenAt?: unknown;
};

export async function createOwnerPairingChallenge(): Promise<{ challengeId: string; token: string; expiresAt: number }> {
  return callKudapKita<Record<string, never>, { challengeId: string; token: string; expiresAt: number }>('createOwnerPairingChallenge', {});
}
export async function getOwnerPairingStatus(challengeId: string): Promise<OwnerPairingStatus> {
  return callKudapKita<{ challengeId: string }, OwnerPairingStatus>('getOwnerPairingStatus', { challengeId });
}
export async function approveOwnerPairing(challengeId: string, approve: boolean): Promise<void> {
  await callKudapKita<{ challengeId: string; approve: boolean }, { approved: boolean }>('approveOwnerPairing', { challengeId, approve });
}
export async function requestOwnerPairing(challengeId: string, token: string, deviceLabel: string): Promise<void> {
  await callKudapKita<{ challengeId: string; token: string; deviceLabel: string }, { requested: boolean }>('requestOwnerPairing', { challengeId, token, deviceLabel });
}
export async function consumeOwnerPairing(challengeId: string, token: string): Promise<string> {
  const result = await callKudapKita<{ challengeId: string; token: string }, { customToken: string }>('consumeOwnerPairing', { challengeId, token });
  return result.customToken;
}
export async function listOwnerDevices(): Promise<OwnerDeviceRecord[]> {
  return callKudapKita<Record<string, never>, OwnerDeviceRecord[]>('listOwnerDevices', {});
}
export async function revokeOwnerDevice(deviceId: string): Promise<void> {
  await callKudapKita<{ deviceId: string }, { revoked: boolean }>('revokeOwnerDevice', { deviceId });
}
