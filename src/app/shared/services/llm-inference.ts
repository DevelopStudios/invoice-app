import { Injectable, signal } from '@angular/core';
import { CreateWebWorkerMLCEngine, InitProgressReport } from '@mlc-ai/web-llm';

export interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Address {
  street: string;
  city: string;
  postCode: string;
  country: string;
}

export interface ParsedInvoice {
  id: string;
  createdAt: string;
  paymentDue: string;
  description: string;
  paymentTerms: number;
  clientName: string;
  clientEmail: string;
  status: string;
  senderAddress: Address;
  clientAddress: Address;
  items: InvoiceItem[];
  total: number;
}

@Injectable({
  providedIn: 'root',
})

export class LlmInferenceService {
  readonly engineProgess = signal<number>(0);
  readonly engineStatus = signal<string>('Idle');
  readonly isReady = signal<boolean>(false);

  private engine: any;
  private readonly modelId = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';

  /**
   * Spawns the worker and starts downloading/loading the model shards.
   */

  async initialize() {
    if (this.isReady()) return;
    this.engineStatus.set('Loading...');
    try {
      this.engine = await CreateWebWorkerMLCEngine(
        new Worker(new URL('../../llm.worker', import.meta.url), { type: 'module' }),
        this.modelId,
        {
          initProgressCallback: (report: InitProgressReport) => {
            this.engineProgess.set(Math.round(report.progress * 100));
            this.engineStatus.set(report.text);
          }
        }
      );
      this.isReady.set(true);
      this.engineStatus.set('Ready');
    } catch (error) {
      this.engineStatus.set('Failed to load model');
      console.error('LLM Init Error', error);
    }
  }

  async parseInvoicePrompt(userInput: string): Promise<Partial<ParsedInvoice>> {
    if (!this.isReady()) throw new Error('LLM not ready');
    const currentDate = new Date().toISOString().split('T')[0];
    const systemPrompt = `You extract invoice data from a user message.

  Rules:
  - Use ONLY values the user explicitly mentioned. Never invent values.
  - If a field is not mentioned, use "" for strings, 0 for numbers.
  - Calculate item total yourself: quantity × price.
  - paymentTerms must be 1, 7, or 30 only. Pick the closest one mentioned, default 30.
  - Output ONLY raw JSON. No markdown, no explanation.

  Example:
  User: "3 hours of consulting at $80/hr for Jane (jane@example.com), due in 7 days"
  Output:
  {
    "clientName": "Jane",
    "clientEmail": "jane@example.com",
    "paymentTerms": 7,
    "items": [
      { "name": "Consulting", "quantity": 3, "price": 80, "total": 240 }
    ]
  }`;

    try {
      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userInput
        }
      ];
      const reply = await this.engine.chat.completions.create({
        messages, temperature: 0.0,
      });
      const rawContent = reply.choices[0].message.content;
      return this.cleanAndParseJson(rawContent,userInput);
    } catch (error) {
      console.error('LLM Error', error);
      return {};
    }
  }
  
  private cleanAndParseJson(text: string, userInput: string): Partial<ParsedInvoice> {
    try {
      // Remove markdown code blocks and whitespace
      let jsonString = text.replace(/```json|```/g, '').trim();

      // Handle arithmetic expressions like (5 * 120) that smaller models often output
      jsonString = jsonString.replace(/\(\s*(\d+(?:\.\d+)?)\s*[\*]\s*(\d+(?:\.\d+)?)\s*\)/g, (match, n1, n2) => {
        const result = parseFloat(n1) * parseFloat(n2);
        return isNaN(result) ? match : result.toString();
      });

      let parsed: Partial<ParsedInvoice>;
      try {
        parsed = JSON.parse(jsonString);
      } catch (initialError) {
        jsonString = jsonString
          .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
          .replace(/,\s*([}\]])/g, '$1');
        parsed = JSON.parse(jsonString);
      }

      // Normalise dates to yyyy-MM-dd (model sometimes outputs 2021-1-3)
      const padDate = (d: string) =>
        d.replace(/^(\d{4})-(\d{1,2})-(\d{1,2})$/, (_, y, m, day) =>
          `${y}-${m.padStart(2, '0')}-${day.padStart(2, '0')}`
        );
      if (parsed.createdAt) parsed.createdAt = padDate(parsed.createdAt);
      if (parsed.paymentDue) parsed.paymentDue = padDate(parsed.paymentDue);

      if (parsed.items && parsed.items.length > 0) {
        const userNumbers = [...userInput.matchAll(/\d+(\.\d+)?/g)].map(m => parseFloat(m[0]));
        const allItemsGroundedInPrompt = parsed.items.every((item: any) =>
          userNumbers.some(n => n === item.price || n === item.quantity || n === item.total)
        );
        if (!allItemsGroundedInPrompt) {
          parsed.items = [];
        }
      }

      return parsed;
    } catch (e) {
      console.error("JSON Parse Error:", e);
      return {};
    }
  }

}
