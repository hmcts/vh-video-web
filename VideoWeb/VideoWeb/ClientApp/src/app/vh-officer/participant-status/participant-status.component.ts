import { Component, Input, OnInit } from '@angular/core';
import { ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { VideoWebService } from '../../services/api/video-web.service';
import { ErrorService } from '../../services/error.service';
import { Logger } from '../../services/logging/logger-base';
import { ParticipantContactDetails } from '../../shared/models/participant-contact-details';
import { ParticipantStatusMessage } from '../../services/models/participant-status-message';
import { Subscription } from 'rxjs';
import { EventsService } from '../../services/events.service';
import { ParticipantStatusReader } from '../../shared/models/participant-status-reader';

@Component({
    selector: 'app-participant-status',
    templateUrl: './participant-status.component.html',
    styleUrls: ['./participant-status.component.scss', '../vho-global-styles.scss']
})
export class ParticipantStatusComponent implements OnInit {
    loadingData: boolean;
    hearingVenueName: string;
    participants: ParticipantContactDetails[];
    eventHubSubscriptions: Subscription = new Subscription();

    @Input() conferenceId: string;

    constructor(
        private videoWebService: VideoWebService,
        private errorService: ErrorService,
        private eventService: EventsService,
        private logger: Logger,
        private participantStatusReader: ParticipantStatusReader
    ) {
        this.loadingData = true;
    }

    async ngOnInit(): Promise<any> {
        await this.setupEventHubSubscribers();
        await this.loadData();
    }

    async loadData() {
        this.logger.info('Loading VH Officer Dashboard Participant Status list');

        const participantDetails = await this.getParticipantsByConference(this.conferenceId);

        this.participants = participantDetails.map(x => {
            const participant = new ParticipantContactDetails(x);
            this.setParticipantStatus(participant.status, participant);

            return participant;
        });

        this.loadingData = false;
    }

    async getParticipantsByConference(conferenceId: string) {
        try {
            return await this.videoWebService.getParticipantsWithContactDetailsByConferenceId(conferenceId);
        } catch (error) {
            this.logger.error('There was an error getting the VH Officer dashboard participant status list of names', error);
            this.loadingData = false;
            this.errorService.handleApiError(error);
        }
    }

    setParticipantStatus(participantStatus: ParticipantStatus, participant: ParticipantContactDetails) {
        const inAnotherHearing = participant.judgeInAnotherHearing && participant.status !== ParticipantStatus.InHearing;
        participant.status = participantStatus;

        if (participant.role === Role.Judge) {
            participant.statusText = inAnotherHearing
                ? this.participantStatusReader.inAnotherHearingText
                : this.participantStatusReader.getStatusAsTextForJudge(participantStatus);
        } else {
            participant.statusText = this.participantStatusReader.getStatusAsText(participantStatus);
        }
    }

    async setupEventHubSubscribers() {
        this.logger.debug('Subscribing to participant status changes...');
        this.eventHubSubscriptions.add(
            this.eventService.getParticipantStatusMessage().subscribe(async message => {
                await this.handleParticipantStatusChange(message);
            })
        );

        this.logger.debug('Subscribing to EventHub reconnects');
        this.eventHubSubscriptions.add(
            this.eventService.getServiceReconnected().subscribe(async () => {
                this.logger.info(`EventHub reconnected for vh officer`);
                await this.refreshConferenceDataDuringDisconnect();
            })
        );
    }

    async handleParticipantStatusChange(message: ParticipantStatusMessage): Promise<void> {
        if (!this.participants) {
            return;
        }

        if (this.conferenceId !== message.conferenceId) {
            const thisJudge = this.participants.find(x => x.username === message.username);
            if (thisJudge) {
                thisJudge.judgeInAnotherHearing = message.status === ParticipantStatus.InHearing;
                this.setParticipantStatus(thisJudge.status, thisJudge);
            }
        }

        const participantInThisConference = this.participants.find(x => x.id === message.participantId);
        if (participantInThisConference) {
            this.setParticipantStatus(message.status, participantInThisConference);

            return;
        }
    }

    async refreshConferenceDataDuringDisconnect(): Promise<void> {
        this.logger.warn('EventHub refresh pending...');
        await this.loadData();
    }

    getParticipantStatusClass(state: ParticipantStatus): string {
        switch (state) {
            case ParticipantStatus.None:
            case ParticipantStatus.NotSignedIn:
                return 'participant-not-signed-in';
            case ParticipantStatus.Disconnected:
                return 'participant-disconnected';
            case ParticipantStatus.Available:
                return 'participant-available';
            default:
                return 'participant-default-status';
        }
    }
}
