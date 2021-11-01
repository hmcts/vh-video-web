import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class HearingVenueFlagsService {
    public HearingVenueIsScottish = new BehaviorSubject(false);
}
