import { Directive, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';
import { ScrolledEvent, ScrolledFooter } from '../models/scrolled-event';
import { WindowScrolling } from './window-scrolling';

@Directive({
    selector: '[appScrollTrigger]'
})
export class ScrollTriggerDirective {
    @Output() scrolledPast = new EventEmitter<ScrolledEvent>();
    @Output() scrollFooter = new EventEmitter<ScrolledFooter>();

    lastScrollPosition = 0;
    margin = 30;

    constructor(
        private element: ElementRef,
        private scroll: WindowScrolling
    ) {}

    @HostListener('window:scroll', [])
    onWindowScroll() {
        const currentScrollPosition = this.getScreenBottom();
        const isFooter = this.checkOffset(currentScrollPosition);
        this.scrollFooter.emit(new ScrolledFooter(isFooter));
        const hasScrolledUp = currentScrollPosition < this.lastScrollPosition;
        if (hasScrolledUp) {
            if (this.hasScrolledPastElementUp(currentScrollPosition)) {
                this.scrolledPast.emit(new ScrolledEvent(true));
            }
        } else {
            if (this.hasScrolledPastElementBottom(currentScrollPosition)) {
                this.scrolledPast.emit(new ScrolledEvent(false));
            }
        }
        this.lastScrollPosition = currentScrollPosition;
    }

    checkOffset(currentScrollPosition): boolean {
        return document.body.offsetHeight - currentScrollPosition > window.innerHeight + this.margin;
    }

    private getScreenBottom(): number {
        return this.scroll.getPosition();
    }

    private getElementBottom(): number {
        return this.element.nativeElement.clientHeight + this.element.nativeElement.offsetTop;
    }

    private hasScrolledPastElementBottom(scrollPosition: number): boolean {
        return scrollPosition > this.getElementBottom();
    }

    private hasScrolledPastElementUp(scrollPosition: number): boolean {
        return scrollPosition < this.getElementBottom();
    }
}
