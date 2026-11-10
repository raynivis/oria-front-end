import { describe, expect, it } from 'vitest';
import { ehRetryable } from './erros';

describe('ehRetryable', () => {
  it('usa o campo retryable quando presente (item 3.11)', () => {
    expect(ehRetryable({ message: 'x', statusCode: 503, retryable: true })).toBe(true);
    expect(ehRetryable({ message: 'x', statusCode: 502, retryable: false })).toBe(false);
  });

  it('cai para o status quando retryable está ausente (API mais antiga)', () => {
    expect(ehRetryable({ message: 'x', statusCode: 503 })).toBe(true);
    expect(ehRetryable({ message: 'x', statusCode: 502 })).toBe(false);
    expect(ehRetryable({ message: 'x', statusCode: 400 })).toBe(false);
  });
});
