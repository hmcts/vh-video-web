import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HideComponentsService {
    hideNonVideoComponents$ = new BehaviorSubject<boolean>(false);
}
