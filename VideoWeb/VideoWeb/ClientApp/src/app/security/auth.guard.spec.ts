import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AdalService } from 'adal-angular4';
import { configureTestSuite } from 'ng-bullet';
import { MockAdalService } from '../testing/mocks/MockAdalService';
import { AuthGuard } from './auth.guard';

describe('authguard', () => {
    let authGuard: AuthGuard;
    let adalSvc;
    let router: Router;

    configureTestSuite(() => {
        TestBed.configureTestingModule({
            imports: [RouterTestingModule],
            providers: [
                AuthGuard,
                { provide: AdalService, useClass: MockAdalService }
            ]
        });
    });

    beforeEach(() => {
        adalSvc = TestBed.get(AdalService);
        authGuard = TestBed.get(AuthGuard);
        router = TestBed.get(Router);
    });

    describe('when logged in with successful authentication', () => {
        it('canActivate should return true', () => {
            adalSvc.setAuthenticated(true);
            expect(authGuard.canActivate()).toBeTruthy();
        });
    });

    describe('when login failed with unsuccessful authentication', () => {
        it('canActivate should return false', () => {
            adalSvc.setAuthenticated(false);
            spyOn(router, 'navigate').and.callFake(() => { });
            expect(authGuard.canActivate()).toBeFalsy();
            expect(router.navigate).toHaveBeenCalledWith(['/login']);
        });
    });
});
