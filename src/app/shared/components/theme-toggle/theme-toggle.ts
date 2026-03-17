import { Component, inject } from '@angular/core';
import { ThemeService } from '../../../core/services/theme/theme';

@Component({
  selector: 'app-theme-toggle',
  imports: [],
  templateUrl: './theme-toggle.html',
  styleUrl: './theme-toggle.scss',
})
export class ThemeToggle {
protected themeService = inject(ThemeService);
}
