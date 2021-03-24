import { Component, Injectable, OnInit } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { ProfileService } from 'src/app/services/api/profile.service';
import { SessionStorage } from 'src/app/services/session-storage';
import { VhoStorageKeys } from '../../vh-officer/services/models/session-keys';

@Component({
    selector: 'app-logout',
    templateUrl: './logout.component.html'
})
@Injectable()
export class LogoutComponent implements OnInit {
    private readonly judgeAllocationStorage: SessionStorage<string[]>;
    readonly loginPath = '../login';
    constructor(private adalSvc: AdalService, private profileService: ProfileService) {
        this.judgeAllocationStorage = new SessionStorage<string[]>(VhoStorageKeys.VENUE_ALLOCATIONS_KEY);
    }

    ngOnInit() {
        if (this.adalSvc.userInfo.authenticated) {
            this.profileService.clearUserProfile();
            this.judgeAllocationStorage.clear();
            this.adalSvc.logOut();
        }
    }

    get loggedIn(): boolean {
        return this.adalSvc.userInfo.authenticated;
    }
}
