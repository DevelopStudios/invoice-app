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
    const systemPrompt = `You are a professional invoice parser. 
      Output ONLY valid, raw JSON. No markdown. No explanations.
      Do NOT include arithmetic expressions like (5 * 120); calculate the final numbers yourself. 
      All numerical values (quantity, price, total) MUST be integers.
      Current Date is ${currentDate}. Use this to resolve relative dates like "today" or "next week".
      Strict JSON format with double-quoted keys:
      {
        "id": "AA1449",
        "createdAt": "2021-10-7",
        "paymentDue": "2021-10-14",
        "paymentTerms": 7,
        "clientName": "Mellisa Clarke",
        "clientEmail": "mellisa.clarke@example.com",
        "status": "paid",
        "senderAddress": {
            "street": "19 Union Terraceasdasd",
            "city": "London",
            "postCode": "E1 3EZ",
            "country": "United Kingdom"
        },
        "clientAddress": {
            "street": "46 Abbey Row",
            "city": "Cambridge",
            "postCode": "CB5 6EG",
            "country": "United Kingdom"
        },
        "items": [
            {
                "name": "New Logo",
                "quantity": 1,
                "price": 1532,
                "total": 1532
            },
            {
                "name": "Brand Guidelines",
                "quantity": 1,
                "price": 2500,
                "total": 2500
            }
        ],
        "total": 4032
      }
      
      Note: payments terms can only be either 1,7 or 30.
      
      `;

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
      return this.cleanAndParseJson(rawContent);
    } catch (error) {
      console.error('LLM Error', error);
      return {};
    }
  }
  
  private cleanAndParseJson(text: string): Partial<ParsedInvoice> {
    try {
      // Remove markdown code blocks and whitespace
      let jsonString = text.replace(/```json|```/g, '').trim();

      // Handle arithmetic expressions like (5 * 120) that smaller models often output
      jsonString = jsonString.replace(/\(\s*(\d+(?:\.\d+)?)\s*[\*]\s*(\d+(?:\.\d+)?)\s*\)/g, (match, n1, n2) => {
        const result = parseFloat(n1) * parseFloat(n2);
        return isNaN(result) ? match : result.toString();
      });

      try {
        return JSON.parse(jsonString);
      } catch (initialError) {
        jsonString = jsonString
          .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
          .replace(/,\s*([}\]])/g, '$1');
        return JSON.parse(jsonString);
      }
    } catch (e) {
      console.error("JSON Parse Error:", e);
      return {};
    }
  }

}
