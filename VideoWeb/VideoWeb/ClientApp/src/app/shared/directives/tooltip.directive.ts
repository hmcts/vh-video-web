import { Directive, ElementRef, HostListener, Input, OnDestroy, Renderer2 } from '@angular/core';

@Directive({
    selector: '[appTooltip]'
})
export class TooltipDirective implements OnDestroy {
    _text: string;
    @Input() set text(value: string) {
        this._text = value;
        if (this.tooltip) {
            this.setTooltipText();
        }
    }
    @Input() colour = 'blue';
    tooltip: HTMLElement;

    constructor(private el: ElementRef, private renderer: Renderer2) {}
    ngOnDestroy(): void {
        this.hide();
    }

    @HostListener('mouseenter', ['$event']) onMouseEnter($event: MouseEvent) {
        if (this.tooltip) {
            this.show();
            this.updatePosition($event);
        } else {
            this.createAndDisplay($event);
        }
    }

    @HostListener('mousemove', ['$event']) onMouseMove($event: MouseEvent) {
        const element = this.el.nativeElement as HTMLElement;
        const target = $event.target as HTMLElement;
        const targetHasTooltip = target.hasAttribute('appTooltip');
        const matchingElement = element === $event.target;

        if (!matchingElement && targetHasTooltip) {
            this.hide();
            return;
        }

        if (this.tooltip) {
            this.show();
        }
        this.updatePosition($event);
    }

    @HostListener('mouseleave', ['$event']) onMouseLeave($event: MouseEvent) {
        if (this.tooltip) {
            this.hide();
        }
    }

    createAndDisplay($event: MouseEvent) {
        this.create();
        this.updatePosition($event);
        this.show();
    }

    updatePosition($event: MouseEvent) {
        const x = $event.clientX;
        const y = $event.clientY;
        const scrollPos = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        this.tooltip.style.top = y + scrollPos + 'px';
        this.tooltip.style.left = x + 15 + 'px';
    }

    show() {
        this.renderer.addClass(this.tooltip, 'vh-tooltip-show');
    }

    hide() {
        this.renderer.removeClass(this.tooltip, 'vh-tooltip-show');
    }

    create() {
        this.tooltip = this.renderer.createElement('span');
        this.renderer.appendChild(this.tooltip, this.renderer.createText(this._text));

        this.renderer.appendChild(document.body, this.tooltip);
        const tooltipColour = `vh-tooltip-${this.colour}`;
        this.renderer.addClass(this.tooltip, 'vh-tooltip');
        this.renderer.addClass(this.tooltip, tooltipColour);
    }

    setTooltipText() {
        this.tooltip.innerText = this._text;
    }
}
