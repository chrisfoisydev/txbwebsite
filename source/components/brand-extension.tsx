"use client";

export const brandThemes = [
  {
    id: 'becu',
    label: 'BECU',
    image: '/becu/new-member.png',
    alt: 'BECU accounts experience with the BECU logo, deep teal greeting, and red brand accents.',
  },
  {
    id: 'safe',
    label: 'SAFE Credit Union',
    image: '/becu/safe-theme.png',
    alt: 'SAFE Credit Union accounts experience with the SAFE logo, bright blue greeting and controls, and a light blue background.',
  },
] as const;

export function BrandThemePicker({ selected, onSelect }: { selected: number; onSelect: (index: number) => void }) {
  return <div className="brand-theme-picker">
    <span className="theme-picker-label">SEE THE SAME FOUNDATION IN TWO BRANDS</span>
    <div role="group" aria-label="Compare brand themes">
      {brandThemes.map((theme, index) => <button key={theme.id} data-brand={theme.id} aria-pressed={selected === index} onClick={() => onSelect(index)}>
        <span className="theme-swatch" aria-hidden="true"/>{theme.label}
      </button>)}
    </div>
    <p>A new identity. The same banking foundation.</p>
  </div>;
}

export default function BrandExtension({ selected, onExpand }: { selected: number; onExpand: () => void }) {
  const theme = brandThemes[selected];
  return <div className="brand-showcase" data-brand={theme.id}>
    <div className="brand-theme-halo" aria-hidden="true"/>
    <button className="reference-device extension-reference" onClick={onExpand} aria-label={`Expand ${theme.label} theme`}>
      <img src={theme.image} alt={theme.alt} width={1206} height={2625}/>
    </button>
    <div className="brand-showcase-label" aria-live="polite"><span className="theme-swatch" aria-hidden="true"/>{theme.label} theme</div>
  </div>;
}
