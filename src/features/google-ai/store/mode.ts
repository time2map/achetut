import { create } from "zustand";
import { TMode } from "../types/map";

type ModeState = {
  mode: TMode;
  setMode: (mode: TMode) => void;
};

export const useModeStore = create<ModeState>((set) => ({
  mode: 'google',
  setMode: (mode: TMode) => set({ mode }),
}));