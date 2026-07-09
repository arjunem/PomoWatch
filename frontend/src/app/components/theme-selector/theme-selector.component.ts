import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ThemeService, ThemeScheme, ThemeMode } from '../../services/theme.service';

@Component({
  selector: 'app-theme-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex items-center gap-2">
      <select
        [ngModel]="scheme$ | async"
        (ngModelChange)="onSchemeChange($event)"
        title="Color scheme"
        class="bg-page hover:bg-disabled-bg text-ink-soft px-3 py-2 rounded-lg font-medium text-sm border border-line focus:outline-none focus:ring-2 focus:ring-accent"
      >
        <option value="indigo-slate">Indigo Slate</option>
        <option value="deep-teal">Deep Teal</option>
        <option value="warm-clay">Warm Clay</option>
      </select>

      <button
        (click)="toggleMode()"
        [title]="(mode$ | async) === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
        class="bg-page hover:bg-disabled-bg text-ink-soft px-3 py-2 rounded-lg font-medium text-sm border border-line focus:outline-none focus:ring-2 focus:ring-accent"
      >
        {{ (mode$ | async) === 'dark' ? '🌙' : '☀️' }}
      </button>
    </div>
  `
})
export class ThemeSelectorComponent {
  scheme$: Observable<ThemeScheme>;
  mode$: Observable<ThemeMode>;

  constructor(private themeService: ThemeService) {
    this.scheme$ = this.themeService.scheme$;
    this.mode$ = this.themeService.mode$;
  }

  onSchemeChange(scheme: ThemeScheme): void {
    this.themeService.setScheme(scheme);
  }

  toggleMode(): void {
    this.themeService.toggleMode();
  }
}
