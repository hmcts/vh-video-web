import { Subject } from 'rxjs';
import { ImEventsService } from 'src/app/services/im-events.service';
import { ConferenceMessageAnswered } from 'src/app/services/models/conference-message-answered';
import { InstantMessage } from 'src/app/services/models/instant-message';

export let imEventsServiceSpy: jasmine.SpyObj<ImEventsService>;

export const imEventHubDisconnectSubjectMock = new Subject<number>();
export const imEventHubReconnectSubjectMock = new Subject();
export const messageSubjectMock = new Subject<InstantMessage>();
export const adminAnsweredChatSubjectMock = new Subject<ConferenceMessageAnswered>();
export const onEventsHubReadySubjectMock = new Subject<boolean>();
export let imEventHubIsConnectedMock: boolean;

imEventsServiceSpy = jasmine.createSpyObj<ImEventsService>(
    'ImEventsService',
    [
        'start',
        'stop',
        'getServiceDisconnected',
        'getServiceConnected',
        'getChatMessage',
        'sendMessage',
        'getAdminAnsweredChat',
        'onEventsHubReady'
    ],
    ['imEventHubIsConnected']
);

imEventsServiceSpy.getServiceDisconnected.and.returnValue(imEventHubDisconnectSubjectMock.asObservable());
imEventsServiceSpy.getServiceConnected.and.returnValue(imEventHubReconnectSubjectMock.asObservable());
imEventsServiceSpy.getChatMessage.and.returnValue(messageSubjectMock.asObservable());
imEventsServiceSpy.getAdminAnsweredChat.and.returnValue(adminAnsweredChatSubjectMock.asObservable());
imEventsServiceSpy.onEventsHubReady.and.returnValue(onEventsHubReadySubjectMock.asObservable());
