import { Skeleton } from '@/components/ui/skeleton';

export default function CarregandoPanorama() {
  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col items-center gap-8 px-4 py-12">
      <div className="flex w-full flex-col items-center gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-48" />
        <p className="mt-2 text-xs text-muted-foreground">
          Pode levar até um minuto e meio na primeira vez — depois fica salvo.
        </p>
      </div>
      <div className="flex w-full flex-col gap-6">
        {Array.from({ length: 4 }).map((_, indice) => (
          <div key={indice} className="flex flex-col gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </main>
  );
}
