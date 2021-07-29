import { Component, Input, Output, EventEmitter } from '@angular/core';
import { BackLinkDetails } from '../models/back-link-details';
@Component({
    selector: 'app-back-navigation',
    templateUrl: './back-navigation.component.html'
})
export class BackNavigationComponent {
    @Input() linkText: string;
    @Output() navigateBack = new EventEmitter();

    constructor() {}
}
