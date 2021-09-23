import { ElementRef, Renderer2 } from '@angular/core';
import { SetIdDirective } from './set-property-id.directive';

describe('TooltipDirective', () => {
    let elementRef: ElementRef<HTMLDivElement>;
    let renderer2: jasmine.SpyObj<Renderer2>;
    let directive: SetIdDirective;
    let nativeElement: HTMLDivElement;

    beforeEach(() => {
        nativeElement = document.createElement('div');
        nativeElement.setAttribute('appSetPropertyId', 'appSetPropertyId');
        renderer2 = jasmine.createSpyObj<Renderer2>('Renderer2', ['setProperty']);
        elementRef = new ElementRef<HTMLDivElement>(nativeElement);
        directive = new SetIdDirective(elementRef, renderer2);
    });

    it('should set property id', () => {
        const propertyId = 'test';
        directive.name = propertyId;
        directive.ngOnInit();
        expect(elementRef.nativeElement.id).toBe(propertyId);
    });
});
