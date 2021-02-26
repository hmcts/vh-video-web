import { Component } from '@angular/core';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { HearingControlsBaseComponent } from '../hearing-controls/hearing-controls-base.component';
import { VideoCallService } from '../services/video-call.service';

@Component({
    selector: 'app-hearing-controls',
    templateUrl: './hearing-controls.component.html',
    styleUrls: ['./hearing-controls.component.scss'],
    inputs: [
        'conferenceId',
        'participant',
        'audioOnly',
        'isPrivateConsultation',
        'outgoingStream',
        'isSupportedBrowserForNetworkHealth',
        'showConsultationControls'
    ],
    outputs: ['leaveConsultation', 'lockConsultation']
})
export class HearingControlsComponent extends HearingControlsBaseComponent {
    constructor(
        protected videoCallService: VideoCallService,
        protected eventService: EventsService,
        protected deviceTypeService: DeviceTypeService,
        protected logger: Logger
    ) {
        super(videoCallService, eventService, deviceTypeService, logger);
    }
}
