// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { _resetarFilaParaTeste, descarregarFila, enfileirarEvento } from './fila';

function corpoEnviado(chamada: unknown[]): { eventos: Array<{ tipo: string }> } {
  const init = chamada[1] as RequestInit;
  return JSON.parse(init.body as string);
}

describe('fila de telemetria', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    _resetarFilaParaTeste();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 200 })),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('acumula eventos e descarrega em lote a cada 30 segundos', async () => {
    enfileirarEvento('abriu', 'sec-1');
    enfileirarEvento('rolou', 'sec-1');
    enfileirarEvento('fechou', 'sec-1');

    expect(fetch).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(30_000);

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('/api/eventos');
    expect(init.keepalive).toBe(true);
    const { eventos } = corpoEnviado([url, init]);
    expect(eventos.map((e) => e.tipo)).toEqual(['abriu', 'rolou', 'fechou']);
  });

  it('descarrega imediatamente quando a aba perde foco, sem esperar os 30s', () => {
    enfileirarEvento('abriu_panorama', 'sec-1');

    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('se o envio falhar, o lote volta para a fila e é reenviado depois com sucesso', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValueOnce(new Error('rede fora')).mockResolvedValueOnce(new Response(null, { status: 200 })),
    );

    enfileirarEvento('abriu', 'sec-1');

    await descarregarFila();
    expect(fetch).toHaveBeenCalledTimes(1);

    await descarregarFila();
    expect(fetch).toHaveBeenCalledTimes(2);
    const { eventos } = corpoEnviado((fetch as ReturnType<typeof vi.fn>).mock.calls[1]);
    expect(eventos).toHaveLength(1);
  });

  it('reenviar o mesmo lote não duplica no corpo da chamada (idempotência é responsabilidade da API)', async () => {
    enfileirarEvento('abriu', 'sec-1');
    await descarregarFila();
    await descarregarFila();

    expect(fetch).toHaveBeenCalledTimes(1); // a segunda chamada não tem nada novo para enviar
  });
});
