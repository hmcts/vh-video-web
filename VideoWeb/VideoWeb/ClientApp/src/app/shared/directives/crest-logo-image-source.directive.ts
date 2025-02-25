import { Directive, ElementRef, Input, OnChanges, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { ReplaySubject, combineLatest, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HearingVenueFlagsService } from 'src/app/services/hearing-venue-flags.service';

@Directive({
    standalone: false,
    selector: '[appCrestLogoImageSource]'
})
export class CrestLogoImageSourceDirective implements OnInit, OnChanges, OnDestroy {
    @Input() sctsImageSource: string;
    @Input() hmctsImageSource: string;

    @Input() sctsAltText: string;
    @Input() hmctsAltText: string;

    destroyed$ = new Subject();

    private inputChanged$ = new ReplaySubject<any>(1);

    constructor(
        private hearingVenueFlagsService: HearingVenueFlagsService,
        private element: ElementRef,
        private renderer2: Renderer2
    ) {}

    ngOnChanges(): void {
        this.inputChanged$.next();
    }

    ngOnInit() {
        combineLatest([this.hearingVenueFlagsService.hearingVenueIsScottish$, this.inputChanged$])
            .pipe(takeUntil(this.destroyed$))
            .subscribe(([hearingVenueIsInScotland]) => {
                if (hearingVenueIsInScotland) {
                    this.renderer2.setAttribute(this.element.nativeElement, 'src', this.sctsImageSource);
                    this.renderer2.setAttribute(this.element.nativeElement, 'alt', this.sctsAltText ?? '');
                } else {
                    this.renderer2.setAttribute(this.element.nativeElement, 'src', this.hmctsImageSource);
                    this.renderer2.setAttribute(this.element.nativeElement, 'alt', this.hmctsAltText ?? '');
                }
            });
    }

    ngOnDestroy(): void {
        this.destroyed$.next();
    }
}
