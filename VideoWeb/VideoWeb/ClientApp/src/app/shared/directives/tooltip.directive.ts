import { Directive, ElementRef, HostListener, Input, OnDestroy, Renderer2 } from '@angular/core';

@Directive({
    selector: '[appTooltip]'
})
export class TooltipDirective implements OnDestroy {
    _text: string;
    _colour = 'blue';
    _additionalText: string[];
    @Input() set text(value: string) {
        this._text = value;
        if (this.tooltip) {
            this.setTooltipText();
        }
    }
    @Input() set colour(value: string) {
        const oldColour = this._colour;
        this._colour = value;
        this.setTooltipColour(oldColour);
    }
    @Input() set additionalText(value: string[]) {
        this._additionalText = value;
        if (this.hearingRole) {
            this.setTooltipHearingRoleText();
        }
        if (this.caseRole) {
            this.setTooltipCaseRoleText();
        }
    }
    tooltip: HTMLElement;
    hearingRole: HTMLElement;
    caseRole: HTMLElement;

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
        this.tooltip.style.top = y + scrollPos + 'px';
        this.tooltip.style.left = x + 15 + 'px';
    }

    show() {
        if (this.tooltip) {
            this.renderer.addClass(this.tooltip, 'vh-tooltip-show');
        }
    }

    hide() {
        if (this.tooltip) {
            this.renderer.removeClass(this.tooltip, 'vh-tooltip-show');
        }
    }

    create() {
        this.tooltip = this.renderer.createElement('div');
        this.renderer.appendChild(this.tooltip, this.renderer.createText(this._text));

        if (this._additionalText) {
            this.createHearingRole();
            this.createCaseRole();
        }
        this.renderer.appendChild(document.body, this.tooltip);
        this.renderer.addClass(this.tooltip, 'vh-tooltip');
        this.setTooltipColour(null);
    }

    setTooltipText() {
        this.tooltip.innerText = this._text;
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

    createHearingRole() {
        if (this._additionalText.length > 0) {
            this.hearingRole = this.renderer.createElement('div');
            this.renderer.appendChild(this.hearingRole, this.renderer.createText(this._additionalText[0]));
            this.renderer.appendChild(this.tooltip, this.hearingRole);
        }
    }

    createCaseRole() {
        if (this._additionalText.length > 1) {
            this.caseRole = this.renderer.createElement('div');
            this.renderer.appendChild(this.caseRole, this.renderer.createText(this._additionalText[1]));
            this.renderer.appendChild(this.tooltip, this.caseRole);
        }
    }

    setTooltipHearingRoleText() {
        this.hearingRole.innerText = this._additionalText[0];
    }

    setTooltipCaseRoleText() {
        this.caseRole.innerText = this._additionalText[1];
    }
}
