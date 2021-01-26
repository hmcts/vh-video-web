import { fakeAsync, tick } from '@angular/core/testing';
import { MockLoggerToConsole } from '../testing/mocks/MockLoggerToConsole';
import { Logger } from './logging/logger-base';
import { ConnectionStatusService } from '../services/connection-status.service';
import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';

describe('ConnectionStatusService', () => {
    let service: ConnectionStatusService;
    let httpClientSpy: jasmine.SpyObj<HttpClient>;
    const mockLoggerToConsole: Logger = new MockLoggerToConsole();
    let TIME_TO_WAIT: number;

    beforeEach(() => {
        httpClientSpy = jasmine.createSpyObj('HttpClient', ['head']);
        service = new ConnectionStatusService(mockLoggerToConsole, httpClientSpy);
        TIME_TO_WAIT = service.INTERVAL_IN_MS + 1;
    });

    // ---------------------
    // --> private functions
    // ---------------------

    /**
     * Sets the service's status as online/offline in preparation for the test
     */
    function setupServiceStatusAs(online: boolean) {
        setupHttpCallsToReturn(online);

        for (let i = 0; i < service.NUMBER_OF_GOOD_PINGS_REQUIRED; i++) {
            service.checkNow();
            tick(TIME_TO_WAIT);
        }
        expect(service.status).toBe(online);
        httpClientSpy.head.calls.reset();
    }

    /**
     * Sets the http client's to return 200 OK (online/good ping) or 404 (offline/bad ping)
     */
    function setupHttpCallsToReturn(online: boolean) {
        const goodResponse = new HttpResponse({
            status: 200,
            statusText: 'OK'
        });

        const errorResponse = new HttpErrorResponse({
            error: 'test error',
            status: 0, // status will be "0" when offline
            statusText: 'OK'
        });

        if (online) {
            httpClientSpy.head.and.returnValue(of(goodResponse));
        } else {
            httpClientSpy.head.and.returnValue(of(errorResponse));
        }
    }

    /**
     * Subscribes to the service's "online"/"offline" notifications
     */
    function setupListenToNotifications(): Array<boolean> {
        const notifications = new Array<boolean>();
        service.onConnectionStatusChange().subscribe(retval => {
            notifications.push(retval);
        });
        return notifications;
    }

    /**
     * Calls the "checkNow()" function "x" times and asserts a http call was made "x" times
     */
    function callService(numberOfTimes: number) {
        for (let i = 0; i < numberOfTimes; i++) {
            service.checkNow();
            tick(TIME_TO_WAIT);
        }
        tick(TIME_TO_WAIT * 3);

        expectNumberOfHttpCallsToBe(numberOfTimes);
    }

    /**
     * Asserts that "x" number of http calls were made
     */
    function expectNumberOfHttpCallsToBe(numberOfCalls: number) {
        expect(httpClientSpy.head.calls.count()).toBe(numberOfCalls, `${numberOfCalls} http requests should have been made`);
    }

    // ---------------------
    // <-- private functions
    // ---------------------

    it('should create service without error', () => {
        expect(service.status).toBe(true);
    });

    it('should send request to check internet connection', fakeAsync(() => {
        // Arrange
        setupHttpCallsToReturn(true);

        // Act
        service.checkNow();

        // Assert
        expectNumberOfHttpCallsToBe(1);
    }));

    it('should stop timer', fakeAsync(() => {
        // Arrange
        setupHttpCallsToReturn(true);

        // Act
        service.start();
        tick(TIME_TO_WAIT);
        service.stopTimer();
        tick(60000);

        // Assert
        expectNumberOfHttpCallsToBe(2);
    }));

    it('should stop timer if not started', fakeAsync(() => {
        expect(() => service.stopTimer()).not.toThrow();
    }));

    it('should setup interval and fire intial check and again every 5 seconds', fakeAsync(() => {
        // Arrange
        setupHttpCallsToReturn(true);

        service.start();
        for (let i = 1; i < 10; i++) {
            // Act
            tick(TIME_TO_WAIT);

            // Assert
            const numberOfTimes = i + 1;
            expect(httpClientSpy.head.calls.count()).toBe(numberOfTimes, `${numberOfTimes} http requests should have been made`);
        }

        service.stopTimer();
    }));

    it('should only setup 1 interval even if start called multiple times', fakeAsync(() => {
        // Arrange
        setupHttpCallsToReturn(true);

        for (let i = 1; i < 10; i++) {
            // Act
            service.start();
            tick(TIME_TO_WAIT);

            // Assert
            const numberOfTimes = i + 1;
            expectNumberOfHttpCallsToBe(numberOfTimes);
        }

        service.stopTimer();
    }));

    it('should publish OFFLINE status ONCE and remain OFFLINE when: (1) starting online and (2) given ONE bad ping', fakeAsync(() => {
        // Arrange
        const NUMBER_OF_BAD_PINGS = 1;
        setupHttpCallsToReturn(false);
        const notifications = setupListenToNotifications();

        // Act
        callService(NUMBER_OF_BAD_PINGS);

        // Assert
        expect(notifications.length).toBe(1, 'only one notification should have been fired');
        expect(service.status).toBe(false, 'service should still be offline');
    }));

    it('should publish OFFLINE status ONCE and remain OFFLINE when: (1) starting online and (2) given MANY bad pings', fakeAsync(() => {
        // Arrange
        setupHttpCallsToReturn(false);
        const notifications = setupListenToNotifications();

        // Act
        callService(service.NUMBER_OF_GOOD_PINGS_REQUIRED);

        // Assert
        expect(notifications.length).toBe(1, 'only one notification should have been fired');
        expect(service.status).toBe(false, 'service should still be offline');
    }));

    it('should NOT publish ANY status and remain OFFLINE when: (1) starting offline and (2) given ONE good ping', fakeAsync(() => {
        // Arrange
        const NUMBER_OF_GOOD_PINGS = 1;
        setupServiceStatusAs(false);
        setupHttpCallsToReturn(true);
        const notifications = setupListenToNotifications();

        // Act
        callService(NUMBER_OF_GOOD_PINGS);

        // Assert
        expect(notifications.length).toBe(0, 'no notifications should have been fired');
        expect(service.status).toBe(false, 'service should still be offline');
    }));

    it('should publish ONLINE status ONCE and go ONLINE when: (1) starting offline and (2) given many good pings', fakeAsync(() => {
        // Arrange
        setupServiceStatusAs(false);
        setupHttpCallsToReturn(true);
        const notifications = setupListenToNotifications();

        // Act
        callService(service.NUMBER_OF_GOOD_PINGS_REQUIRED);

        // Assert
        expect(notifications.length).toBe(1, 'one notification should have been fired');
        expect(notifications[0]).toBe(true, 'notification[0] should be "online"');
        expect(service.status).toBe(true, 'service should now be online');
    }));

    it('should not publish if state hasnt changed', fakeAsync(() => {
        // Arrange
        setupHttpCallsToReturn(false);

        // Act
        callService(10);

        // Assert
        expect(service.status).toBe(false);
    }));
});
