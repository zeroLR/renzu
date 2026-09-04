export const color = {
  canvas: 0x0d0f12,
  surface: 0x15181d,
  surfaceRaised: 0x1c2026,
  edge: 0x303640,
  ink: 0xf2ecdf,
  inkSoft: 0xb8b1a4,
  muted: 0x777d86,
  gold: 0xc8a96b,
  violet: 0x8f82c9,
  danger: 0xc26d63,
} as const;

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
} as const;

export const type = {
  display: 36,
  title: 24,
  heading: 18,
  body: 14,
  caption: 11,
} as const;

export const layout = {
  referenceWidth: 390,
  referenceHeight: 844,
  contentWidth: 342,
  horizontalInset: 24,
  minimumTouchTarget: 48,
} as const;
