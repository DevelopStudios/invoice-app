import { effect, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  darkMode = signal<boolean>(localStorage.getItem('theme') === 'dark');
  
  constructor() {
    effect(()=> {
      const isDark = this.darkMode();

      if(isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    });
  }

  toggleTheme() {
    this.darkMode.update(prev => !prev);
  }
}
