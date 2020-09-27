import { ElementRef, Renderer2 } from '@angular/core';
import { TooltipDirective } from './tooltip.directive';

describe('TooltipDirective', () => {
    let elementRef: ElementRef<HTMLDivElement>;
    let renderer2: jasmine.SpyObj<Renderer2>;
    let directive: TooltipDirective;
    let mockElement: HTMLElement;

    beforeEach(() => {
        mockElement = document.createElement('span');

        renderer2 = jasmine.createSpyObj<Renderer2>('Renderer2', ['addClass', 'removeClass', 'createElement', 'appendChild', 'createText']);
        renderer2.createElement.and.returnValue(mockElement);
        renderer2.addClass.and.callFake(() => mockElement.classList.add('vh-tooltip'));
        renderer2.removeClass.and.callFake(() => mockElement.classList.remove('vh-tooltip'));
        elementRef = new ElementRef<HTMLDivElement>(document.createElement('div'));
        directive = new TooltipDirective(elementRef, renderer2);
    });

    it('should set tooltip text', () => {
        const text = 'test';
        directive.text = text;
        expect(directive._text).toBe(text);
    });

    it('should set element text if created', () => {
        const text = 'test';
        directive.tooltip = document.createElement('span');
        directive.text = text;
        expect(directive.tooltip.innerText).toBe(text);
    });

    it('should hide on destroy', () => {
        directive.ngOnDestroy();
        expect(renderer2.removeClass).toHaveBeenCalledWith(directive.tooltip, 'vh-tooltip-show');
    });

    it('should remove class hide', () => {
        directive.hide();
        expect(renderer2.removeClass).toHaveBeenCalledWith(directive.tooltip, 'vh-tooltip-show');
    });

    it('should add class show', () => {
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
});
