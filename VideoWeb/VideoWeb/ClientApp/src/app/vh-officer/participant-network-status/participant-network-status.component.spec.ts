import { fakeAsync, tick } from '@angular/core/testing';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceForVhOfficerResponse, ParticipantHeartbeatResponse, ParticipantStatus } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { HeartbeatHealth, ParticipantHeartbeat } from '../../services/models/participant-heartbeat';
import { ParticipantSummary } from '../../shared/models/participant-summary';
import { ParticipantNetworkStatusComponent } from './participant-network-status.component';

describe('ParticipantNetworkStatusComponent', () => {
    let component: ParticipantNetworkStatusComponent;
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    const logger: Logger = new MockLogger();
    let conference: ConferenceForVhOfficerResponse;
    let participant: ParticipantSummary;

    const hearbeatResponse = new ParticipantHeartbeatResponse({
        browser_name: 'Chrome',
        browser_version: '80.0.3987.132',
        recent_packet_loss: 78,
        timestamp: new Date(new Date().toUTCString())
    });

    beforeAll(() => {
        conference = new ConferenceTestData().getConferenceNow();
        participant = new ParticipantSummary(conference.participants[0]);
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getParticipantHeartbeats']);
    });

    beforeEach(() => {
        videoWebServiceSpy.getParticipantHeartbeats.and.returnValue(Promise.resolve([hearbeatResponse]));

        component = new ParticipantNetworkStatusComponent(videoWebServiceSpy, logger);
        component.conferenceId = conference.id;
        component.participant = participant;

        videoWebServiceSpy.getParticipantHeartbeats.calls.reset();
    });

    it('should not show grow on init', () => {
        component.ngOnInit();
        expect(component.displayGraph).toBeFalsy();
    });

    it('should not get hearbeat history if graph already displayed', async () => {
        component.displayGraph = true;
        component.loading = false;
        await component.showParticipantGraph();
        expect(videoWebServiceSpy.getParticipantHeartbeats).toHaveBeenCalledTimes(0);
    });

    it('should not get hearbeat history if graph already loading', async () => {
        component.displayGraph = false;
        component.loading = true;
        await component.showParticipantGraph();
        expect(videoWebServiceSpy.getParticipantHeartbeats).toHaveBeenCalledTimes(0);
    });

    it('should log error when unable to get heartbeat data', fakeAsync(() => {
        const error = { error: 'failed to find data', error_code: 404 };
        videoWebServiceSpy.getParticipantHeartbeats.and.callFake(() => Promise.reject(error));
        const spy = spyOn(logger, 'error');
        component.networkHistory = undefined;

        component.showParticipantGraph();
        tick();
        expect(component.loading).toBeFalsy();
        expect(component.displayGraph).toBeFalsy();
        expect(spy.calls.mostRecent().args[0]).toMatch(`Failed to get heartbeat history for particpant`);
        expect(spy.calls.mostRecent().args[1]).toBe(error);
        expect(component.networkHistory).toBeUndefined();
    }));

    it('should show monitoring graph for selected participant', async () => {
        component.displayGraph = false;
        await component.showParticipantGraph();
        expect(component.monitoringParticipant).toBeDefined();
        expect(component.monitoringParticipant.name).toBe(participant.displayName);
        expect(component.monitoringParticipant.status).toBe(participant.status);
        expect(component.monitoringParticipant.representee).toBe(participant.representee);
        expect(videoWebServiceSpy.getParticipantHeartbeats).toHaveBeenCalled();
    });

    it('should return "good signal" image', () => {
        const p = new ConferenceTestData().getConferenceFuture().participants.map(x => new ParticipantSummary(x))[0];
        p.status = ParticipantStatus.Available;
        p.participantHertBeatHealth = new ParticipantHeartbeat(
            '1111-1111-1111-1111',
            '1111-1111-1111-1111',
            HeartbeatHealth.Good,
            'Chrome',
            '80.0.3987.132'
        );
        component.participant = p;
        expect(component.getParticipantNetworkStatus()).toBe('good-signal.png');
    });

    it('should return "bad signal" image', () => {
        const p = new ConferenceTestData().getConferenceFuture().participants.map(x => new ParticipantSummary(x))[0];
        p.status = ParticipantStatus.Available;
        p.participantHertBeatHealth = new ParticipantHeartbeat(
            '1111-1111-1111-1111',
            '1111-1111-1111-1111',
            HeartbeatHealth.Bad,
            'Chrome',
            '80.0.3987.132'
        );
        component.participant = p;
        expect(component.getParticipantNetworkStatus()).toBe('bad-signal.png');
    });

    it('should return "poor signal" image', () => {
        const p = new ConferenceTestData().getConferenceFuture().participants.map(x => new ParticipantSummary(x))[0];
        p.status = ParticipantStatus.Available;
        p.participantHertBeatHealth = new ParticipantHeartbeat(
            '1111-1111-1111-1111',
            '1111-1111-1111-1111',
            HeartbeatHealth.Poor,
            'Chrome',
            '80.0.3987.132'
        );
        component.participant = p;
        expect(component.getParticipantNetworkStatus()).toBe('poor-signal.png');
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

    it('should return "disconnected" class', () => {
        const p = new ConferenceTestData().getConferenceFuture().participants.map(x => new ParticipantSummary(x))[0];
        p.participantHertBeatHealth = new ParticipantHeartbeat(
            '1111-1111-1111-1111',
            '1111-1111-1111-1111',
            HeartbeatHealth.None,
            'Chrome',
            '80.0.3987.132'
        );
        p.status = ParticipantStatus.Disconnected;
        component.participant = p;

        expect(component.getParticipantNetworkStatus()).toBe('disconnected.png');
    });

    it('should return "non compatible browser" image', () => {
        const p = new ConferenceTestData().getConferenceFuture().participants.map(x => new ParticipantSummary(x))[0];
        p.participantHertBeatHealth = new ParticipantHeartbeat(
            '1111-1111-1111-1111',
            '1111-1111-1111-1111',
            HeartbeatHealth.None,
            'Safari',
            '13.0'
        );
        component.participant = p;
        expect(component.getParticipantNetworkStatus()).toBe('incompatible-browser-signal.png');

        p.participantHertBeatHealth = new ParticipantHeartbeat(
            '1111-1111-1111-1111',
            '1111-1111-1111-1111',
            HeartbeatHealth.None,
            'Edge',
            '38.14393'
        );
        component.participant = p;
        expect(component.getParticipantNetworkStatus()).toBe('incompatible-browser-signal.png');
    });

    it('should return not-signed-in when no participant defined', () => {
        component.participant = undefined;
        expect(component.getParticipantNetworkStatus()).toBe('not-signed-in.png');
    });
});
