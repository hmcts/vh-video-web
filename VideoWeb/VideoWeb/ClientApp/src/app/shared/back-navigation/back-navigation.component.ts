import { Component } from '@angular/core';
import { Location } from '@angular/common';

@Component({
    selector: 'app-back-navigation',
    templateUrl: './back-navigation.component.html'
})
export class BackNavigationComponent {
    redirectUrl: string;

    constructor(private location: Location) {}
    navigateBack() {
        this.location.back();
    }
}
