import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SecurityServiceProvider } from '../authentication/security-provider.service';
import { Subject, of } from 'rxjs';
import { Router } from '@angular/router';
import { ISecurityService } from '../authentication/security-service.interface';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { AlreadyAuthenticatedEjudGuard } from './already-authenticated-ejud.guard';

describe('AlreadyAuthenticatedDom1Guard', () => {
    let guard: AlreadyAuthenticatedEjudGuard;
    let isAuthenticatedSubject: Subject<boolean>;
    let securityServiceSpy: jasmine.SpyObj<ISecurityService>;
    let securityServiceProviderSpy: jasmine.SpyObj<SecurityServiceProvider>;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(() => {
        isAuthenticatedSubject = new Subject<boolean>();
        securityServiceSpy = jasmine.createSpyObj<ISecurityService>('ISecurityService', ['isAuthenticated']);
        securityServiceSpy.isAuthenticated.and.returnValue(isAuthenticatedSubject.asObservable());

        securityServiceProviderSpy = jasmine.createSpyObj<SecurityServiceProvider>('SecurityServiceProvider', ['getSecurityService']);
        securityServiceProviderSpy.getSecurityService.and.returnValue(securityServiceSpy);

        routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

        TestBed.configureTestingModule({
            providers: [
                { provide: SecurityServiceProvider, useValue: securityServiceProviderSpy },
                { provide: Router, useValue: routerSpy }
            ]
        });
        guard = TestBed.inject(AlreadyAuthenticatedEjudGuard);
    });

    it('should return true if not authenticated', fakeAsync(() => {
        // arrange
        securityServiceSpy.isAuthenticated.and.returnValue(of(false));

        // act
        let result: boolean;
        guard.canActivate().subscribe(res => (result = res));
        tick();

        // assert
        expect(result).toBeTrue();
    }));

    it('should navigate to home page if already authenticated', fakeAsync(() => {
        // arrange
        securityServiceSpy.isAuthenticated.and.returnValue(of(true));

        // act
        guard.canActivate().subscribe();
        tick();

        // assert
        expect(routerSpy.navigate).toHaveBeenCalledWith([pageUrls.Home]);
    }));
});
