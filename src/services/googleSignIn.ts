import { invoke, isTauri } from '@tauri-apps/api/core';
import { GoogleAuthProvider, signInWithCredential, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase';

export async function signInWithGoogle(): Promise<void> {
  if (!auth) throw new Error('Firebase is not configured.');
  if (!isTauri()) {
    await signInWithPopup(auth, new GoogleAuthProvider());
    return;
  }
  const clientId = import.meta.env.VITE_GOOGLE_DESKTOP_CLIENT_ID;
  if (!clientId) throw new Error('Set VITE_GOOGLE_DESKTOP_CLIENT_ID to a Google Desktop OAuth client ID.');
  const idToken = await invoke<string>('sign_in_with_google', { clientId });
  await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
}
