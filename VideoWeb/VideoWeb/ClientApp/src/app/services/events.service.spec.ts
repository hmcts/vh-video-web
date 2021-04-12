import * as signalR from '@microsoft/signalr';
import { Guid } from 'guid-typescript';
import { Subscription } from 'rxjs';
import { MockLogger } from '../testing/mocks/mock-logger';
import { EventsService } from './events.service';
import { Logger } from './logging/logger-base';
import { InstantMessage } from './models/instant-message';
import { fakeAsync, tick } from '@angular/core/testing';
import { EventsHubService } from './events-hub.service';

fdescribe('EventsService', () => {
    let serviceUnderTest : EventsService;
    let loggerMock : Logger;
    let eventsHubServiceSpy : jasmine.SpyObj<EventsHubService>;
    let subscription$ : Subscription;

    beforeEach(() => {
        loggerMock = new MockLogger();
        eventsHubServiceSpy = jasmine.createSpyObj("EventsHubService", ["start", "stop"])
        serviceUnderTest = new EventsService(loggerMock, eventsHubServiceSpy);
        subscription$ = new Subscription();

    });

    afterEach(() => {
        subscription$.unsubscribe();
    });
});
