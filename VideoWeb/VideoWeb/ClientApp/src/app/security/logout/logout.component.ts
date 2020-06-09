import { Component, Injectable, OnInit } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { ProfileService } from 'src/app/services/api/profile.service';

@Component({
    selector: 'app-logout',
    templateUrl: './logout.component.html'
})
@Injectable()
export class LogoutComponent implements OnInit {
    readonly loginPath = '../login';
    constructor(private adalSvc: AdalService, private profileService: ProfileService) {}

    ngOnInit() {
        if (this.adalSvc.userInfo.authenticated) {
            this.raiseNotSignedIn();
            this.profileService.clearUserProfile();
            this.adalSvc.logOut();
        }
    }

    get loggedIn(): boolean {
        return this.adalSvc.userInfo.authenticated;
    }

    raiseNotSignedIn() {
        throw new Error('not implemented exception');
    }
}
