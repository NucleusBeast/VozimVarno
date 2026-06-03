export type ColorPalette = {
  appBg: string;
  surface: string;
  text: string;
  textMuted: string;
  line: string;
  sectionBg: string;
  inputBorder: string;
  cardBorder: string;
  boldText: string;
  svgTrack: string;
};

export const lightColors: ColorPalette = {
  appBg: '#f4f7fb',
  surface: '#ffffff',
  text: '#07122f',
  textMuted: '#64718a',
  line: '#dce3ee',
  sectionBg: '#f6f8fb',
  inputBorder: '#cfd8e4',
  cardBorder: '#e7edf4',
  boldText: '#000000',
  svgTrack: '#e7ecf2',
};

export const darkColors: ColorPalette = {
  appBg: '#020d1c',
  surface: '#0f1f3a',
  text: '#e8edf4',
  textMuted: '#8094b4',
  line: '#1a2d47',
  sectionBg: '#071020',
  inputBorder: '#1a2d47',
  cardBorder: '#1a2d47',
  boldText: '#e8edf4',
  svgTrack: '#1a2d47',
};
