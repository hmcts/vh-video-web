import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { Hearing } from 'src/app/shared/models/hearing';
import { Participant } from 'src/app/shared/models/participant';
import { ParticipantContactDetails } from 'src/app/shared/models/participant-contact-details';
import { ParticipantStatusReader } from 'src/app/shared/models/participant-status-reader';
import { HearingRole } from 'src/app/waiting-space/models/hearing-role-model';
@Component({
    selector: 'app-admin-im-list',
    templateUrl: './admin-im-list.component.html',
    styleUrls: ['./admin-im-list.component.scss']
})
export class AdminImListComponent implements OnInit {
    @Input() hearing: Hearing;
    @Output() selectedParticipant = new EventEmitter<ParticipantContactDetails>();

    eventHubSubscriptions: Subscription = new Subscription();
    participants: ParticipantContactDetails[];
    sortedParticipants: ParticipantContactDetails[];
    loadingData: boolean;
    conferenceId: string;

    imParticipants: Participant[];

    currentParticipant: ParticipantContactDetails;

    roles = Role;
    participantStatus = ParticipantStatus;

    constructor(
        private videoWebService: VideoWebService,
        private eventService: EventsService,
        private participantStatusReader: ParticipantStatusReader,
        private errorService: ErrorService,
        private logger: Logger
    ) {
        this.loadingData = true;
    }

    ngOnInit() {
        this.conferenceId = this.hearing.getConference().id;
        this.setupEventHubSubscribers();
        this.loadData();
    }

    async loadData() {
        this.logger.info('[AdminImListComponent] - Loading VH Officer Dashboard Participant Status list');

        const participantDetails = await this.getParticipantsByConference(this.conferenceId);

        this.participants = participantDetails.map(x => {
            const participant = new ParticipantContactDetails(x);
            this.setParticipantStatus(participant.status, participant);

            return participant;
        });
        this.participants = this.sortParticipants();
        this.loadingData = false;
    }

    async getParticipantsByConference(conferenceId: string) {
        try {
            return await this.videoWebService.getParticipantsWithContactDetailsByConferenceId(conferenceId);
        } catch (error) {
            this.logger.error(
                '[AdminImListComponent] - There was an error getting the VH Officer dashboard participant status list of names',
                error,
                { conference: conferenceId }
            );
            this.loadingData = false;
            this.errorService.handleApiError(error);
        }
    }

    private sortParticipants() {
        const judges = this.participants.filter(participant => participant.hearingRole === HearingRole.JUDGE);
        const panelMembersAndWingers = this.participants.filter(participant =>
            [HearingRole.PANEL_MEMBER.toString(), HearingRole.WINGER.toString()].includes(participant.hearingRole)
        );
        const observers = this.participants.filter(participant => participant.hearingRole === HearingRole.OBSERVER);
        const interpretersAndInterpretees = this.participants.filter(participant => participant.isInterpreterOrInterpretee);
        const others = this.participants.filter(
            participant =>
                !judges.includes(participant) &&
                !panelMembersAndWingers.includes(participant) &&
                !interpretersAndInterpretees.includes(participant) &&
                !observers.includes(participant)
        );

        this.sortedParticipants = [...judges, ...panelMembersAndWingers, ...others, ...interpretersAndInterpretees, ...observers];
        return this.sortedParticipants;
    }

    setupEventHubSubscribers() {
        this.logger.debug('[AdminImListComponent] - Subscribing to participant status changes...');
        this.eventHubSubscriptions.add(
            this.eventService.getParticipantStatusMessage().subscribe(async message => {
                await this.handleParticipantStatusChange(message);
            })
        );

        this.logger.debug('[AdminImListComponent] - Subscribing to EventHub reconnects');
        this.eventHubSubscriptions.add(
            this.eventService.getServiceReconnected().subscribe(async () => {
                this.logger.info(`[AdminImListComponent] - EventHub reconnected for vh officer`);
                await this.refreshConferenceDataDuringDisconnect();
            })
        );

        this.eventHubSubscriptions.add(
            this.eventService.getParticipantsUpdated().subscribe(participantsUpdatedMessage => {
                this.logger.debug(`[WR] - Participants Updated`, participantsUpdatedMessage);
                if (this.conferenceId === participantsUpdatedMessage.conferenceId) {
                    this.logger.debug(`[WR] - Participants updated for current conference, updating list`);
                    this.loadData();
                }
            })
        );
    }

    handleParticipantStatusChange(message: ParticipantStatusMessage): Promise<void> {
        if (!this.participants) {
            return;
        }

        if (this.conferenceId !== message.conferenceId) {
            const thisJudge = this.participants.find(x => x.username === message.username);
            if (thisJudge) {
                thisJudge.hostInAnotherHearing = message.status === ParticipantStatus.InHearing;
                this.setParticipantStatus(thisJudge.status, thisJudge);
            }
        }

        const participantInThisConference = this.participants.find(x => x.id === message.participantId);
        if (participantInThisConference) {
            this.setParticipantStatus(message.status, participantInThisConference);

            return;
        }
    }

    setParticipantStatus(participantStatus: ParticipantStatus, participant: ParticipantContactDetails) {
        const inAnotherHearing = participant.hostInAnotherHearing && participant.status !== ParticipantStatus.InHearing;
        participant.status = participantStatus;
        if (participant.role === Role.Judge || participant.role === Role.StaffMember) {
            participant.statusText = inAnotherHearing
                ? this.participantStatusReader.inAnotherHearingText
                : this.participantStatusReader.getStatusAsTextForHost(participantStatus);
        } else {
            participant.statusText = this.participantStatusReader.getStatusAsText(participantStatus);
        }
    }

    async refreshConferenceDataDuringDisconnect(): Promise<void> {
        this.logger.warn('[AdminImListComponent] - EventHub refresh pending...');
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

    selectParticipant(participant: ParticipantContactDetails) {
        this.currentParticipant = participant;
        this.selectedParticipant.emit(participant);
    }

    isParticipantAvailable(participant: Participant): boolean {
        if (participant.isJudge) {
            return participant.status !== ParticipantStatus.Disconnected && participant.status !== ParticipantStatus.InConsultation;
        } else {
            return participant.status === ParticipantStatus.Available;
        }
    }
}
