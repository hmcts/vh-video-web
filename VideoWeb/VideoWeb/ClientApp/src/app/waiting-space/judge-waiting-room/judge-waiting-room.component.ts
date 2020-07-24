import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceStatus } from 'src/app/services/clients/api-client';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { HeartbeatModelMapper } from 'src/app/shared/mappers/heartbeat-model-mapper';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { VideoCallService } from '../services/video-call.service';
import { WaitingRoomBaseComponent } from '../waiting-room-shared/waiting-room-base.component';

@Component({
    selector: 'app-judge-waiting-room',
    templateUrl: './judge-waiting-room.component.html',
    styleUrls: ['./judge-waiting-room.component.scss']
})
export class JudgeWaitingRoomComponent extends WaitingRoomBaseComponent implements OnInit, OnDestroy {
    constructor(
        protected route: ActivatedRoute,
        protected videoWebService: VideoWebService,
        protected eventService: EventsService,
        protected adalService: AdalService,
        protected logger: Logger,
        protected errorService: ErrorService,
        protected heartbeatMapper: HeartbeatModelMapper,
        protected videoCallService: VideoCallService,
        protected deviceTypeService: DeviceTypeService,
        protected router: Router
    ) {
        super(
            route,
            videoWebService,
            eventService,
            adalService,
            logger,
            errorService,
            heartbeatMapper,
            videoCallService,
            deviceTypeService,
            router
        );
    }

    ngOnInit() {
        this.errorCount = 0;
        this.logger.debug('Loading judge waiting room');
        this.connected = false;
        this.getConference().then(() => {
            this.startEventHubSubscribers();
            this.getJwtokenAndConnectToPexip();
        });
    }

    @HostListener('window:beforeunload')
    async ngOnDestroy(): Promise<void> {
        this.logger.debug('[Judge WR] - Clearing intervals and subscriptions for judge waiting room');
        clearTimeout(this.callbackTimeout);
        this.disconnect();
        this.eventHubSubscription$.unsubscribe();
        this.videoCallSubscription$.unsubscribe();
    }

    updateShowVideo(): void {
        if (!this.connected) {
            this.logger.debug('Not showing video because not connecting to node');
            this.showSelfView = false;
            this.showVideo = false;
            this.showConsultationControls = false;
            return;
        }

        if (this.hearing.isInSession()) {
            this.logger.debug('Showing video because hearing is in session');
            this.showSelfView = true;
            this.showVideo = true;
            this.showConsultationControls = false;
            return;
        }

        this.logger.debug('Not showing video because hearing is not in session and user is not in consultation');
        this.showSelfView = false;
        this.showVideo = false;
        this.showConsultationControls = false;
    }

    getConferenceStatusText() {
        switch (this.conference.status) {
            case ConferenceStatus.NotStarted:
                return 'Start this hearing';
            case ConferenceStatus.Suspended:
                return 'Hearing suspended';
            case ConferenceStatus.Paused:
                return 'Hearing paused';
            case ConferenceStatus.Closed:
                return 'Hearing is closed';
            default:
                return 'Hearing is in session';
        }
    }

    isNotStarted(): boolean {
        return this.conference.status === ConferenceStatus.NotStarted;
    }

    isPaused(): boolean {
        return this.conference.status === ConferenceStatus.Paused || this.conference.status === ConferenceStatus.Suspended;
    }

    startHearing() {
        this.logger.info('starting hearing');
    }

    goToJudgeHearingList(): void {
        this.router.navigate([pageUrls.JudgeHearingList]);
    }

    checkEquipment() {
        this.router.navigate([pageUrls.EquipmentCheck, this.conference.id]);
    }

    hearingSuspended(): boolean {
        return this.conference.status === ConferenceStatus.Suspended;
    }

    hearingPaused(): boolean {
        return this.conference.status === ConferenceStatus.Paused;
    }
}
