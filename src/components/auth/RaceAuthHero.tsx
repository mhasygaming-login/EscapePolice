import { Car, Crosshair, Gauge, MapPin, Navigation, Radio, ShieldAlert, Siren } from "lucide-react";
import { Ripple, TechOrbitDisplay, type IconConfig } from "../ui";

// Ikon bertema kejar-kejaran polisi menggantikan tech stack
const policeIcons: IconConfig[] = [
  { component: () => <Siren className="h-4 w-4 text-[var(--ep-accent)]" />, className: "border-none bg-transparent", duration: 20, delay: 20, radius: 100, path: false },
  { component: () => <Car className="h-4 w-4 text-[var(--ep-accent)]" />, className: "border-none bg-transparent", duration: 20, delay: 10, radius: 100, path: false },
  { component: () => <Gauge className="h-5 w-5 text-[var(--ep-text)]" />, className: "border-none bg-transparent", duration: 24, radius: 170, path: false },
  { component: () => <Navigation className="h-5 w-5 text-[var(--ep-text)]" />, className: "border-none bg-transparent", duration: 24, delay: 12, radius: 170, path: false },
  { component: () => <Radio className="h-4 w-4 text-[var(--ep-accent)]" />, className: "border-none bg-transparent", duration: 22, delay: 15, radius: 230, path: false, reverse: true },
  { component: () => <Crosshair className="h-4 w-4 text-[var(--ep-accent)]" />, className: "border-none bg-transparent", duration: 22, delay: 7, radius: 230, path: false, reverse: true },
  { component: () => <ShieldAlert className="h-6 w-6 text-[var(--ep-text)]" />, className: "border-none bg-transparent", duration: 28, radius: 290, path: false, reverse: true },
  { component: () => <MapPin className="h-6 w-6 text-[var(--ep-text)]" />, className: "border-none bg-transparent", duration: 28, delay: 14, radius: 290, path: false, reverse: true },
];

export function BrandMark() {
  return (
    <div className="relative z-10 flex flex-col items-center gap-3 text-center px-4">
      {/* Logo dengan efek sweep rotator polisi */}
      <div className="relative h-20 w-20 sm:h-24 sm:w-24 overflow-hidden rounded-2xl border border-[var(--ep-badge-text)] shadow-[0_0_30px_var(--ep-accent-glow)] bg-[#070913]">
        <img
          src="/cyber_pursuit_logo.jpg"
          alt="Escape The Police Logo"
          className="h-full w-full object-cover relative z-[1]"
          referrerPolicy="no-referrer"
        />
        {/* Sapuan lightbar cyan↔magenta */}
        <span className="beacon-sweep pointer-events-none absolute inset-0 z-[2] opacity-80" />
      </div>

      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ep-badge-text)] bg-[var(--ep-badge-bg)] px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider text-[var(--ep-badge-text)] shadow-sm">
        <span>🎮</span>
        <span>CYBER PURSUIT RACING</span>
      </span>

      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black tracking-wider uppercase">
        <span style={{ color: "var(--ep-title-escape)" }}>ESCAPE</span>{" "}
        <span className="text-[var(--ep-text)]">THE</span>{" "}
        <span style={{ color: "var(--ep-title-police)" }}>POLICE</span>
      </h1>

      <p className="max-w-xs text-xs sm:text-sm text-[var(--ep-text-muted)] leading-relaxed">
        Daftar atau masuk untuk menyimpan progres di Cloud dan bersaing di Leaderboard resmi.
      </p>
    </div>
  );
}

/** Panel dekoratif desktop: radar + orbit ikon di sekeliling BrandMark */
export function RaceAuthHero() {
  return (
    <div className="relative hidden lg:flex h-full min-h-[560px] w-1/2 flex-col items-center justify-center overflow-hidden">
      <Ripple mainCircleSize={170} mainCircleOpacity={0.28} numCircles={10} />
      <TechOrbitDisplay iconsArray={policeIcons} centerSlot={<BrandMark />} />
    </div>
  );
}

/** Versi ringkas untuk mobile: BrandMark saja, tanpa radar/orbit berat */
export function RaceAuthHeroCompact() {
  return (
    <div className="flex w-full flex-col items-center justify-center px-4 pb-4 pt-6 lg:hidden">
      <BrandMark />
    </div>
  );
}
