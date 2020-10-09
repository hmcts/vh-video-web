import { ElementRef, Renderer2 } from '@angular/core';
import { TooltipDirective } from './tooltip.directive';

describe('TooltipDirective', () => {
    let elementRef: ElementRef<HTMLDivElement>;
    let renderer2: jasmine.SpyObj<Renderer2>;
    let directive: TooltipDirective;
    let mockElement: HTMLElement;
    let nativeElement: HTMLDivElement;

    beforeEach(() => {
        mockElement = document.createElement('span');
        nativeElement = document.createElement('div');
        nativeElement.setAttribute('appTooltip', 'appTooltip');
        renderer2 = jasmine.createSpyObj<Renderer2>('Renderer2', ['addClass', 'removeClass', 'createElement', 'appendChild', 'createText']);
        renderer2.createElement.and.returnValue(mockElement);
        renderer2.addClass.and.callFake(() => mockElement.classList.add('vh-tooltip'));
        renderer2.removeClass.and.callFake(() => mockElement.classList.remove('vh-tooltip'));
        elementRef = new ElementRef<HTMLDivElement>(nativeElement);
        directive = new TooltipDirective(elementRef, renderer2);
    });

    it('should set tooltip text', () => {
        const text = 'test';
        directive.text = text;
        expect(directive._text).toBe(text);
    });

    it('should replace old colour with new colour', () => {
        const oldColour = 'blue';
        const newColour = 'red';
        directive.tooltip = document.createElement('span');
        directive._colour = oldColour;

        directive.colour = newColour;

        expect(renderer2.removeClass).toHaveBeenCalledWith(directive.tooltip, `vh-tooltip-${oldColour}`);
        expect(renderer2.addClass).toHaveBeenCalledWith(directive.tooltip, `vh-tooltip-${newColour}`);
    });

    it('should set element text if created', () => {
        const text = 'test';
        directive.tooltip = document.createElement('span');
        directive.text = text;
        expect(directive.tooltip.innerText).toBe(text);
    });

    it('should do nothing when tooltip is not ready', () => {
        directive.tooltip = undefined;
        directive.show();
        directive.hide();
        directive.colour = 'green';

        expect(renderer2.addClass).toHaveBeenCalledTimes(0);
        expect(renderer2.removeClass).toHaveBeenCalledTimes(0);
    });

    it('should hide on destroy', () => {
        directive.tooltip = document.createElement('span');
        directive.ngOnDestroy();
        expect(renderer2.removeClass).toHaveBeenCalledWith(directive.tooltip, 'vh-tooltip-show');
    });

    it('should remove class hide', () => {
        directive.tooltip = document.createElement('span');
        directive.hide();
        expect(renderer2.removeClass).toHaveBeenCalledWith(directive.tooltip, 'vh-tooltip-show');
    });

    it('should add class show', () => {
        directive.tooltip = document.createElement('span');
        directive.show();
        expect(renderer2.addClass).toHaveBeenCalledWith(directive.tooltip, 'vh-tooltip-show');
    });

    it('should create tooltip element', () => {
        directive.create();
        expect(directive.tooltip).toBeDefined();
        expect(directive.tooltip.classList).toContain('vh-tooltip');
    });

    it('should create and display element', () => {
        directive.createAndDisplay(new MouseEvent('mouseenter', {}));
        expect(directive.tooltip).toBeDefined();
        expect(directive.tooltip.classList).toContain('vh-tooltip');
    });

    it('should create tooltip if not created on mouse enter', () => {
        directive.tooltip = undefined;
        directive.onMouseEnter(new MouseEvent('mouseenter', {}));
        expect(directive.tooltip).toBeDefined();
    });

    it('should show and updated tooltip if already defined on mouse enter', () => {
        spyOn(directive, 'show');
        spyOn(directive, 'updatePosition');
        directive.tooltip = document.createElement('span');

        const event = new MouseEvent('mouseenter', { clientX: 15, clientY: 15 });
        directive.onMouseEnter(event);
        expect(directive.show).toHaveBeenCalled();
        expect(directive.updatePosition).toHaveBeenCalledWith(event);
    });

    it('should do nothing when tooltip is not created on mouse leave', () => {
        spyOn(directive, 'hide');
        directive.tooltip = undefined;
        const event = new MouseEvent('mouseleave', { clientX: 15, clientY: 15 });
        directive.onMouseLeave(event);
        expect(directive.hide).toHaveBeenCalledTimes(0);
    });

    it('should hide tooltip on mouse leave', () => {
        spyOn(directive, 'hide');
        directive.tooltip = document.createElement('span');
        const event = new MouseEvent('mouseleave', { clientX: 15, clientY: 15 });
        directive.onMouseLeave(event);
        expect(directive.hide).toHaveBeenCalledTimes(1);
    });

    it('should update tooltip on mouse move', () => {
        spyOn(directive, 'show');
        spyOn(directive, 'updatePosition');
        directive.tooltip = document.createElement('span');
        const event = new MouseEvent('mouseleave', { clientX: 15, clientY: 15 });
        Object.defineProperty(event, 'target', { value: nativeElement });

        directive.onMouseMove(event);
        expect(directive.show).toHaveBeenCalled();
        expect(directive.updatePosition).toHaveBeenCalledWith(event);
    });

    it('should do nothing when tooltip is not ready on mouse move', () => {
        spyOn(directive, 'show');
        spyOn(directive, 'updatePosition');
        directive.tooltip = undefined;
        const event = new MouseEvent('mouseleave', { clientX: 15, clientY: 15 });
        Object.defineProperty(event, 'target', { value: nativeElement });

        directive.onMouseMove(event);
        expect(directive.show).toHaveBeenCalledTimes(0);
        expect(directive.updatePosition).toHaveBeenCalledTimes(0);
    });

    it('should hide tooltip when mouse move event triggered by another tooltip', () => {
        spyOn(directive, 'hide');
        const otherElement = document.createElement('div');
        otherElement.setAttribute('appTooltip', 'appTooltip');
        const event = new MouseEvent('mouseleave', { clientX: 15, clientY: 15 });
        Object.defineProperty(event, 'target', { value: otherElement });
        directive.onMouseMove(event);
        expect(directive.hide).toHaveBeenCalledTimes(1);
    });
});
