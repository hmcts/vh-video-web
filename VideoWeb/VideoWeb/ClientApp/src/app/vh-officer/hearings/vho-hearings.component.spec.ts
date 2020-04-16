import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AdalService } from 'adal-angular4';
import { configureTestSuite } from 'ng-bullet';
import { of } from 'rxjs';
import { ConfigService } from 'src/app/services/api/config.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ConferenceForVhOfficerResponse,
    ConferenceResponse,
    ParticipantForUserResponse,
    ParticipantHeartbeatResponse,
    ParticipantStatus,
    Role
} from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { Hearing } from 'src/app/shared/models/hearing';
import { ParticipantSummary } from 'src/app/shared/models/participant-summary';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { MockConfigService } from 'src/app/testing/mocks/MockConfigService';
import { MockEventsService } from 'src/app/testing/mocks/MockEventService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { TasksTableStubComponent } from 'src/app/testing/stubs/task-table-stub';
import { VhoChatStubComponent } from 'src/app/testing/stubs/vho-chat-stub';
import { VhoHearingListStubComponent } from 'src/app/testing/stubs/vho-hearing-list-stub';
import { VhoParticipantStatusStubComponent } from 'src/app/testing/stubs/vho-participant-status-stub';
import { TaskCompleted } from '../../on-the-day/models/task-completed';
import { VhoHearingsFilterStubComponent } from '../../testing/stubs/vho-hearings-filter-stub';
import { VhoMonitoringGraphStubComponent } from '../../testing/stubs/vho-monitoring-graph-stub';
import { VhoParticipantNetworkStatusStubComponent } from '../../testing/stubs/vho-participant-network-status-stub';
import { VhoHearingsComponent } from './vho-hearings.component';
import { ParticipantHeartbeat, HeartbeatHealth } from '../../services/models/participant-heartbeat';
import { ParticipantStatusMessage } from '../../services/models/participant-status-message';
import { VenueSelectionStubComponent } from 'src/app/testing/stubs/VenueSelectionStubComponent';

describe('VhoHearingsComponent', () => {
    let component: VhoHearingsComponent;
    let fixture: ComponentFixture<VhoHearingsComponent>;
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let adalService: MockAdalService;
    const conferences = new ConferenceTestData().getVhoTestData();
    let errorService: ErrorService;

    const conferenceDetail = new ConferenceTestData().getConferenceDetailFuture();

    configureTestSuite(() => {
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', [
            'getConferencesForVHOfficer',
            'getConferenceById',
            'getTasksForConference',
            'getParticipantHeartbeats'
        ]);
        videoWebServiceSpy.getConferencesForVHOfficer.and.returnValue(of(conferences));
        videoWebServiceSpy.getConferenceById.and.returnValue(Promise.resolve(conferenceDetail));
        videoWebServiceSpy.getTasksForConference.and.returnValue(Promise.resolve(new ConferenceTestData().getTasksForConference()));
        TestBed.configureTestingModule({
            imports: [SharedModule, RouterTestingModule],
            declarations: [
                VhoHearingsComponent,
                TasksTableStubComponent,
                VhoHearingListStubComponent,
                VhoParticipantStatusStubComponent,
                VhoHearingsFilterStubComponent,
                VhoChatStubComponent,
                VhoParticipantNetworkStatusStubComponent,
                VhoMonitoringGraphStubComponent,
                VenueSelectionStubComponent
            ],
            providers: [
                { provide: VideoWebService, useValue: videoWebServiceSpy },
                { provide: AdalService, useClass: MockAdalService },
                { provide: EventsService, useClass: MockEventsService },
                { provide: ConfigService, useClass: MockConfigService },
                { provide: Logger, useClass: MockLogger }
            ]
        });
    });

    beforeEach(() => {
        adalService = TestBed.get(AdalService);
        errorService = TestBed.get(ErrorService);
        fixture = TestBed.createComponent(VhoHearingsComponent);
        component = fixture.componentInstance;
        component.getConferenceForSelectedAllocations();
        fixture.detectChanges();
    });

    it('should retrieve conference and sanitise iframe uri', () => {
        spyOn(component, 'updateWidthForAdminFrame');
        spyOn(component, 'getHeightForFrame').and.returnValue(600);

        component.onConferenceSelected(new ConferenceForVhOfficerResponse({ id: component.conferences[0].id }));
        expect(component.selectedConferenceUrl).toBeDefined();
    });

    it('should return true when current conference is selected', () => {
        const currentConference = conferences[0];
        component.selectedHearing = new Hearing(new ConferenceResponse({ id: currentConference.id }));
        expect(component.isCurrentConference(currentConference)).toBeTruthy();
    });

    it('should return false when current conference null', () => {
        const currentConference = conferences[0];
        expect(component.isCurrentConference(currentConference)).toBeFalsy();
    });

    it('should return false when current conference is different', () => {
        const currentConference = conferences[0];
        component.selectedHearing = new Hearing(new ConferenceResponse({ id: conferences[1].id }));
        expect(component.isCurrentConference(currentConference)).toBeFalsy();
    });

    it('should load tasks for conference when current conference is selected', async () => {
        const currentConference = conferences[0];
        component.selectedHearing = new Hearing(new ConferenceResponse({ id: currentConference.id }));
        await component.getTasksForConference(currentConference.id);
        expect(component.tasks.length > 0).toBeTruthy();
    });

    it('should update number of pending tasks on task completed', () => {
        const currentConference = component.conferences[0];
        const initPendingTasks = 5;
        currentConference.numberOfPendingTasks = initPendingTasks;

        component.onTaskCompleted(new TaskCompleted(currentConference.id, 3));
        expect(component.conferences[0].numberOfPendingTasks).toBeLessThan(initPendingTasks);
    });

    it('should get the selected judge statuses from another hearings', () => {
        const currentConference = conferenceDetail;
        currentConference.hearing_venue_name = 'venue name';
        component.selectedHearing = new Hearing(currentConference);
        component.participants = currentConference.participants;
        component.getJudgeStatusDetails();
        expect(component.participantStatusModel.JudgeStatuses.length).toBeGreaterThan(0);
        expect(component.participantStatusModel.HearingVenueName).toBe('venue name');
    });

    it('should not return selected judge statuses from another hearings', () => {
        component.clearSelectedConference();
        const currentConference = conferenceDetail;
        component.selectedHearing = new Hearing(currentConference);
        component.participants = currentConference.participants;
        component.participants.forEach((x) => {
            if (x.role === Role.Judge) {
                x.username = 'changeName@email.com';
            }
        });
        component.getJudgeStatusDetails();
        expect(component.participantStatusModel.JudgeStatuses.length).toBe(0);
    });

    it('should reset conference unread counter when vho sends a message', () => {
        const conference = component.conferences[0];
        component.conferences[0].numberOfUnreadMessages = 5;
        component.resetConferenceUnreadCounter(conference.id);
        expect(component.conferences[0].numberOfUnreadMessages).toBe(0);
    });

    it('should show monitoring graph for selected participant', async () => {
        const hearbeatResponse = new ParticipantHeartbeatResponse({
            browser_name: 'Chrome',
            browser_version: '80.0.3987.132',
            recent_packet_loss: 78,
            timestamp: new Date(new Date().toUTCString())
        });
        videoWebServiceSpy.getParticipantHeartbeats.and.returnValue(Promise.resolve([hearbeatResponse]));
        component.displayGraph = false;
        const param = {
            participant: new ParticipantSummary(
                new ParticipantForUserResponse({ id: '1111-2222-3333', display_name: 'Adam', status: ParticipantStatus.Disconnected })
            ),
            conferenceId: '1234-12345678'
        };
        await component.onParticipantSelected(param);
        expect(component.monitoringParticipant).toBeTruthy();
        expect(component.monitoringParticipant.name).toBe('Adam');
        expect(component.monitoringParticipant.status).toBe(ParticipantStatus.Disconnected);
        expect(videoWebServiceSpy.getParticipantHeartbeats).toHaveBeenCalled();
    });

    it('should add participant heartbeat to  the heartbeatList', async () => {
        const heartBeat = new ParticipantHeartbeat(
            '1111-1111-1111-1111',
            '1111-1111-1111-1111',
            HeartbeatHealth.Good,
            'Chrome',
            '80.0.3987.132'
        );
        component.addHeartBeatToTheList(heartBeat);
        expect(component.participantsHeartBeat.length > 0);
        expect(component.participantsHeartBeat).toContain(heartBeat);
    });

    it('should set participant heartbeat', async () => {
        const conference = component.conferences[0];
        const heartBeat = new ParticipantHeartbeat(
            conference.id,
            conference.getParticipants()[0].id,
            HeartbeatHealth.Good,
            'Chrome',
            '80.0.3987.132'
        );
        component.handleHeartbeat(heartBeat);
        expect(component.conferences[0].getParticipants()[0].participantHertBeatHealth).toBe(heartBeat);
    });

    it('should change participant status for particpant when status is disconnected', async () => {
        const heartBeat1 = new ParticipantHeartbeat(
            conferenceDetail.id,
            conferenceDetail.participants[0].id,
            HeartbeatHealth.Good,
            'Chrome',
            '80.0.3987.132'
        );
        const heartBeat2 = new ParticipantHeartbeat(
            conferenceDetail.id,
            conferenceDetail.participants[1].id,
            HeartbeatHealth.Good,
            'Chrome',
            '80.0.3987.132'
        );
        const message = new ParticipantStatusMessage(conferenceDetail.participants[0].id, ParticipantStatus.Disconnected);
        component.participantsHeartBeat = [];
        component.participantsHeartBeat.push(heartBeat1);
        component.participantsHeartBeat.push(heartBeat2);
        component.participants = conferenceDetail.participants;
        component.handleParticipantStatusChange(message);
        expect(component.participants).not.toBe(undefined);
        expect(component.participants[0].status).toBe(ParticipantStatus.Disconnected);
        expect(component.participantsHeartBeat).not.toContain(heartBeat1);
    });
    it('should change participant status for particpant', async () => {
        const heartBeat = new ParticipantHeartbeat(
            conferences[0].id,
            conferences[0].participants[0].id,
            HeartbeatHealth.Good,
            'Chrome',
            '80.0.3987.132'
        );
        component.participantsHeartBeat = [];
        component.participantsHeartBeat.push(heartBeat);
        component.retrieveHearingsForVhOfficer();
        expect(component.conferences).not.toBe(undefined);
        expect(component.conferences.length).toBeGreaterThan(0);
        expect(component.participantsHeartBeat).not.toBe(undefined);
        expect(component.participantsHeartBeat.length).toBeGreaterThan(0);
    });
    it('should not update hearbeat when no matching conference', async () => {
        const heartBeat1 = new ParticipantHeartbeat(
            '0000-0000-0000-0000',
            '0000-0000-0000-0000',
            HeartbeatHealth.Good,
            'Chrome',
            '80.0.3987.132'
        );
        component.handleHeartbeat(heartBeat1);
        const conferenceToUpdate = component.conferences.find((x) => x.id === heartBeat1.conferenceId);
        expect(conferenceToUpdate).toBe(undefined);
    });
    it('should not update hearbeat when no matching participant', async () => {
        const conference = component.conferences[0];
        const heartBeat1 = new ParticipantHeartbeat(conference.id, '0000-0000-0000-0000', HeartbeatHealth.Good, 'Chrome', '80.0.3987.132');
        component.handleHeartbeat(heartBeat1);
        const conferenceToUpdate = component.conferences.find((x) => x.id === heartBeat1.conferenceId);
        const participantToUpdate = conferenceToUpdate.getParticipants().find((p) => p.id === heartBeat1.participantId);
        expect(participantToUpdate).toBe(undefined);
    });
    it('should change participant status for particpant when status is not disconnected', async () => {
        const heartBeat1 = new ParticipantHeartbeat(
            conferenceDetail.id,
            conferenceDetail.participants[0].id,
            HeartbeatHealth.Good,
            'Chrome',
            '80.0.3987.132'
        );
        const heartBeat2 = new ParticipantHeartbeat(
            conferenceDetail.id,
            conferenceDetail.participants[1].id,
            HeartbeatHealth.Good,
            'Chrome',
            '80.0.3987.132'
        );
        const message = new ParticipantStatusMessage(conferenceDetail.participants[0].id, ParticipantStatus.Available);
        component.participantsHeartBeat = [];
        component.participantsHeartBeat.push(heartBeat1);
        component.participantsHeartBeat.push(heartBeat2);
        component.participants = conferenceDetail.participants;
        component.handleParticipantStatusChange(message);
        expect(component.participants).not.toBe(undefined);
        expect(component.participants[0].status).toBe(ParticipantStatus.Available);
        expect(component.participantsHeartBeat.length).toBe(2);
    });

    it('should add participant heartbeat to the list when heartbeat for participant does not exist previously', async () => {
        const heartBeat1 = new ParticipantHeartbeat(
            component.conferences[0].id,
            component.conferences[0].getParticipants()[0].id,
            HeartbeatHealth.Good,
            'Chrome',
            '80.0.3987.132'
        );
        const heartBeat2 = new ParticipantHeartbeat(
            component.conferences[0].id,
            component.conferences[0].getParticipants()[1].id,
            HeartbeatHealth.Good,
            'Chrome',
            '80.0.3987.132'
        );
        component.participantsHeartBeat = [];
        component.participantsHeartBeat.push(heartBeat1);
        component.participantsHeartBeat.push(heartBeat2);
        const participantsHeartbeatCurrentCount = component.participantsHeartBeat.length;
        const heartBeat3 = new ParticipantHeartbeat(
            component.conferences[0].id,
            component.conferences[0].getParticipants()[2].id,
            HeartbeatHealth.Good,
            'Chrome',
            '80.0.3987.132'
        );
        component.addHeartBeatToTheList(heartBeat3);
        expect(component.participantsHeartBeat.length).toBeGreaterThan(participantsHeartbeatCurrentCount);
        expect(component.participantsHeartBeat).toContain(heartBeat3);
    });
    it('should update participant heartbeat in the list when heartbeat for participant does exist previously', async () => {
        const heartBeat1 = new ParticipantHeartbeat(
            component.conferences[0].id,
            component.conferences[0].getParticipants()[0].id,
            HeartbeatHealth.Good,
            'Chrome',
            '80.0.3987.132'
        );
        const heartBeat2 = new ParticipantHeartbeat(
            component.conferences[0].id,
            component.conferences[0].getParticipants()[1].id,
            HeartbeatHealth.Good,
            'Chrome',
            '80.0.3987.132'
        );
        component.participantsHeartBeat = [];
        component.participantsHeartBeat.push(heartBeat1);
        component.participantsHeartBeat.push(heartBeat2);
        const participantsHeartbeatCurrentCount = component.participantsHeartBeat.length;
        const heartBeat3 = new ParticipantHeartbeat(
            component.conferences[0].id,
            component.conferences[0].getParticipants()[1].id,
            HeartbeatHealth.Bad,
            'Chrome',
            '80.0.3987.132'
        );
        component.addHeartBeatToTheList(heartBeat3);
        expect(component.participantsHeartBeat.length).toEqual(participantsHeartbeatCurrentCount);
        expect(component.participantsHeartBeat).toContain(heartBeat3);
    });
});
