import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OPENAI_MODELS } from '../utils/constants';

export type OpenAiModel = (typeof OPENAI_MODELS)[number]['value'];

type AiSettingsState = {
  openAiModel: OpenAiModel;
  setOpenAiModel: (model: OpenAiModel) => void;
  clearCache: () => Promise<void>;
};

export const DEFAULT_OPENAI_MODEL: OpenAiModel = 'gpt-4o';

export const useAiSettingsStore = create<AiSettingsState>()(
  persist(
    (set) => ({
      openAiModel: DEFAULT_OPENAI_MODEL,
      setOpenAiModel: (model: OpenAiModel) => set({ openAiModel: model }),
      clearCache: async () => {
        await AsyncStorage.removeItem('ai-settings-storage');
        set({ openAiModel: DEFAULT_OPENAI_MODEL });
      }
    }),
    {
      name: 'ai-settings-storage',
      version: 2,
      migrate: (state: any) => {
        if (!state) return { openAiModel: DEFAULT_OPENAI_MODEL };
        if (typeof state?.openAiModel === 'string') return state;
        return { openAiModel: (state?.openAiModel as OpenAiModel) ?? DEFAULT_OPENAI_MODEL };
      },
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        }
      }
    }
  )
);
