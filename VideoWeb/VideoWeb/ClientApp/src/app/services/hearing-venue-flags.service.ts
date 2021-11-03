import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class HearingVenueFlagsService {
    private _hearingVenueIsScottish = new BehaviorSubject(false);

    public hearingVenueIsScottish$ = this._hearingVenueIsScottish.asObservable();

    public setHearingVenueIsScottish(isScottish: boolean): void {
        this._hearingVenueIsScottish.next(isScottish);
    }
}
