import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class FocusService {
    private lastFocusedElement: HTMLElement;

    storeFocus() {
        this.lastFocusedElement = document.activeElement as HTMLElement;
    }

    restoreFocus() {
        if (this.lastFocusedElement) {
            this.lastFocusedElement.focus();
        }
    }
}
