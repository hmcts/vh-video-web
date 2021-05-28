import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ParticipantStatus } from 'src/app/services/clients/api-client';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { HearingControlsBaseComponent } from '../hearing-controls/hearing-controls-base.component';
import { VideoCallService } from '../services/video-call.service';

@Component({
    selector: 'app-private-consultation-room-controls',
    templateUrl: './private-consultation-room-controls.component.html',
    styleUrls: ['./private-consultation-room-controls.component.scss'],
    inputs: [
        'conferenceId',
        'participant',
        'audioOnly',
        'isPrivateConsultation',
        'outgoingStream',
        'isSupportedBrowserForNetworkHealth',
        'showConsultationControls',
        'unreadMessageCount'
    ],
    outputs: ['leaveConsultation', 'lockConsultation', 'togglePanel', 'changeDeviceToggle']
})
export class PrivateConsultationRoomControlsComponent extends HearingControlsBaseComponent {
    constructor(
        protected videoCallService: VideoCallService,
        protected eventService: EventsService,
        protected deviceTypeService: DeviceTypeService,
        protected logger: Logger,
        protected translateService: TranslateService
    ) {
        super(videoCallService, eventService, deviceTypeService, logger, translateService);
    }

    canCloseOrPauseHearing() {
        return this.participant?.status === ParticipantStatus.InHearing;
    }

    canLeaveConsultation() {
        return this.participant?.status === ParticipantStatus.InConsultation;
    }
}
