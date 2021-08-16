import { fakeAsync, flush } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ApiClient } from 'src/app/services/clients/api-client';
import { JwtHelperService } from '../jwt-helper.service';
import { QuickLinkJwtBody, QuickLinkSecurityService } from './quick-link-security.service';

describe('QuickLinkSecurityService', () => {
    let service: QuickLinkSecurityService;
    let apiClientSpy: jasmine.SpyObj<ApiClient>;
    let jwtHelperSpy: jasmine.SpyObj<JwtHelperService>;
    const jwt =
        'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6IkpvaG4gRG9lIiwiZ2l2ZW5fbmFtZSI6IkpvaG4gRG9lIiwiZmFtaWx5X25hbWUiOiJKb2huIERvZSIsInByZWZlcnJlZF91c2VybmFtZSI6IkpvaG4gRG9lIiwicm9sZSI6IkNpdGl6ZW4iLCJuYmYiOjE2MjcyOTQwMzcsImV4cCI6MTYyNzMyMjk1NywiaWF0IjoxNjI3Mjk0MDk3LCJpc3MiOiJodHRwczovL3ZoLXZpZGVvLXdlYi1kZXYuYXp1cmV3ZWJzaXRlcy5uZXQvOThhNWRiM2QtMGY5MS00MDNmLWI3ZGMtZDFhMjcyZjQ2ZjNiIn0.NyH-9u3Vg2wSC-B2rxkqjbAbKvdvoCyyFAgBsfeP9ff9mQTxn6PfJHdtkp8sANnQHpsLdqW8VnAp9a9bTfTVDA';
    const decodedJwt = {
        unique_name: 'John Doe',
        given_name: 'John Doe',
        family_name: 'John Doe',
        preferred_username: 'John Doe',
        role: 'Citizen',
        nbf: 1627294037,
        exp: 1627322957,
        iat: 1627294097,
        iss: 'https://vh-video-web-dev.azurewebsites.net/98a5db3d-0f91-403f-b7dc-d1a272f46f3b'
    };

    beforeEach(() => {
        apiClientSpy = jasmine.createSpyObj<ApiClient>('ApiClient', ['isQuickLinkParticipantAuthorised']);
        jwtHelperSpy = jasmine.createSpyObj<JwtHelperService>('JwtHelperService', ['decodeToken', 'isTokenExpired']);
        jwtHelperSpy.decodeToken.and.returnValue(decodedJwt);

        service = new QuickLinkSecurityService(apiClientSpy, jwtHelperSpy);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('isAuthenticated$', () => {
        it('should logoff and revoke the tokens if the token has expired', fakeAsync(() => {
            // Arrange
            jwtHelperSpy.isTokenExpired.and.returnValue(true);

            service['token'] = jwt;

            // Act
            let isAuthenticated = true;
            service['isAuthenticatedSubject'].next(true);
            const subscription = service.isAuthenticated$.subscribe(authenticated => (isAuthenticated = authenticated));
            flush();

            // Assert
            expect(jwtHelperSpy.isTokenExpired).toHaveBeenCalledWith(jwt);
            expect(isAuthenticated).toBeFalse();
        }));

        it('should NOT logoff and revoke the tokens if the token has NOT expired', fakeAsync(() => {
            // Arrange
            jwtHelperSpy.isTokenExpired.and.returnValue(false);

            service['token'] = jwt;

            // Act
            let isAuthenticated = false;
            service['isAuthenticatedSubject'].next(true);
            const subscription = service.isAuthenticated$.subscribe(authenticated => (isAuthenticated = authenticated));
            flush();

            // Assert
            expect(isAuthenticated).toBeTrue();
            expect(jwtHelperSpy.isTokenExpired).toHaveBeenCalledWith(jwt);
        }));
    });

    describe('authorize', () => {
        it('should check the token is valid', () => {
            // Arrange
            const isQuickLinkParticipantAuthorisedSubject = new Subject<void>();
            apiClientSpy.isQuickLinkParticipantAuthorised.and.returnValue(isQuickLinkParticipantAuthorisedSubject.asObservable());

            // Act
            service.authorize(null, jwt);

            // Assert
            expect(apiClientSpy.isQuickLinkParticipantAuthorised).toHaveBeenCalledTimes(1);
        });

        it('should emit isAuthenticated true when checkAuth returns true', fakeAsync(() => {
            // Arrange
            const isQuickLinkParticipantAuthorisedSubject = new Subject<void>();
            apiClientSpy.isQuickLinkParticipantAuthorised.and.returnValue(isQuickLinkParticipantAuthorisedSubject.asObservable());
            jwtHelperSpy.isTokenExpired.and.returnValue(false);

            // Act
            let isAuthenticated = false;
            service.isAuthenticated$.subscribe(authenticated => {
                isAuthenticated = authenticated;
            });

            service.authorize(null, jwt);
            isQuickLinkParticipantAuthorisedSubject.next();
            flush();

            // Assert
            expect(apiClientSpy.isQuickLinkParticipantAuthorised).toHaveBeenCalledTimes(1);
            expect(isAuthenticated).toBeTrue();
        }));

        it('should emit isAuthenticated false when checkAuth returns false', fakeAsync(() => {
            // Arrange
            const isQuickLinkParticipantAuthorisedSubject = new Subject<void>();
            apiClientSpy.isQuickLinkParticipantAuthorised.and.returnValue(isQuickLinkParticipantAuthorisedSubject.asObservable());
            jwtHelperSpy.isTokenExpired.and.returnValue(false);

            // Act
            let isAuthenticated = true;
            service.isAuthenticated$.subscribe(authenticated => {
                isAuthenticated = authenticated;
            });

            service.authorize(null, jwt);
            isQuickLinkParticipantAuthorisedSubject.error('error');
            flush();

            // Assert
            expect(apiClientSpy.isQuickLinkParticipantAuthorised).toHaveBeenCalledTimes(1);
            expect(isAuthenticated).toBeFalse();
        }));

        it('should emit userData when checkAuth returns true', fakeAsync(() => {
            // Arrange
            const expectedPreferredUsername = 'John Doe';
            const isQuickLinkParticipantAuthorisedSubject = new Subject<void>();
            apiClientSpy.isQuickLinkParticipantAuthorised.and.returnValue(isQuickLinkParticipantAuthorisedSubject.asObservable());

            // Act
            let userData: QuickLinkJwtBody = null;
            service.userData$.subscribe(data => {
                userData = data;
            });

            service.authorize(null, jwt);
            isQuickLinkParticipantAuthorisedSubject.next();
            flush();

            // Assert
            expect(apiClientSpy.isQuickLinkParticipantAuthorised).toHaveBeenCalledTimes(1);
            expect(userData).not.toBeFalsy();
            expect(userData.preferred_username).toEqual(expectedPreferredUsername);
        }));

        it('should NOT emit userData when checkAuth returns false', fakeAsync(() => {
            // Arrange
            const isQuickLinkParticipantAuthorisedSubject = new Subject<void>();
            apiClientSpy.isQuickLinkParticipantAuthorised.and.returnValue(isQuickLinkParticipantAuthorisedSubject.asObservable());

            // Act
            let userData: QuickLinkJwtBody = null;
            service.userData$.subscribe(data => {
                userData = data;
            });

            service.authorize(null, jwt);
            isQuickLinkParticipantAuthorisedSubject.error('error');
            flush();

            // Assert
            expect(apiClientSpy.isQuickLinkParticipantAuthorised).toHaveBeenCalledTimes(1);
            expect(userData).toBeNull();
        }));
    });

    describe('checkAuth', () => {
        it('should return true when NO error is thrown', fakeAsync(() => {
            // Arrange
            const isAuthorisedSubject = new Subject<void>();
            apiClientSpy.isQuickLinkParticipantAuthorised.and.returnValue(isAuthorisedSubject.asObservable());

            // Act
            let result = false;
            service.checkAuth().subscribe(isAuthorised => (result = isAuthorised));
            isAuthorisedSubject.next();
            flush();

            // Assert
            expect(result).toBeTrue();
        }));

        it('should return false when an error is thrown', fakeAsync(() => {
            // Arrange
            const isAuthorisedSubject = new Subject<void>();
            apiClientSpy.isQuickLinkParticipantAuthorised.and.returnValue(isAuthorisedSubject.asObservable());

            // Act
            let result = false;
            service.checkAuth().subscribe(isAuthorised => (result = isAuthorised));
            isAuthorisedSubject.error('');
            flush();

            // Assert
            expect(result).toBeFalse();
        }));
    });

    describe('logoffAndRevokeTokens', () => {
        it('should emit the isAuthenticated false when the api client call resolves', fakeAsync(() => {
            // Act
            let isAuthenticated = true;
            service.isAuthenticated$.subscribe(authenticated => (isAuthenticated = authenticated));
            service.logoffAndRevokeTokens().subscribe();
            flush();

            // Assert
            expect(isAuthenticated).toBeFalse();
        }));
    });
});
