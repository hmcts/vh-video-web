import { ElementRef, Renderer2 } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { HearingVenueFlagsService } from 'src/app/services/hearing-venue-flags.service';
import { getSpiedPropertyGetter } from '../jasmine-helpers/property-helpers';
import { CrestLogoImageSourceDirective } from './crest-logo-image-source.directive';

describe('CrestLogoImageSourceDirective', () => {
    let mockedHearingVenueFlagsService: jasmine.SpyObj<HearingVenueFlagsService>;
    let elementRef: ElementRef<HTMLImageElement>;
    let renderer2: jasmine.SpyObj<Renderer2>;
    let directive: CrestLogoImageSourceDirective;

    const expectedAltText = 'expected-alt-text';
    const expectedSource = 'expected-source';

    const scottishHearingVenueSubject = new BehaviorSubject(false);

    beforeEach(() => {
        mockedHearingVenueFlagsService = jasmine.createSpyObj<HearingVenueFlagsService>(
            'HearingVenueFlagsService',
            ['setHearingVenueIsScottish'],
            ['hearingVenueIsScottish$']
        );
        getSpiedPropertyGetter(mockedHearingVenueFlagsService, 'hearingVenueIsScottish$').and.returnValue(
            scottishHearingVenueSubject.asObservable()
        );
        elementRef = new ElementRef<HTMLImageElement>(document.createElement('img'));
        renderer2 = jasmine.createSpyObj<Renderer2>('Renderer2', ['setAttribute']);

        directive = new CrestLogoImageSourceDirective(mockedHearingVenueFlagsService, elementRef, renderer2);
    });

    it('sets image source and alt text for scottish venue', () => {
        directive.sctsImageSource = expectedSource;
        directive.sctsAltText = expectedAltText;
        scottishHearingVenueSubject.next(true);
        directive.ngOnChanges();
        directive.ngOnInit();
        expect(renderer2.setAttribute).toHaveBeenCalledWith(elementRef.nativeElement, 'src', expectedSource);
        expect(renderer2.setAttribute).toHaveBeenCalledWith(elementRef.nativeElement, 'alt', expectedAltText);
    });

    it('sets image source and alt text for uk venue other than scotland', () => {
        directive.hmctsImageSource = expectedSource;
        directive.hmctsAltText = expectedAltText;
        scottishHearingVenueSubject.next(false);
        directive.ngOnChanges();
        directive.ngOnInit();
        expect(renderer2.setAttribute).toHaveBeenCalledWith(elementRef.nativeElement, 'src', expectedSource);
        expect(renderer2.setAttribute).toHaveBeenCalledWith(elementRef.nativeElement, 'alt', expectedAltText);
    });

    it('calls destroy subject on directive on destroy lifcycle', () => {
        const sub = jasmine.createSpyObj<Subject<any>>('Subject', ['next']);
        directive.destroyed$ = sub;
        directive.ngOnDestroy();
        expect(sub.next).toHaveBeenCalled();
    });
});
