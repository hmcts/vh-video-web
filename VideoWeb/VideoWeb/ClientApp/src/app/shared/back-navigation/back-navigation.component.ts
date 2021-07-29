import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BackLinkDetails } from '../models/back-link-details';
import { Location } from '@angular/common';

@Component({
    selector: 'app-back-navigation',
    templateUrl: './back-navigation.component.html'
})
export class BackNavigationComponent implements OnInit {
    @Input() backLinkDetails: BackLinkDetails;

    constructor(private router: Router, private location: Location) {}

    ngOnInit() {
        console.log('Faz - backLinkDetails', this.backLinkDetails);
    }

    navigate() {
        const linkPath = this.backLinkDetails.path;
        if (!linkPath) {
            this.location.back();
        } else {
            this.router.navigate([linkPath]);
        }
    }
}
