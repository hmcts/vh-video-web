import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class HearingVenueFlagsService {
    public hearingVenueIsScottish$;

    private _hearingVenueIsScottish = new BehaviorSubject(false);

    constructor() {
        this.hearingVenueIsScottish$ = this._hearingVenueIsScottish.asObservable();
    }

    public setHearingVenueIsScottish(isScottish: boolean): void {
        this._hearingVenueIsScottish.next(isScottish);
    }
}
