import { Injectable, signal } from '@angular/core';
import { CreateWebWorkerMLCEngine, InitProgressReport } from '@mlc-ai/web-llm';

@Injectable({
  providedIn: 'root',
})

export class LlmInferenceService {
  readonly engineProgess = signal<number>(0);
  readonly engineStatus = signal<string>('Idle');
  readonly isReady = signal<boolean>(false);

  private engine: any;
  private readonly modelId = 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC';

  /**
   * Spawns the worker and starts downloading/loading the model shards.
   */

  async initialize() {
    if(this.isReady()) return;
    this.engineStatus.set('Loading...');
    try {
      this.engine = await CreateWebWorkerMLCEngine(
        new Worker(new URL('../../llm.worker', import.meta.url),{type:'module'}),
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
      console.error('LLM Init Error',error);
    }
  }
  
}
