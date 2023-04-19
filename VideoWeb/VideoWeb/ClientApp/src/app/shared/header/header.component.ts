import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { HearingVenueFlagsService } from 'src/app/services/hearing-venue-flags.service';
import { pageUrls } from '../page-url.constants';
import { topMenuItems } from './topMenuItems';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
    @Input() loggedIn: boolean;

    topMenuItems = [];
    logoutRoute = pageUrls.Logout;
    hearingVenueIsScottish$: Observable<boolean>;

    constructor(private router: Router, private hearingVenueFlagsService: HearingVenueFlagsService) {}

    selectMenuItem(indexOfItem: number) {
        for (const item of this.topMenuItems) {
            item.active = false;
        }
        this.topMenuItems[indexOfItem].active = true;
        this.router.navigate([this.topMenuItems[indexOfItem].url]);
    }

    ngOnInit() {
        this.topMenuItems = topMenuItems;
        this.hearingVenueIsScottish$ = this.hearingVenueFlagsService.hearingVenueIsScottish$;
    }
}
