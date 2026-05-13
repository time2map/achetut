import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const INSTALLATION_ID_KEY = 'installation_id_v1';

export async function getOrCreateInstallationId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(INSTALLATION_ID_KEY);
  if (existing) return existing;

  // UUID v4, криптостойкий
  const id = Crypto.randomUUID();
  await SecureStore.setItemAsync(INSTALLATION_ID_KEY, id);
  return id;
}
