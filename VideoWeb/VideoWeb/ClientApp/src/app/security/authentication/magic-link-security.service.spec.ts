import { fakeAsync, flush } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ApiClient } from 'src/app/services/clients/api-client';
import { MagicLinkJwtBody, MagicLinkSecurityService } from './magic-link-security.service';

describe('MagicLinkSecurityService', () => {
    let service: MagicLinkSecurityService;

    let apiClientSpy: jasmine.SpyObj<ApiClient>;

    beforeEach(() => {
        apiClientSpy = jasmine.createSpyObj<ApiClient>('ApiClient', ['isMagicLinkParticipantAuthorised', 'revokeMagicLinkUserToken']);

        service = new MagicLinkSecurityService(apiClientSpy);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('authorize', () => {
        it('should check the token is valid', () => {
            // Arrange
            const checkAuthSubject = new Subject<boolean>();
            spyOn(service, 'checkAuth').and.returnValue(checkAuthSubject.asObservable());

            // Act
            const jwt =
                'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6IkpvaG4gRG9lIiwiZ2l2ZW5fbmFtZSI6IkpvaG4gRG9lIiwiZmFtaWx5X25hbWUiOiJKb2huIERvZSIsInByZWZlcnJlZF91c2VybmFtZSI6IkpvaG4gRG9lIiwicm9sZSI6IkNpdGl6ZW4iLCJuYmYiOjE2MjcyOTQwMzcsImV4cCI6MTYyNzMyMjk1NywiaWF0IjoxNjI3Mjk0MDk3LCJpc3MiOiJodHRwczovL3ZoLXZpZGVvLXdlYi1kZXYuYXp1cmV3ZWJzaXRlcy5uZXQvOThhNWRiM2QtMGY5MS00MDNmLWI3ZGMtZDFhMjcyZjQ2ZjNiIn0.NyH-9u3Vg2wSC-B2rxkqjbAbKvdvoCyyFAgBsfeP9ff9mQTxn6PfJHdtkp8sANnQHpsLdqW8VnAp9a9bTfTVDA';
            service.authorize(null, jwt);

            // Assert
            expect(service.checkAuth).toHaveBeenCalledTimes(1);
        });

        it('should emit isAuthenticated true when checkAuth returns true', fakeAsync(() => {
            // Arrange
            const checkAuthSubject = new Subject<boolean>();
            spyOn(service, 'checkAuth').and.returnValue(checkAuthSubject.asObservable());

            // Act
            let isAuthenticated = false;
            service.isAuthenticated$.subscribe(authenticated => {
                isAuthenticated = authenticated;
            });

            const jwt =
                'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6IkpvaG4gRG9lIiwiZ2l2ZW5fbmFtZSI6IkpvaG4gRG9lIiwiZmFtaWx5X25hbWUiOiJKb2huIERvZSIsInByZWZlcnJlZF91c2VybmFtZSI6IkpvaG4gRG9lIiwicm9sZSI6IkNpdGl6ZW4iLCJuYmYiOjE2MjcyOTQwMzcsImV4cCI6MTYyNzMyMjk1NywiaWF0IjoxNjI3Mjk0MDk3LCJpc3MiOiJodHRwczovL3ZoLXZpZGVvLXdlYi1kZXYuYXp1cmV3ZWJzaXRlcy5uZXQvOThhNWRiM2QtMGY5MS00MDNmLWI3ZGMtZDFhMjcyZjQ2ZjNiIn0.NyH-9u3Vg2wSC-B2rxkqjbAbKvdvoCyyFAgBsfeP9ff9mQTxn6PfJHdtkp8sANnQHpsLdqW8VnAp9a9bTfTVDA';
            service.authorize(null, jwt);
            checkAuthSubject.next(true);
            flush();

            // Assert
            expect(service.checkAuth).toHaveBeenCalledTimes(1);
            expect(isAuthenticated).toBeTrue();
        }));

        it('should emit isAuthenticated false when checkAuth returns false', fakeAsync(() => {
            // Arrange
            const checkAuthSubject = new Subject<boolean>();
            spyOn(service, 'checkAuth').and.returnValue(checkAuthSubject.asObservable());

            // Act
            let isAuthenticated = true;
            service.isAuthenticated$.subscribe(authenticated => {
                isAuthenticated = authenticated;
            });

            const jwt =
                'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6IkpvaG4gRG9lIiwiZ2l2ZW5fbmFtZSI6IkpvaG4gRG9lIiwiZmFtaWx5X25hbWUiOiJKb2huIERvZSIsInByZWZlcnJlZF91c2VybmFtZSI6IkpvaG4gRG9lIiwicm9sZSI6IkNpdGl6ZW4iLCJuYmYiOjE2MjcyOTQwMzcsImV4cCI6MTYyNzMyMjk1NywiaWF0IjoxNjI3Mjk0MDk3LCJpc3MiOiJodHRwczovL3ZoLXZpZGVvLXdlYi1kZXYuYXp1cmV3ZWJzaXRlcy5uZXQvOThhNWRiM2QtMGY5MS00MDNmLWI3ZGMtZDFhMjcyZjQ2ZjNiIn0.NyH-9u3Vg2wSC-B2rxkqjbAbKvdvoCyyFAgBsfeP9ff9mQTxn6PfJHdtkp8sANnQHpsLdqW8VnAp9a9bTfTVDA';
            service.authorize(null, jwt);
            checkAuthSubject.next(false);
            flush();

            // Assert
            expect(service.checkAuth).toHaveBeenCalledTimes(1);
            expect(isAuthenticated).toBeFalse();
        }));

        it('should emit userData when checkAuth returns true', fakeAsync(() => {
            // Arrange
            const checkAuthSubject = new Subject<boolean>();
            const expectedPreferredUsername = 'John Doe';
            spyOn(service, 'checkAuth').and.returnValue(checkAuthSubject.asObservable());

            // Act
            let userData: MagicLinkJwtBody = null;
            service.userData$.subscribe(data => {
                userData = data;
            });

            const jwt =
                'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6IkpvaG4gRG9lIiwiZ2l2ZW5fbmFtZSI6IkpvaG4gRG9lIiwiZmFtaWx5X25hbWUiOiJKb2huIERvZSIsInByZWZlcnJlZF91c2VybmFtZSI6IkpvaG4gRG9lIiwicm9sZSI6IkNpdGl6ZW4iLCJuYmYiOjE2MjcyOTQwMzcsImV4cCI6MTYyNzMyMjk1NywiaWF0IjoxNjI3Mjk0MDk3LCJpc3MiOiJodHRwczovL3ZoLXZpZGVvLXdlYi1kZXYuYXp1cmV3ZWJzaXRlcy5uZXQvOThhNWRiM2QtMGY5MS00MDNmLWI3ZGMtZDFhMjcyZjQ2ZjNiIn0.NyH-9u3Vg2wSC-B2rxkqjbAbKvdvoCyyFAgBsfeP9ff9mQTxn6PfJHdtkp8sANnQHpsLdqW8VnAp9a9bTfTVDA';
            service.authorize(null, jwt);
            checkAuthSubject.next(true);
            flush();

            // Assert
            expect(service.checkAuth).toHaveBeenCalledTimes(1);
            expect(userData).not.toBeFalsy();
            console.log(userData);
            console.log(service.decodedToken);
            expect(userData.preferred_username).toEqual(expectedPreferredUsername);
        }));

        it('should NOT emit userData when checkAuth returns false', fakeAsync(() => {
            // Arrange
            const checkAuthSubject = new Subject<boolean>();
            spyOn(service, 'checkAuth').and.returnValue(checkAuthSubject.asObservable());

            // Act
            let userData: MagicLinkJwtBody = null;
            service.userData$.subscribe(data => {
                userData = data;
            });

            const jwt =
                'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6IkpvaG4gRG9lIiwiZ2l2ZW5fbmFtZSI6IkpvaG4gRG9lIiwiZmFtaWx5X25hbWUiOiJKb2huIERvZSIsInByZWZlcnJlZF91c2VybmFtZSI6IkpvaG4gRG9lIiwicm9sZSI6IkNpdGl6ZW4iLCJuYmYiOjE2MjcyOTQwMzcsImV4cCI6MTYyNzMyMjk1NywiaWF0IjoxNjI3Mjk0MDk3LCJpc3MiOiJodHRwczovL3ZoLXZpZGVvLXdlYi1kZXYuYXp1cmV3ZWJzaXRlcy5uZXQvOThhNWRiM2QtMGY5MS00MDNmLWI3ZGMtZDFhMjcyZjQ2ZjNiIn0.NyH-9u3Vg2wSC-B2rxkqjbAbKvdvoCyyFAgBsfeP9ff9mQTxn6PfJHdtkp8sANnQHpsLdqW8VnAp9a9bTfTVDA';
            service.authorize(null, jwt);
            checkAuthSubject.next(false);
            flush();

            // Assert
            expect(service.checkAuth).toHaveBeenCalledTimes(1);
            expect(userData).toBeNull();
        }));
    });

    describe('checkAuth', () => {
        it('should return true when NO error is thrown', fakeAsync(() => {
            // Arrange
            const isAuthorisedSubject = new Subject<void>();
            apiClientSpy.isMagicLinkParticipantAuthorised.and.returnValue(isAuthorisedSubject.asObservable());

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
            apiClientSpy.isMagicLinkParticipantAuthorised.and.returnValue(isAuthorisedSubject.asObservable());

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
        it('should call apiClient.revokeMagicLinkUserToken', fakeAsync(() => {
            // Arrange
            const revokeTokenSubject = new Subject<void>();
            apiClientSpy.revokeMagicLinkUserToken.and.returnValue(revokeTokenSubject.asObservable());

            // Act
            service.logoffAndRevokeTokens();

            // Assert
            expect(apiClientSpy.revokeMagicLinkUserToken).toHaveBeenCalledTimes(1);
        }));

        it('should emit the isAuthenticated false when the api client call resolves', fakeAsync(() => {
            // Arrange
            const revokeTokenSubject = new Subject<void>();
            apiClientSpy.revokeMagicLinkUserToken.and.returnValue(revokeTokenSubject.asObservable());

            // Act
            let isAuthenticated = true;
            service.isAuthenticated$.subscribe(authenticated => (isAuthenticated = authenticated));
            service.logoffAndRevokeTokens().subscribe();
            revokeTokenSubject.next();
            flush();

            // Assert
            expect(apiClientSpy.revokeMagicLinkUserToken).toHaveBeenCalledTimes(1);
            expect(isAuthenticated).toBeFalse();
        }));
    });
});
