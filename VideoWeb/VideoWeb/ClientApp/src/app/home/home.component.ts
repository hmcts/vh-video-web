import { Component, OnInit } from '@angular/core';
import { UserDataResult } from 'angular-auth-oidc-client';
import { switchMap } from 'rxjs/operators';
import { SecurityServiceProvider } from '../security/authentication/security-provider.service';
import { Observable, combineLatest } from 'rxjs';
import { ISecurityService } from '../security/authentication/security-service.interface';
import { IdpProviders } from '../security/idp-providers';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
    securityService: ISecurityService;
    currentIdp: IdpProviders;

    userData$: Observable<UserDataResult>;
    isAuthenticated = false;

    constructor(private securityServiceProviderService: SecurityServiceProvider) {
        combineLatest([
            this.securityServiceProviderService.currentSecurityService$,
            this.securityServiceProviderService.currentIdp$
        ]).subscribe(([service, idp]) => {
            this.securityService = service;
            this.currentIdp = idp;
        });
    }

    ngOnInit() {
        this.securityService.checkAuth(undefined, this.currentIdp).subscribe();
        this.userData$ = this.securityService.checkAuth(undefined, this.currentIdp).pipe(
            switchMap(({ isAuthenticated }) => {
                this.isAuthenticated = isAuthenticated;
                return this.securityService.getUserData(this.currentIdp);
            })
        );

        // this.eventService
        //     .registerForEvents()
        //     .pipe(
        //         filter(
        //             notification =>
        //                 notification.type === EventTypes.UserDataChanged || notification.type === EventTypes.NewAuthenticationResult
        //         )
        //     )
        //     .subscribe(value => {
        //         if (!value.value?.isRenewProcess) {
        //             this.logger.info('[HomeComponent] - First time logging', value);
        //             this.router.navigate([`/${pageUrls.Navigator}`]);
        //         }
        //     });
        // if (this.route.snapshot.queryParamMap.get('code') === null) {
        //     this.router.navigate([`/${pageUrls.Login}`]);
        // }
    }
}
