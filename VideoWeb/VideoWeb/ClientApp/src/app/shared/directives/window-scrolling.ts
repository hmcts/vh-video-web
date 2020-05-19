import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class WindowScrolling {
    constructor(@Inject(DOCUMENT) private document: Document) {}

    getPosition(): number {
        return window.pageYOffset;
    }

    getWindowHeight(): number {
        return this.document.documentElement.clientHeight;
    }

    getScreenBottom(): number {
        return this.getPosition() + this.getWindowHeight();
    }
}
