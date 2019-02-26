import { TestBed } from '@angular/core/testing';
import { AuthGuard } from './auth.gaurd';
import { MockAdalService } from '../testing/mocks/MockAdalService';
import { Router } from '@angular/router';
import { AdalService } from 'adal-angular4';

describe('authguard', () => {
    let authGuard: AuthGuard;
    let adalSvc;
    const router = {
        navigate: jasmine.createSpy('navigate')
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
              AuthGuard,
              { provide: AdalService, useClass: MockAdalService },
              { provide: Router, useValue: router },
            ],
          }).compileComponents();
          adalSvc = TestBed.get(AdalService);
          authGuard = TestBed.get(AuthGuard);
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
            expect(authGuard.canActivate()).toBeFalsy();
        });
    });
});
