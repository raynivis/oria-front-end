import { ThemeToggle } from '@/components/theme-toggle';

export default function LayoutAutenticacao({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="flex items-center justify-end border-b border-border px-4 py-2">
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center p-4">{children}</main>
    </>
  );
}
