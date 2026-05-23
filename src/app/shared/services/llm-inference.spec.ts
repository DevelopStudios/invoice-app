import { TestBed } from '@angular/core/testing';
import { LlmInferenceService } from './llm-inference';

describe('LlmInferenceService – cleanAndParseJson', () => {
  let service: LlmInferenceService;
  const parse = (text: string, prompt: string) =>
    (service as any).cleanAndParseJson(text, prompt);

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LlmInferenceService);
  });

  it('strips markdown code fences before parsing', () => {
    const text = '```json\n{"clientName":"Test"}\n```';
    expect(parse(text, 'prompt').clientName).toBe('Test');
  });

  it('evaluates arithmetic expressions like (5 * 80)', () => {
    const text = '{"items":[{"name":"Work","quantity":5,"price":80,"total":(5 * 80)}]}';
    const result = parse(text, '5 hours 80');
    expect(result.items[0].total).toBe(400);
  });

  it('pads un-padded single-digit day in createdAt', () => {
    const text = JSON.stringify({ createdAt: '2021-10-7', paymentDue: '2021-10-14' });
    expect(parse(text, 'prompt').createdAt).toBe('2021-10-07');
  });

  it('pads un-padded single-digit month and day', () => {
    const text = JSON.stringify({ createdAt: '2021-1-3' });
    expect(parse(text, 'prompt').createdAt).toBe('2021-01-03');
  });

  it('leaves already-padded dates unchanged', () => {
    const text = JSON.stringify({ createdAt: '2021-10-07' });
    expect(parse(text, 'prompt').createdAt).toBe('2021-10-07');
  });

  it('discards items when no price/qty/total matches numbers in prompt', () => {
    const text = JSON.stringify({
      clientName: 'Test',
      items: [{ name: 'New Logo', quantity: 1, price: 1532, total: 1532 }],
    });
    const result = parse(text, '5 hours of design at 75 per hour');
    expect(result.items).toEqual([]);
  });

  it('keeps items when a price appears in the prompt', () => {
    const text = JSON.stringify({
      clientName: 'Test',
      items: [{ name: 'Design', quantity: 5, price: 75, total: 375 }],
    });
    const result = parse(text, '5 hours of design at 75 per hour');
    expect(result.items.length).toBe(1);
  });

  it('repairs unquoted JSON keys via fallback', () => {
    const text = '{clientName: "Test"}';
    expect(parse(text, 'prompt').clientName).toBe('Test');
  });

  it('returns {} for completely unparseable input', () => {
    expect(parse('not json at all <<<', 'prompt')).toEqual({});
  });
});
