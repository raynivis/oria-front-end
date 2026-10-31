export async function register() {
  if (process.env.API_MOCKING !== 'enabled') return;
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { server } = await import('../mocks/server');
  // 'bypass': silencioso para chamadas que não são da oria-api (telemetria do
  // próprio Next, por exemplo). Endpoint nosso sem handler falha visivelmente
  // na tela mesmo assim, por não haver backend real para o passthrough cair.
  server.listen({ onUnhandledRequest: 'bypass' });
}
