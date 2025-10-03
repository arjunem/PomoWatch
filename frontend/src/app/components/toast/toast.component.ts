import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject, takeUntil } from 'rxjs';
import { ToastService, ToastMessage } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-50 space-y-2">
      <div
        *ngFor="let toast of toasts$ | async"
        class="flex items-center p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ease-in-out"
        [ngClass]="{
          'bg-green-500 text-white': toast.type === 'success',
          'bg-red-500 text-white': toast.type === 'error',
          'bg-yellow-500 text-white': toast.type === 'warning',
          'bg-blue-500 text-white': toast.type === 'info'
        }"
      >
        <div class="flex-1">
          <p class="text-sm font-medium">{{ toast.message }}</p>
        </div>
        <button
          (click)="removeToast(toast.id)"
          class="ml-3 text-white hover:text-gray-200 focus:outline-none"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>
  `
})
export class ToastComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  toasts$: Observable<ToastMessage[]>;

  constructor(private toastService: ToastService) {
    this.toasts$ = this.toastService.toasts$;
  }

  ngOnInit(): void {
    // Component initialization
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  removeToast(id: string): void {
    this.toastService.remove(id);
  }
}
