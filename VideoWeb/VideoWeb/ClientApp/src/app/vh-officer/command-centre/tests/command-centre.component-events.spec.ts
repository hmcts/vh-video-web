import { Router } from '@angular/router';
import { Guid } from 'guid-typescript';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { ConfigService } from 'src/app/services/api/config.service';
import {
    ClientSettingsResponse,
    ConferenceResponseVho,
    ConferenceStatus,
    ParticipantResponseVho,
    ParticipantStatus,
    Role,
    Supplier,
    SupplierConfigurationResponse
} from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { PageService } from 'src/app/services/page.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { HeartbeatHealth, ParticipantHeartbeat } from 'src/app/services/models/participant-heartbeat';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { Hearing } from 'src/app/shared/models/hearing';
import { HearingSummary } from 'src/app/shared/models/hearing-summary';
import { ScreenHelper } from 'src/app/shared/screen-helper';
import { TestFixtureHelper } from 'src/app/testing/Helper/test-fixture-helper';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import {
    eventHubDisconnectSubjectMock,
    eventHubReconnectSubjectMock,
    eventsServiceSpy,
    getParticipantsUpdatedSubjectMock,
    hearingStatusSubjectMock,
    heartbeatSubjectMock,
    newAllocationMessageSubjectMock,
    participantStatusSubjectMock
} from 'src/app/testing/mocks/mock-events-service';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { VhoQueryService } from '../../services/vho-query-service.service';
import { CommandCentreComponent } from '../command-centre.component';
import { NotificationToastrService } from '../../../waiting-space/services/notification-toastr.service';
import { NewAllocationMessage } from '../../../services/models/new-allocation-message';
import { ParticipantsUpdatedMessage } from 'src/app/shared/models/participants-updated-message';
import { UpdatedAllocation } from 'src/app/shared/models/update-allocation-dto';
import { SecurityServiceProvider } from 'src/app/security/authentication/security-provider.service';
import { ISecurityService } from 'src/app/security/authentication/security-service.interface';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { IdpProviders } from 'src/app/security/idp-providers';

describe('CommandCentreComponent - Events', () => {
    let component: CommandCentreComponent;
    let configService: jasmine.SpyObj<ConfigService>;
    let vhoQueryService: jasmine.SpyObj<VhoQueryService>;
    let screenHelper: jasmine.SpyObj<ScreenHelper>;
    let errorService: jasmine.SpyObj<ErrorService>;
    const eventsService = eventsServiceSpy;
    let router: jasmine.SpyObj<Router>;
    let pageServiceSpy: jasmine.SpyObj<PageService>;
    let notificationToastrServiceSpy: jasmine.SpyObj<NotificationToastrService>;
    let securityServiceProviderServiceSpy: jasmine.SpyObj<SecurityServiceProvider>;
    let securityServiceSpy: jasmine.SpyObj<ISecurityService>;
    let userDataSubject: Subject<any>;
    let currentSecurityServiceSubject: BehaviorSubject<ISecurityService>;
    let currentIdpSubject: BehaviorSubject<IdpProviders>;

    const logger: Logger = new MockLogger();

    const conferences = new ConferenceTestData().getTestData();
    const hearings = conferences.map(c => new HearingSummary(c));
    const conference = new ConferenceTestData().getConferenceDetailNow();
    const hearing = new Hearing(conference);

    const conferenceDetail = new ConferenceTestData().getConferenceDetailFuture();
    let userData = {
        name: '',
        preferred_username: ''
    };

    beforeAll(() => {
        TestFixtureHelper.setupVenues();

        configService = jasmine.createSpyObj<ConfigService>('ConfigService', ['getClientSettings']);
        router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
        screenHelper = jasmine.createSpyObj<ScreenHelper>('ScreenHelper', ['enableFullScreen']);

        vhoQueryService = jasmine.createSpyObj<VhoQueryService>('VhoQueryService', [
            'startQuery',
            'runQuery',
            'stopQuery',
            'getQueryResults',
            'getConferencesForVHOfficer',
            'getConferenceByIdVHO'
        ]);

        errorService = jasmine.createSpyObj<ErrorService>('ErrorService', [
            'goToServiceError',
            'handleApiError',
            'returnHomeIfUnauthorised'
        ]);

        pageServiceSpy = jasmine.createSpyObj<PageService>('PageService', ['emitPageRefreshed']);
        Object.defineProperty(pageServiceSpy, 'pageRefreshed$', { value: of() });
        notificationToastrServiceSpy = jasmine.createSpyObj('NotificationToastrService', ['createAllocationNotificationToast']);

        const config = new ClientSettingsResponse({
            supplier_configurations: [new SupplierConfigurationResponse({ supplier: Supplier.Vodafone, join_by_phone_from_date: '' })]
        });
        configService.getClientSettings.and.returnValue(of(config));
    });

    afterEach(() => {
        component.ngOnDestroy();
        TestFixtureHelper.clearVenues();
    });

    beforeEach(() => {
        vhoQueryService.getConferencesForVHOfficer.and.returnValue(of(conferences));
        vhoQueryService.getConferenceByIdVHO.and.returnValue(Promise.resolve(conferenceDetail));
        securityServiceSpy = jasmine.createSpyObj<ISecurityService>('ISecurityService', ['isAuthenticated', 'getUserData']);
        userData = {
            name: 'CSO',
            preferred_username: 'cso@email.com'
        };
        userDataSubject = new BehaviorSubject<any>(userData);
        securityServiceSpy.getUserData.and.returnValue(userDataSubject.asObservable());
        currentSecurityServiceSubject = new BehaviorSubject<ISecurityService>(securityServiceSpy);
        currentIdpSubject = new BehaviorSubject<IdpProviders>(IdpProviders.vhaad);

        securityServiceProviderServiceSpy = jasmine.createSpyObj<SecurityServiceProvider>(
            'SecurityServiceProviderService',
            [],
            ['currentSecurityService$', 'currentIdp$']
        );
        getSpiedPropertyGetter(securityServiceProviderServiceSpy, 'currentSecurityService$').and.returnValue(
            currentSecurityServiceSubject.asObservable()
        );
        getSpiedPropertyGetter(securityServiceProviderServiceSpy, 'currentIdp$').and.returnValue(currentIdpSubject.asObservable());

        component = new CommandCentreComponent(
            vhoQueryService,
            errorService,
            eventsService,
            logger,
            router,
            screenHelper,
            pageServiceSpy,
            configService,
            notificationToastrServiceSpy,
            securityServiceProviderServiceSpy
        );
        component.hearings = hearings;
        component.selectedHearing = hearing;
        screenHelper.enableFullScreen.calls.reset();
        vhoQueryService.getConferenceByIdVHO.calls.reset();
    });

    it('should update hearing status when conference status message is received', () => {
        component.setupEventHubSubscribers();
        component.hearings[0].status = ConferenceStatus.InSession;
        const message = new ConferenceStatusMessage(conferences[0].id, ConferenceStatus.Paused);

        hearingStatusSubjectMock.next(message);

        expect(component.hearings[0].status).toBe(message.status);
    });

    it('should selected hearing status when conference status message is received for currently selected conference', () => {
        component.setupEventHubSubscribers();
        const clone: ConferenceResponseVho = Object.assign(conferenceDetail);
        component.selectedHearing = new Hearing(clone);
        component.selectedHearing.getConference().status = ConferenceStatus.InSession;
        const message = new ConferenceStatusMessage(component.selectedHearing.id, ConferenceStatus.Paused);

        hearingStatusSubjectMock.next(message);

        expect(component.selectedHearing.status).toBe(message.status);
    });

    it('should not update conference status message is received for a conference not in list', () => {
        const message = new ConferenceStatusMessage(Guid.create().toString(), ConferenceStatus.Paused);
        expect(component.handleConferenceStatusChange(message)).toBeFalsy();
    });

    it('should update participant status when conference participant message is received', () => {
        component.setupEventHubSubscribers();
        const conferenceId = hearing.id;
        const participant = hearing.getParticipants()[0];

        component.hearings[1].getConference().id = conferenceId;
        component.hearings[1].getParticipants()[1].base.id = participant.id;

        participant.status = ParticipantStatus.Joining;
        const message = new ParticipantStatusMessage(participant.id, '', conferenceId, ParticipantStatus.Available);

        participantStatusSubjectMock.next(message);

        expect(component.hearings[1].getParticipants()[1].status).toBe(message.status);
        expect(component.selectedHearing.participants[0].status).toBe(message.status);
    });

    it('should update participant list when participants updates message is received', () => {
        component.setupEventHubSubscribers();
        const conferenceId = hearing.id;
        const newList = hearing.getParticipants();
        newList.push(
            new ParticipantResponseVho({
                id: '123New',
                name: 'new participant',
                role: Role.JudicialOfficeHolder,
                status: undefined
            })
        );

        const message = new ParticipantsUpdatedMessage(conferenceId, newList);

        getParticipantsUpdatedSubjectMock.next(message);

        expect(component.selectedHearing.getParticipants()).toEqual(newList);
    });

    it('should gracefully handle participant updates', () => {
        const conferenceId = Guid.create().toString();
        const participantId = Guid.create().toString();
        const message = new ParticipantStatusMessage(participantId, '', conferenceId, ParticipantStatus.Available);

        participantStatusSubjectMock.next(message);

        expect(component).toBeTruthy();
    });

    it('should refresh data on eventhub disconnect', () => {
        spyOn(component, 'refreshConferenceDataDuringDisconnect');
        errorService.goToServiceError.calls.reset();

        component.setupEventHubSubscribers();
        eventHubDisconnectSubjectMock.next(1);
        eventHubDisconnectSubjectMock.next(2);
        eventHubDisconnectSubjectMock.next(3);
        eventHubDisconnectSubjectMock.next(4);
        eventHubDisconnectSubjectMock.next(5);
        eventHubDisconnectSubjectMock.next(6);

        expect(component.refreshConferenceDataDuringDisconnect).toHaveBeenCalledTimes(6);
        expect(errorService.goToServiceError).toHaveBeenCalledTimes(0);
    });

    it('should redirect to service error when disconnected more than 6 times', () => {
        spyOn(component, 'refreshConferenceDataDuringDisconnect');

        component.setupEventHubSubscribers();
        errorService.goToServiceError.calls.reset();
        eventHubDisconnectSubjectMock.next(7);
        expect(component.refreshConferenceDataDuringDisconnect).toHaveBeenCalledTimes(0);
        expect(errorService.goToServiceError).toHaveBeenCalled();
    });

    it('should refresh data on eventhub reconnect', () => {
        spyOn(component, 'refreshConferenceDataDuringDisconnect');
        component.setupEventHubSubscribers();
        eventHubReconnectSubjectMock.next();

        expect(component.refreshConferenceDataDuringDisconnect).toHaveBeenCalledTimes(1);
    });

    it('should not retrieve data on eventhub reconnect if no hearing is selected', async () => {
        component.selectedHearing = null;
        await component.refreshConferenceDataDuringDisconnect();

        expect(vhoQueryService.getConferenceByIdVHO).toHaveBeenCalledTimes(0);
    });

    it('should update participant heartbeat', async () => {
        const testHearing = component.hearings[0];
        const heartBeat = new ParticipantHeartbeat(
            testHearing.id,
            testHearing.getParticipants()[0].id,
            HeartbeatHealth.Good,
            'Chrome',
            '80.0.3987.132',
            'Mac OS X',
            '10.15.1'
        );
        component.setupEventHubSubscribers();
        heartbeatSubjectMock.next(heartBeat);
        expect(component.hearings[0].getParticipants()[0].participantHertBeatHealth).toBe(heartBeat);
    });

    it('should update participant list when participants updates message is received', () => {
        component.setupEventHubSubscribers();
        const conferenceId = hearing.id;
        const newList = hearing.getParticipants();
        newList.push(
            new ParticipantResponseVho({
                id: '123New',
                name: 'new participant',
                role: Role.JudicialOfficeHolder,
                status: undefined
            })
        );

        const message = new ParticipantsUpdatedMessage(conferenceId, newList);

        getParticipantsUpdatedSubjectMock.next(message);

        expect(component.selectedHearing.getParticipants()).toEqual(newList);
    });

    it('should gracefully handle participant heartbeat not in list', () => {
        const testHearing = component.hearings[0];
        const heartBeat = new ParticipantHeartbeat(
            testHearing.id,
            Guid.create().toString(),
            HeartbeatHealth.Good,
            'Chrome',
            '80.0.3987.132',
            'Mac OS X',
            '10.15.1'
        );
        heartbeatSubjectMock.next(heartBeat);

        expect(component).toBeTruthy();
    });

    describe('handleAllocationUpdate', () => {
        beforeEach(() => {
            notificationToastrServiceSpy.createAllocationNotificationToast.calls.reset();
            component.setupEventHubSubscribers();
        });

        it('should not create an allocation toast when allocation hearings message is received and is an empty list', () => {
            const message = new NewAllocationMessage([]);

            newAllocationMessageSubjectMock.next(message);

            expect(component).toBeTruthy();
            expect(notificationToastrServiceSpy.createAllocationNotificationToast).toHaveBeenCalledTimes(0);
        });

        it('should create an allocation toast when allocation hearings message is received and not an empty list', () => {
            const hearingDetails = createUpdatedAllocationMessage();
            const message = new NewAllocationMessage([hearingDetails]);

            newAllocationMessageSubjectMock.next(message);

            expect(component).toBeTruthy();
            expect(notificationToastrServiceSpy.createAllocationNotificationToast).toHaveBeenCalledTimes(1);
        });

        it('should not create an allocation toast when allocation hearings message is received and hearing is not allocated to the logged in user', () => {
            const hearingDetails = createUpdatedAllocationMessage();
            hearingDetails.allocated_to_cso_username = 'different-user@email.com';
            const message = new NewAllocationMessage([hearingDetails]);

            newAllocationMessageSubjectMock.next(message);

            expect(component).toBeTruthy();
            expect(notificationToastrServiceSpy.createAllocationNotificationToast).not.toHaveBeenCalled();
        });

        function createUpdatedAllocationMessage(): UpdatedAllocation {
            const message: UpdatedAllocation = {
                case_name: 'case name',
                judge_display_name: 'judge fudge',
                scheduled_date_time: new Date(),
                conference_id: Guid.create().toString(),
                allocated_to_cso_username: userData.preferred_username,
                allocated_to_cso_display_name: userData.name,
                allocated_to_cso_id: Guid.create().toString()
            };
            return message;
        }
    });
});
