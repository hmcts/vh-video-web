import { Location } from '@angular/common';
import { Component } from '@angular/core';

@Component({
    selector: 'app-back-navigation',
    templateUrl: './back-navigation.component.html'
})
export class BackNavigationComponent {
    constructor(private location: Location) {}
    navigateBack() {
        this.location.back();
    }
}
