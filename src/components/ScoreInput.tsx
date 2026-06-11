"use client";

type ScoreInputProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export function ScoreInput({ label, value, onChange, disabled }: ScoreInputProps) {
  return (
    <label className="flex flex-col items-center gap-2">
      <span className="text-sm text-white/70">{label}</span>
      <input
        type="number"
        min={0}
        max={20}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Math.max(0, Math.min(20, Number(e.target.value) || 0)))}
        className="h-14 w-16 rounded-xl border border-white/20 bg-black/30 text-center text-2xl font-bold text-white outline-none focus:border-emerald-400 disabled:opacity-50"
      />
    </label>
  );
}
