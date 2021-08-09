import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { LoggedParticipantResponse, Role, TokenResponse } from 'src/app/services/clients/api-client';
import { ClockService } from 'src/app/services/clock.service';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { UserMediaStreamService } from 'src/app/services/user-media-stream.service';
import { UserMediaService } from 'src/app/services/user-media.service';
import { HeartbeatModelMapper } from 'src/app/shared/mappers/heartbeat-model-mapper';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MediaDeviceTestData } from 'src/app/testing/mocks/data/media-device-test-data';
import { consultationServiceSpyFactory } from 'src/app/testing/mocks/mock-consultation.service';
import { eventsServiceSpy } from 'src/app/testing/mocks/mock-events-service';
import { videoCallServiceSpy } from 'src/app/testing/mocks/mock-video-call.service';
import { HearingRole } from '../../models/hearing-role-model';
import { NotificationSoundsService } from '../../services/notification-sounds.service';
import { WRTestComponent } from './WRTestComponent';
import { NotificationToastrService } from 'src/app/waiting-space/services/notification-toastr.service';
import { RoomClosingToastrService } from 'src/app/waiting-space/services/room-closing-toast.service';
import { ToastrService } from 'ngx-toastr';
import { ConsultationInvitationService } from '../../services/consultation-invitation.service';
const conferenceTestData = new ConferenceTestData();

export let component: WRTestComponent;

export const globalConference = conferenceTestData.getConferenceDetailPast();
export const participantsLinked = conferenceTestData.getListOfLinkedParticipants();
export const participantsWitness = conferenceTestData.getListOfParticipantsWitness();
participantsWitness.forEach(x => {
    globalConference.participants.push(x);
});
export const participantsPanelMemebers = conferenceTestData.getListOfParticipantsWingers();
participantsPanelMemebers.forEach(x => {
    globalConference.participants.push(x);
});
export const globalParticipant = globalConference.participants.filter(x => x.role === Role.Individual)[0];
export const globalWitness = globalConference.participants.filter(x => x.hearing_role === HearingRole.WITNESS)[0];
export const globalEndpoint = globalConference.endpoints[0];
export const activatedRoute: ActivatedRoute = <any>{ snapshot: { paramMap: convertToParamMap({ conferenceId: globalConference.id }) } };
export let videoWebService: jasmine.SpyObj<VideoWebService>;
export const eventsService = eventsServiceSpy;
export let errorService: jasmine.SpyObj<ErrorService>;
export let clockService: jasmine.SpyObj<ClockService>;
export let consultationInvitiationService: jasmine.SpyObj<ConsultationInvitationService>;
export let router: jasmine.SpyObj<Router>;
export let heartbeatModelMapper: HeartbeatModelMapper;
export let deviceTypeService: jasmine.SpyObj<DeviceTypeService>;
export const videoCallService = videoCallServiceSpy;
export let consultationService: jasmine.SpyObj<ConsultationService>;
export let notificationSoundsService: jasmine.SpyObj<NotificationSoundsService>;
export let notificationToastrService: jasmine.SpyObj<NotificationToastrService>;
export let roomClosingToastrService: jasmine.SpyObj<RoomClosingToastrService>;
export let toastrService: jasmine.SpyObj<ToastrService>;
export let logger: jasmine.SpyObj<Logger>;
export let userMediaService: jasmine.SpyObj<UserMediaService>;
export let userMediaStreamService: jasmine.SpyObj<UserMediaStreamService>;
export const mockCamStream = jasmine.createSpyObj<MediaStream>('MediaStream', ['getVideoTracks']);
export const mockMicStream = jasmine.createSpyObj<MediaStream>('MediaStream', ['getAudioTracks']);
export const testDataDevice = new MediaDeviceTestData();
export const jwToken = new TokenResponse({
    expires_on: '06/10/2020 01:13:00',
    token:
        'eyJhbGciOiJIUzUxMuIsInR5cCI6IkpXRCJ9.eyJ1bmlxdWVfbmFtZSI6IjA0NjllNGQzLTUzZGYtNGExYS04N2E5LTA4OGI0MmExMTQxMiIsIm5iZiI6MTU5MTcyMjcyMCwiZXhwIjoxNTkxNzUxNjQwLCJpYXQiOjE1OTE3MjI3ODAsImlzcyI6ImhtY3RzLnZpZGVvLmhlYXJpbmdzLnNlcnZpY2UifO.USebpA7R7GUiPwF-uSuAd7Sx-bveOFi8LNE3oV7SLxdxASTlq7MfwhgYJhaC69OQAhWcrV7wSdcZ2OS-ZHkSUg'
});

export function initAllWRDependencies() {
    videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', [
        'getConferenceById',
        'getObfuscatedName',
        'getJwToken',
        'getCurrentParticipant',
        'getAllowedEndpointsForConference'
    ]);
    videoWebService.getConferenceById.and.resolveTo(globalConference);
    videoWebService.getObfuscatedName.and.returnValue('t***** u*****');
    videoWebService.getJwToken.and.resolveTo(jwToken);
    videoWebService.getCurrentParticipant.and.returnValue(Promise.resolve(new LoggedParticipantResponse({})));
    errorService = jasmine.createSpyObj<ErrorService>('ErrorService', ['goToServiceError', 'handleApiError', 'handlePexipError']);

    clockService = jasmine.createSpyObj<ClockService>('ClockService', ['getClock']);
    clockService.getClock.and.returnValue(of(new Date()));
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    heartbeatModelMapper = new HeartbeatModelMapper();
    deviceTypeService = jasmine.createSpyObj<DeviceTypeService>('DeviceTypeService', [
        'getBrowserName',
        'getBrowserVersion',
        'isSupportedBrowser',
        'isIpad',
        'isTablet'
    ]);

    consultationService = consultationServiceSpyFactory();

    logger = jasmine.createSpyObj<Logger>('Logger', ['debug', 'info', 'warn', 'event', 'error']);
    userMediaService = jasmine.createSpyObj<UserMediaService>('UserMediaService', [
        'updatePreferredCamera',
        'updatePreferredMicrophone',
        'getPreferredCamera',
        'getPreferredMicrophone',
        'setDevicesInCache'
    ]);
    userMediaStreamService = jasmine.createSpyObj<UserMediaStreamService>('UserMediaStreamService', [
        'stopStream',
        'getStreamForCam',
        'getStreamForMic'
    ]);
    userMediaStreamService.getStreamForCam.and.resolveTo(mockCamStream);
    userMediaStreamService.getStreamForMic.and.resolveTo(mockMicStream);
    userMediaService.getPreferredCamera.and.resolveTo(testDataDevice.getListOfCameras()[0]);
    userMediaService.getPreferredMicrophone.and.resolveTo(testDataDevice.getListOfMicrophones()[0]);
    userMediaService.setDevicesInCache.and.returnValue(Promise.resolve());
    notificationSoundsService = jasmine.createSpyObj<NotificationSoundsService>('NotificationSoundsService', [
        'playHearingAlertSound',
        'initHearingAlertSound',
        'stopHearingAlertSound',
        'initConsultationRequestRingtone',
        'playConsultationRequestRingtone',
        'stopConsultationRequestRingtone'
    ]);
    notificationToastrService = jasmine.createSpyObj<NotificationToastrService>('NotificationToastrService', [
        'showConsultationInvite',
        'showConsultationRejectedByLinkedParticipant',
        'showWaitingForLinkedParticipantsToAccept',
        'reportPoorConnection',
        'showAudioRecordingError',
        'showParticipantAdded'
    ]);
    toastrService = jasmine.createSpyObj<ToastrService>('ToastrService', ['show', 'clear', 'remove']);
    roomClosingToastrService = jasmine.createSpyObj<RoomClosingToastrService>('RoomClosingToastrService', [
        'showRoomClosingAlert',
        'clearToasts'
    ]);
    consultationInvitiationService = jasmine.createSpyObj<ConsultationInvitationService>('ConsultationInvitationService', [
        'getInvitation',
        'removeInvitation',
        'rejectInvitation',
        'linkedParticipantRejectedInvitation'
    ]);
}
