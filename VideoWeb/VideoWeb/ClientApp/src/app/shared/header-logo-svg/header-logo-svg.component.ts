import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { HearingVenueFlagsService } from 'src/app/services/hearing-venue-flags.service';

@Component({
    selector: 'app-header-logo-svg',
    templateUrl: './header-logo-svg.component.html'
})
export class HeaderLogoSvgComponent implements OnInit, OnDestroy {
    hearingVenueIsInScotland = false;
    hearingVenueFlagsServiceSubscription: Subscription;
    constructor(private hearingVenueFlagsService: HearingVenueFlagsService) {}

    ngOnInit() {
        this.hearingVenueFlagsServiceSubscription = this.hearingVenueFlagsService.hearingVenueIsScottish$.subscribe(
            value => (this.hearingVenueIsInScotland = value)
        );
    }

    ngOnDestroy() {
        this.hearingVenueFlagsServiceSubscription.unsubscribe();
    }
}
