import { Directive, ElementRef, EventEmitter, HostListener, Input, OnDestroy, Output, Renderer2 } from '@angular/core';
import { DeviceTypeService } from 'src/app/services/device-type.service';

@Directive({
    selector: '[appTooltip]'
})
export class TooltipDirective implements OnDestroy {
    _text: string;
    _colour = 'blue';
    _isDesktopOnly = true;
    @Input() set text(value: string) {
        this._text = value;
        if (this.tooltip) {
            this.setTooltipText();
        }
        if (this.tooltipKeyTab) {
            this.setTooltipTextKeyTab();
        }
    }
    @Input() set colour(value: string) {
        const oldColour = this._colour;
        this._colour = value;
        this.setTooltipColour(oldColour);
    }
    @Input() set isDesktopOnly(value: boolean) {
        this._isDesktopOnly = value;
    }
    @Output() tooltipShown = new EventEmitter();

    tooltip: HTMLElement;
    tooltipKeyTab: HTMLElement;

    constructor(private el: ElementRef, private renderer: Renderer2, private deviceTypeService: DeviceTypeService) {}
    ngOnDestroy(): void {
        this.hide();
        this.hideTooltipKeyEvent();
    }

    @HostListener('focus', ['$event']) onKeyDown($event: FocusEvent) {
        if (!this.tooltipKeyTab) {
            this.createTooltipKeyEvent($event);
        }
        this.showTooltipKeyEvent();
    }

    @HostListener('blur') onKeyUp() {
        if (this.tooltipKeyTab) {
            this.hideTooltipKeyEvent();
        }
    }

    @HostListener('mouseenter', ['$event']) onMouseEnter($event: MouseEvent) {
        if (this._isDesktopOnly && !this.deviceTypeService.isDesktop()) {
            return;
        }

        this.hideTooltipKeyEvent();

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

        this.hideTooltipKeyEvent();

        if (this.tooltip) {
            this.show();
            this.updatePosition($event);
        }
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
        if (y < window.innerHeight / 2) {
            this.tooltip.style.top = y + scrollPos + 'px';
        } else {
            this.tooltip.style.top = y + scrollPos - this.tooltip.clientHeight + 'px';
        }
        if (x < window.innerWidth / 2) {
            this.tooltip.style.left = x + 15 + 'px';
        } else {
            this.tooltip.style.left = x - 15 - this.tooltip.clientWidth + 'px';
        }
    }

    show() {
        if (this.tooltip) {
            if (!this.deviceTypeService.isDesktop()) {
                setTimeout(() => {
                    this.hide();
                }, 5000);
            }
            this.renderer.addClass(this.tooltip, 'vh-tooltip-show');
            this.tooltipShown.emit();
        }
    }

    showTooltipKeyEvent() {
        if (this.tooltipKeyTab) {
            this.renderer.addClass(this.tooltipKeyTab, 'vh-tooltip-show');
            this.tooltipShown.emit();
        }
    }

    hide() {
        if (this.tooltip) {
            this.renderer.removeClass(this.tooltip, 'vh-tooltip-show');
        }
    }

    hideTooltipKeyEvent() {
        if (this.tooltipKeyTab) {
            this.renderer.removeClass(this.tooltipKeyTab, 'vh-tooltip-show');
        }
    }

    create() {
        this.tooltip = this.renderer.createElement('div');
        this.tooltip.innerHTML = this._text;
        this.renderer.appendChild(document.body, this.tooltip);
        this.renderer.addClass(this.tooltip, 'vh-tooltip');
        this.setTooltipColour(null);
    }

    createTooltipKeyEvent(event: FocusEvent) {
        this.tooltipKeyTab = this.renderer.createElement('div');
        this.tooltipKeyTab.innerHTML = this._text;
        const parentId = (<HTMLElement>event.target).id;
        const parent = document.getElementById(parentId);
        this.renderer.appendChild(parent, this.tooltipKeyTab);
        this.renderer.addClass(this.tooltipKeyTab, 'vh-tooltip');
        this.setTooltipPosition();
        this.setTooltipColour(null);
    }

    setTooltipPosition() {
        this.resetParentPosition('relative');
        this.tooltipKeyTab.style.top = 35 + 'px';
        this.tooltipKeyTab.style.left = '0';
        this.tooltipKeyTab.style.opacity = '1';
    }

    resetParentPosition(val: string) {
        (<HTMLElement>this.tooltipKeyTab.parentNode).setAttribute('style', `position:${val}`);
    }

    setTooltipText() {
        this.tooltip.innerHTML = this._text;
    }

    setTooltipTextKeyTab() {
        this.tooltipKeyTab.innerHTML = this._text;
    }

    setTooltipColour(oldColour: string) {
        if (!this.tooltip) {
            return;
        }
        const oldColourColour = `vh-tooltip-${oldColour}`;
        const tooltipColour = `vh-tooltip-${this._colour}`;
        this.renderer.removeClass(this.tooltip, oldColourColour);
        this.renderer.addClass(this.tooltip, tooltipColour);
    }
}
