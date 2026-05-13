import { create } from 'zustand';
import { getOrCreateInstallationId } from '@shared/utils/installation-id';
import { env } from '@shared/config/env';

type InstallationIdState = {
  xUserId: string | null;
  isLoading: boolean;
  error: string | null;
  ensureInstallationId: () => Promise<string>;
};

export const useInstallationIdStore = create<InstallationIdState>((set, get) => ({
  xUserId: env.xUserId ?? null,
  isLoading: false,
  error: null,
  ensureInstallationId: async () => {
    const cached = get().xUserId;
    if (cached) return cached;

    set({ isLoading: true, error: null });
    try {
      const id = await getOrCreateInstallationId();
      set({ xUserId: id, isLoading: false });
      return id;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load installation id';
      set({ error: message, isLoading: false });
      throw error;
    }
  }
}));
