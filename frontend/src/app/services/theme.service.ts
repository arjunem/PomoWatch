import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeScheme = 'indigo-slate' | 'deep-teal' | 'warm-clay';
export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'pomowatch-theme';
const DEFAULT_SCHEME: ThemeScheme = 'indigo-slate';
const DEFAULT_MODE: ThemeMode = 'light';

interface StoredTheme {
  scheme: ThemeScheme;
  mode: ThemeMode;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private schemeSubject = new BehaviorSubject<ThemeScheme>(DEFAULT_SCHEME);
  private modeSubject = new BehaviorSubject<ThemeMode>(DEFAULT_MODE);

  public scheme$ = this.schemeSubject.asObservable();
  public mode$ = this.modeSubject.asObservable();

  constructor() {
    const stored = this.readStoredTheme();
    this.schemeSubject.next(stored.scheme);
    this.modeSubject.next(stored.mode);
    this.applyTheme(stored.scheme, stored.mode);
  }

  public get scheme(): ThemeScheme {
    return this.schemeSubject.value;
  }

  public get mode(): ThemeMode {
    return this.modeSubject.value;
  }

  public setScheme(scheme: ThemeScheme): void {
    this.schemeSubject.next(scheme);
    this.applyTheme(scheme, this.mode);
    this.persist(scheme, this.mode);
  }

  public setMode(mode: ThemeMode): void {
    this.modeSubject.next(mode);
    this.applyTheme(this.scheme, mode);
    this.persist(this.scheme, mode);
  }

  public toggleMode(): void {
    this.setMode(this.mode === 'light' ? 'dark' : 'light');
  }

  private applyTheme(scheme: ThemeScheme, mode: ThemeMode): void {
    const root = document.documentElement;
    root.setAttribute('data-theme', scheme);
    root.setAttribute('data-mode', mode);
  }

  private persist(scheme: ThemeScheme, mode: ThemeMode): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ scheme, mode }));
    } catch (error) {
      console.error('ThemeService: Failed to persist theme:', error);
    }
  }

  private readStoredTheme(): StoredTheme {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StoredTheme>;
        if (isValidScheme(parsed.scheme) && isValidMode(parsed.mode)) {
          return { scheme: parsed.scheme, mode: parsed.mode };
        }
      }
    } catch (error) {
      console.error('ThemeService: Failed to read stored theme:', error);
    }
    return { scheme: DEFAULT_SCHEME, mode: DEFAULT_MODE };
  }
}

function isValidScheme(value: unknown): value is ThemeScheme {
  return value === 'indigo-slate' || value === 'deep-teal' || value === 'warm-clay';
}

function isValidMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark';
}
