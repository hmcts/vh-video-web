import { Component, Injectable, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import { ProfileService } from 'src/app/services/api/profile.service';
import { FeatureFlagService } from 'src/app/services/feature-flag.service';
import { SessionStorage } from 'src/app/services/session-storage';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { VhoStorageKeys } from '../../vh-officer/services/models/session-keys';
import { SecurityServiceProvider } from '../authentication/security-provider.service';
import { ISecurityService } from '../authentication/security-service.interface';

@Component({
    selector: 'app-logout',
    templateUrl: './logout.component.html'
})
@Injectable()
export class LogoutComponent implements OnInit {
    private securityService: ISecurityService;
    private readonly judgeAllocationStorage: SessionStorage<string[]>;
    public loginPath: string;
    constructor(
        securityServiceProviderService: SecurityServiceProvider,
        private profileService: ProfileService,
        private featureFlagService: FeatureFlagService
    ) {
        securityServiceProviderService.currentSecurityService$.subscribe(securityService => (this.securityService = securityService));
        this.judgeAllocationStorage = new SessionStorage<string[]>(VhoStorageKeys.VENUE_ALLOCATIONS_KEY);
        this.featureFlagService
            .getFeatureFlagByName('EJudFeature')
            .pipe(first())
            .subscribe(flag => (this.loginPath = flag ? '../' + pageUrls.IdpSelection : '../' + pageUrls.Login));
    }

    ngOnInit() {
        this.securityService.isAuthenticated$.subscribe(authenticated => {
            if (authenticated) {
                this.profileService.clearUserProfile();
                this.judgeAllocationStorage.clear();
                this.securityService.logoffAndRevokeTokens();
            }
        });
    }

    get loggedIn(): Observable<boolean> {
        return this.securityService.isAuthenticated$;
    }
}
