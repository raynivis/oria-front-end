import { FileText, Library, LayoutDashboard, ListChecks } from 'lucide-react';

export const LINKS_NAV = [
  { href: '/', rotulo: 'Início', icon: LayoutDashboard, exato: true },
  { href: '/biblioteca', rotulo: 'Biblioteca', icon: Library, exato: false },
  { href: '/fichamentos', rotulo: 'Fichamentos', icon: FileText, exato: false },
  { href: '/questoes', rotulo: 'Questões', icon: ListChecks, exato: false },
] as const;
