import { Component, ElementRef, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
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
            this.videoFilterService.onFilterChanged.subscribe(async values => {
                const filter = values[1];
                const wasPreviouslyFiltered = !!values[0];
                this.logger.debug(`${this.loggerPrefix} filter applied ${filter ? filter : 'off'}`);
                if (filter && !wasPreviouslyFiltered) {
                    this.updatePexipStreamAndHideOriginalStream();
                } else if (!filter) {
                    this.revertToUnfilteredStream();
                }
            })
        );

        // TOOD: find a better way to trigger this
        setTimeout(() => {
            this.applyVideoFilterIfNeeded().catch(err => {
                this.logger.error(`${this.loggerPrefix} Failed to apply video filter`, err, {
                    conference: this.conferenceId,
                    participant: this.participant.id
                });
            });
        }, 1000);
    }

    async applyVideoFilterIfNeeded() {
        await this.videoFilterService.initFilterStream(this);
        this.logger.debug(`${this.loggerPrefix} ${this.videoFilterService.activeFilter} filter previously selected, applying to stream`);
        this.filteredStream = this.videoFilterService.startFilteredStream(true);
        this.videoCallService.applyUserStream(this.filteredStream);
        this.videoCallService.reconnectToCallWithNewDevices();
    }

    async updatePexipStreamAndHideOriginalStream() {
        this.logger.debug(`${this.loggerPrefix} starting filter stream and updating pexip client`);
    }

    revertToUnfilteredStream() {}
}
