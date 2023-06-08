import { TestBed } from '@angular/core/testing';

import { JwtHelperService } from './jwt-helper.service';
import { JwtHelperService as Auth0JwtHelperService } from '@auth0/angular-jwt';

describe('JwtHelperService', () => {
    let service: JwtHelperService;
    let auth0Spy: Auth0JwtHelperService;
    const testToken = 'testToken';

    beforeEach(() => {
        auth0Spy = jasmine.createSpyObj('Auth0JwtHelperService', ['decodeToken', 'isTokenExpired']);
        TestBed.configureTestingModule({
            providers: [{ provide: Auth0JwtHelperService, useValue: auth0Spy }, JwtHelperService]
        });
        service = TestBed.inject(JwtHelperService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should call helper to decode token', () => {
        service.decodeToken(testToken);
        expect(auth0Spy.decodeToken).toHaveBeenCalledOnceWith(testToken);
    });

    it('should call helper to check if token is expired', () => {
        service.isTokenExpired(testToken);
        expect(auth0Spy.isTokenExpired).toHaveBeenCalledOnceWith(testToken);
    });
});
