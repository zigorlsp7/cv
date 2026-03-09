type UiTheme = {
  mainBg: string;
  surface: string;
  card: string;
  title: string;
  text: string;
  muted: string;
  chipPrimary: string;
  chipSecondary: string;
  todoBadge: string;
  navHeader: string;
  navBrand: string;
  navPill: string;
  navLinkActive: string;
  navLinkIdle: string;
};

const CLASSIC_THEME: UiTheme = {
  mainBg: 'bg-gradient-to-b from-slate-100 via-slate-50 to-white',
  surface: 'border border-slate-200 bg-white/80 shadow-xl shadow-slate-200 backdrop-blur',
  card: 'border border-slate-200 bg-white shadow-sm',
  title: 'text-slate-900',
  text: 'text-slate-700',
  muted: 'text-slate-500',
  chipPrimary: 'bg-slate-900 text-white',
  chipSecondary: 'bg-slate-200 text-slate-700',
  todoBadge: 'bg-amber-100 text-amber-800',
  navHeader: 'border-b border-slate-200/80 bg-white/80 backdrop-blur-xl',
  navBrand: 'text-slate-800',
  navPill: 'border border-slate-200 bg-white shadow-sm',
  navLinkActive: 'bg-slate-900 text-white',
  navLinkIdle: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
};

export function getUiTheme(): UiTheme {
  return CLASSIC_THEME;
}
