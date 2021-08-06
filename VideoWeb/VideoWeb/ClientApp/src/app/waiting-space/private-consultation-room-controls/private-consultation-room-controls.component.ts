import { Component, ElementRef, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { pairwise, startWith } from 'rxjs/operators';
import { ParticipantStatus } from 'src/app/services/clients/api-client';
import { ParticipantService } from 'src/app/services/conference/participant.service';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { IVideoFilterer } from 'src/app/services/models/background-filter';
import { VideoFilterService } from 'src/app/services/video-filter.service';
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
export class PrivateConsultationRoomControlsComponent extends HearingControlsBaseComponent implements IVideoFilterer {
    @ViewChild('outputCanvas', { static: false }) outputCanvas: ElementRef<HTMLCanvasElement>;

    hideOriginalStream: boolean;
    filteredStream: MediaStream;
    originalAudioSource;
    originalVideoSource;

    constructor(
        protected videoCallService: VideoCallService,
        protected eventService: EventsService,
        protected deviceTypeService: DeviceTypeService,
        protected logger: Logger,
        protected participantService: ParticipantService,
        protected translateService: TranslateService,
        private videoFilterService: VideoFilterService
    ) {
        super(videoCallService, eventService, deviceTypeService, logger, participantService, translateService);
    }

    retrieveVideoElement(): HTMLVideoElement {
        return document.getElementById('outgoingFeedVideo') as HTMLVideoElement;
    }
    retrieveCanvasElement(): HTMLCanvasElement {
        return this.outputCanvas.nativeElement;
    }

    canCloseOrPauseHearing() {
        return this.participant?.status === ParticipantStatus.InHearing;
    }

    canLeaveConsultation() {
        return this.participant?.status === ParticipantStatus.InConsultation;
    }

    setupEventhubSubscribers() {
        super.setupEventhubSubscribers();

        this.videoCallSubscription$.add(
            this.videoFilterService.onFilterChanged.pipe(startWith(null), pairwise()).subscribe(async values => {
                const filter = values[1];
                this.logger.debug(`${this.loggerPrefix} filter applied ${filter ? filter : 'off'}`);
                if (filter) {
                    this.videoFilterService.initFilterStream(this);
                    this.filteredStream = await this.videoFilterService.startFilteredStream();
                    this.videoCallService.applyUserStream(this.filteredStream);
                    this.hideOriginalStream = true;
                } else {
                    this.videoCallService.removeUserStream();
                    this.filteredStream = null;
                    this.videoFilterService.stopStream();
                    this.hideOriginalStream = false;
                }
                if (!values[0] || !values[1]) {
                    this.videoCallService.reconnectToCallWithNewDevices();
                }
            })
        );
    }
}
