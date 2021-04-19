import { Component, Injectable, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ProfileService } from 'src/app/services/api/profile.service';
import { SessionStorage } from 'src/app/services/session-storage';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { VhoStorageKeys } from '../../vh-officer/services/models/session-keys';
import { AuthService } from '../../services/security/auth.service';

@Component({
    selector: 'app-logout',
    templateUrl: './logout.component.html'
})
@Injectable()
export class LogoutComponent implements OnInit {
    private readonly judgeAllocationStorage: SessionStorage<string[]>;
    readonly loginPath = '../' + pageUrls.IdpSelection;
    constructor(private authService: AuthService, private profileService: ProfileService) {
        this.judgeAllocationStorage = new SessionStorage<string[]>(VhoStorageKeys.VENUE_ALLOCATIONS_KEY);
    }

    ngOnInit() {
        this.authService.isAuthenticated$.subscribe(authenticated => {
            if (authenticated) {
                this.profileService.clearUserProfile();
                this.judgeAllocationStorage.clear();
                this.authService.logout();
            }
        });
    }

    get loggedIn(): Observable<boolean> {
        return this.authService.isAuthenticated$;
    }
}
