import { ElementRef, Renderer2 } from '@angular/core';
import { TooltipDirective } from './tooltip.directive';

describe('TooltipDirective', () => {
    let elementRef: ElementRef<HTMLDivElement>;
    let renderer2: jasmine.SpyObj<Renderer2>;
    let directive: TooltipDirective;

    beforeEach(() => {
        renderer2 = jasmine.createSpyObj<Renderer2>('Renderer2', ['addClass', 'removeClass', 'createElement', 'appendChild', 'createText']);
        elementRef = new ElementRef<HTMLDivElement>(new HTMLDivElement());
        directive = new TooltipDirective(elementRef, renderer2);
    });
});
