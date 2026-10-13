import { HttpResponse } from 'msw';
import type { EventoChat } from '@/lib/api/tipos';

function linhaSSE(evento: EventoChat): string {
  const { tipo, ...dados } = evento;
  return `event: ${tipo}\ndata: ${JSON.stringify(dados)}\n\n`;
}

/**
 * Monta a resposta de `POST /sessoes/:id/mensagens` no mesmo formato que o
 * parser de referência de `BACKEND_INTEGRATION.md` (seção 5) espera: blocos
 * `event: .../data: ...` separados por linha em branco.
 */
export function respostaStreamSSE(eventos: EventoChat[], intervaloMs = 30) {
  const codificador = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const evento of eventos) {
        await new Promise((resolve) => setTimeout(resolve, intervaloMs));
        controller.enqueue(codificador.encode(linhaSSE(evento)));
      }
      controller.close();
    },
  });

  return new HttpResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
