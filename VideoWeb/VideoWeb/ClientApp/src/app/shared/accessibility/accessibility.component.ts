import { Component, OnInit } from '@angular/core';
import { ScrolledFooter, ScrolledEvent } from '../models/scrolled-event';

@Component({
    selector: 'app-accessibility',
    templateUrl: './accessibility.component.html',
    styleUrls: ['./accessibility.component.css']
})
export class AccessibilityComponent {
    isVisibleContents = true;
    isFooter = false;

    goToDiv(fragment: string): void {
        window.document.getElementById(fragment).scrollIntoView();
    }

    scrollHandler(e: ScrolledEvent) {
        this.isVisibleContents = e.makeVisible;
    }

    scrollFooter(e: ScrolledFooter) {
        this.isFooter = !e.isFooter;
    }
}
