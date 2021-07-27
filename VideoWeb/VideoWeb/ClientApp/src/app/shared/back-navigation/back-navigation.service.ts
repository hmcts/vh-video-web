import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class BackNavigationService {
    private _linkText = new BehaviorSubject<string>(null);
    private _linkPath = new BehaviorSubject<string>(null);

    linkText$ = this._linkText.asObservable();

    constructor(private location: Location, private router: Router) {}

    setLink(linkText, linkPath) {
        console.log('Faz - linkText', linkText);
        console.log('Faz - linkPath', linkPath);
        this._linkText.next(linkText);
        this._linkPath.next(linkPath);
    }

    clear() {
        console.log('Faz - BackNavigationService.clear()');
        this.setLink(null, null);
    }

    navigate() {
        console.log('Faz - BackNavigationService.navigate()');
        console.log('Faz - this._linkPath.value', this._linkPath.value);
        if (!this._linkPath.value) {
            console.log('Faz - back');
            this.location.back();
        } else {
            console.log('Faz - go');
            this.router.navigate([this._linkPath.value]);
        }
    }
}
