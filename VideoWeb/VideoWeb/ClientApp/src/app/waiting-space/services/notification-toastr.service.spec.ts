import { Component } from '@angular/core';
import { ToastRef } from 'ngx-toastr';
import { ConferenceResponse, ParticipantResponse } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { Participant } from 'src/app/shared/models/participant';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { component, consultationService, globalConference, globalParticipant, mockToast, mockToastRef, notificationSoundsService, toastrService } from '../waiting-room-shared/tests/waiting-room-base-setup';
import { NotificationToastrService } from './notification-toastr.service';

describe('NotificationToastrService', () => {
    let service: NotificationToastrService;
    const logger: Logger = new MockLogger();
    let roomLabel: string;
    let conference: ConferenceResponse;
    let participant: ParticipantResponse;

    beforeAll(() => { });

    beforeEach(() => {
        service = new NotificationToastrService(logger, toastrService, consultationService, notificationSoundsService);
        roomLabel = 'Meeting room 1'
        conference = new ConferenceResponse(Object.assign({}, globalConference));
        participant = new ParticipantResponse(Object.assign({}, globalParticipant));
    });

    it('should create', async () => {
        expect(service).toBeTruthy();
    });

    it('should play notification ringtone', async () => {
        //spyOnProperty(mockToast, 'toastRef').and.returnValue(mockToastRef);
        (Object.getOwnPropertyDescriptor(mockToast, 'toastRef')?.get as jasmine.Spy<() => ToastRef<Component>>).and.returnValue(mockToastRef);
        toastrService.show.and.returnValue(mockToast);
        const p = new Participant(participant);
        service.showConsultationInvite(roomLabel, conference.id, p, p, [p], false);
        expect(notificationSoundsService.playConsultationRequestRingtone).toHaveBeenCalledTimes(1);
    });
});
