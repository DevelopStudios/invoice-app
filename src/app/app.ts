import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from "./shared/components/sidebar/sidebar";
import { ThemeToggle } from './shared/components/theme-toggle/theme-toggle';
import { LlmInferenceService } from './shared/services/llm-inference';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Sidebar],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  public llm = inject(LlmInferenceService);
  constructor(){
    this.llm.initialize();
  }
  protected readonly title = signal('invoice-app');
}
