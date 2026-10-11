import { sound } from "../../services";

export type AuthMode = "login" | "register";

export interface RaceAuthModeSwitchProps {
  mode: AuthMode;
  onChange: (m: AuthMode) => void;
}

export function RaceAuthModeSwitch({ mode, onChange }: RaceAuthModeSwitchProps) {
  return (
    <div className="mb-6 flex rounded-xl border border-[var(--ep-card-border)] bg-[var(--ep-tab-inactive-bg)] p-1.5 shadow-inner">
      <button
        type="button"
        onClick={() => {
          sound.play('click');
          onChange("login");
        }}
        className="flex-1 rounded-lg py-2.5 px-3 text-xs sm:text-sm font-display font-black tracking-wider uppercase transition-all duration-300 cursor-pointer min-h-[44px]"
        style={{
          background: mode === "login" ? "var(--ep-cyan)" : "transparent",
          color: mode === "login" ? "#070814" : "var(--ep-text-muted)",
          boxShadow: mode === "login" ? "0 0 16px rgba(0, 184, 219, 0.45)" : "none",
        }}
      >
        MASUK KE GAME
      </button>
      <button
        type="button"
        onClick={() => {
          sound.play('click');
          onChange("register");
        }}
        className="flex-1 rounded-lg py-2.5 px-3 text-xs sm:text-sm font-display font-black tracking-wider uppercase transition-all duration-300 cursor-pointer min-h-[44px]"
        style={{
          background: mode === "register" ? "var(--ep-magenta)" : "transparent",
          color: mode === "register" ? "#ffffff" : "var(--ep-text-muted)",
          boxShadow: mode === "register" ? "0 0 16px rgba(225, 42, 251, 0.45)" : "none",
        }}
      >
        DAFTAR AKUN BARU
      </button>
    </div>
  );
}
