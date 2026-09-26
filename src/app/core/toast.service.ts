import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.snackBar.open(message, 'OK', { duration: 2800, panelClass: ['toast-ok'] });
  }

  error(message: string): void {
    this.snackBar.open(message, 'Fechar', { duration: 4200, panelClass: ['toast-err'] });
  }

  info(message: string): void {
    this.snackBar.open(message, 'OK', { duration: 3200 });
  }
}
