import { fakeAsync, tick } from '@angular/core/testing';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceForVhOfficerResponse, ParticipantHeartbeatResponse, ParticipantStatus } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { HeartbeatHealth, ParticipantHeartbeat } from '../../services/models/participant-heartbeat';
import { ParticipantSummary } from '../../shared/models/participant-summary';
import { ParticipantNetworkStatusComponent } from './participant-network-status.component';
import { ElementRef } from '@angular/core';
import { VhoQueryService } from 'src/app/services/vho-query-service.service';

describe('ParticipantNetworkStatusComponent', () => {
    let component: ParticipantNetworkStatusComponent;
    let vhoQueryService: jasmine.SpyObj<VhoQueryService>;
    const logger: Logger = new MockLogger();
    let conference: ConferenceForVhOfficerResponse;
    let participant: ParticipantSummary;

    let mockGraphContainer: HTMLDivElement;

    let mouseEvent: MouseEvent;

    const hearbeatResponse = new ParticipantHeartbeatResponse({
        browser_name: 'Chrome',
        browser_version: '80.0.3987.132',
        recent_packet_loss: 78,
        timestamp: new Date(new Date().toUTCString())
    });

    beforeAll(() => {
        mouseEvent = document.createEvent('MouseEvent');
        mouseEvent.initMouseEvent('mousemove', true, true, window, 0, 0, 0, 80, 20, false, false, false, false, 0, null);

        conference = new ConferenceTestData().getConferenceNow();
        participant = new ParticipantSummary(conference.participants[0]);
        vhoQueryService = jasmine.createSpyObj<VhoQueryService>('VhoQueryService', ['getParticipantHeartbeats']);
    });

    beforeEach(() => {
        vhoQueryService.getParticipantHeartbeats.and.returnValue(Promise.resolve([hearbeatResponse]));
        component = new ParticipantNetworkStatusComponent(vhoQueryService, logger);
        component.conferenceId = conference.id;
        component.participant = participant;

        vhoQueryService.getParticipantHeartbeats.calls.reset();

        mockGraphContainer = document.createElement('div');
    });

    it('should not show grow on init', () => {
        component.ngOnInit();
        expect(component.displayGraph).toBeFalsy();
    });

    it('should not get hearbeat history if graph already displayed', async () => {
        component.displayGraph = true;
        component.loading = false;
        await component.showParticipantGraph(mouseEvent);
        expect(vhoQueryService.getParticipantHeartbeats).toHaveBeenCalledTimes(0);
    });

    it('should not get hearbeat history if graph already loading', async () => {
        component.displayGraph = false;
        component.loading = true;
        await component.showParticipantGraph(mouseEvent);
        expect(vhoQueryService.getParticipantHeartbeats).toHaveBeenCalledTimes(0);
    });

    it('should log error when unable to get heartbeat data', fakeAsync(() => {
        const error = { error: 'failed to find data', error_code: 404 };
        vhoQueryService.getParticipantHeartbeats.and.callFake(() => Promise.reject(error));
        const spy = spyOn(logger, 'error');
        component.packageLostArray = undefined;

        component.showParticipantGraph(mouseEvent);
        tick();
        expect(component.loading).toBeFalsy();
        expect(component.displayGraph).toBeFalsy();
        expect(spy.calls.mostRecent().args[0]).toMatch(`Failed to get heartbeat history for particpant`);
        expect(spy.calls.mostRecent().args[1]).toBe(error);
        expect(component.packageLostArray).toBeUndefined();
    }));

    it('should show monitoring graph for selected participant', async () => {
        component.displayGraph = false;
        await component.showParticipantGraph(mouseEvent);
        expect(component.monitoringParticipant).toBeDefined();
        expect(component.monitoringParticipant.name).toBe(participant.displayName);
        expect(component.monitoringParticipant.status).toBe(participant.status);
        expect(component.monitoringParticipant.representee).toBe(participant.representee);
        expect(vhoQueryService.getParticipantHeartbeats).toHaveBeenCalled();
    });

    it('should update graph container location on mouse move', () => {
        component.graphContainer = new ElementRef(mockGraphContainer);
        component.updateGraphPosition(mouseEvent);

        const expectedTop = mouseEvent.clientY + 30 + 'px';
        const expectedLeft = mouseEvent.clientX - 350 + 'px';
        expect(mockGraphContainer.style.top).toBe(expectedTop);
        expect(mockGraphContainer.style.left).toBe(expectedLeft);
    });

    const networkStatusTestCases = [
        { status: ParticipantStatus.Available, health: HeartbeatHealth.Good, browser: 'Chrome', expected: 'good-signal.png' },
        { status: ParticipantStatus.Available, health: HeartbeatHealth.Bad, browser: 'Chrome', expected: 'bad-signal.png' },
        { status: ParticipantStatus.Available, health: HeartbeatHealth.Poor, browser: 'Chrome', expected: 'poor-signal.png' },
        { status: ParticipantStatus.Disconnected, health: HeartbeatHealth.None, browser: 'Chrome', expected: 'disconnected.png' },
        {
            status: ParticipantStatus.Available,
            health: HeartbeatHealth.None,
            browser: 'Safari',
            expected: 'incompatible-browser-signal.png'
        },
        { status: ParticipantStatus.Available, health: HeartbeatHealth.None, browser: 'Edge', expected: 'incompatible-browser-signal.png' }
    ];

    networkStatusTestCases.forEach(test => {
        it(`should return ${test.expected} when participant is ${test.status} and heartbeat is ${test.health} with on ${test.browser}`, () => {
            const p = new ConferenceTestData().getConferenceFuture().participants.map(x => new ParticipantSummary(x))[0];
            p.status = test.status;
            p.participantHertBeatHealth = new ParticipantHeartbeat(
                '1111-1111-1111-1111',
                '1111-1111-1111-1111',
                test.health,
                test.browser,
                '80.0.3987.132'
            );
            component.participant = p;
            expect(component.getParticipantNetworkStatus()).toBe(test.expected);
        });
    });

    it('should return "not signed in" class', () => {
        const p = new ConferenceTestData().getConferenceFuture().participants.map(x => new ParticipantSummary(x))[0];
        p.participantHertBeatHealth = undefined;

        component.participant = p;

        expect(component.getParticipantNetworkStatus()).toBe('not-signed-in.png');

        p.status = ParticipantStatus.Disconnected;
        component.participant = p;
        expect(component.getParticipantNetworkStatus()).toBe('disconnected.png');
    });

    it('should return not-signed-in when no participant defined', () => {
        component.participant = undefined;
        expect(component.getParticipantNetworkStatus()).toBe('not-signed-in.png');
    });
});
