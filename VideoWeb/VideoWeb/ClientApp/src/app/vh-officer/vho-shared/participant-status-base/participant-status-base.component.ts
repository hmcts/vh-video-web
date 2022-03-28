import { Directive } from '@angular/core';
import { ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { Subscription } from 'rxjs';
import { HearingRole } from 'src/app/waiting-space/models/hearing-role-model';
import { ParticipantContactDetails } from 'src/app/shared/models/participant-contact-details';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ParticipantStatusReader } from 'src/app/shared/models/participant-status-reader';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { HearingRoleHelper } from 'src/app/shared/helpers/hearing-role-helper';

@Directive()
export abstract class ParticipantStatusDirective {
    loadingData: boolean;
    hearingVenueName: string;
    participants: ParticipantContactDetails[];
    sortedParticipants: ParticipantContactDetails[];
    eventHubSubscriptions: Subscription = new Subscription();
    conferenceId: string;

    constructor(
        protected videoWebService: VideoWebService,
        protected errorService: ErrorService,
        protected eventService: EventsService,
        protected logger: Logger,
        protected participantStatusReader: ParticipantStatusReader
    ) {
        this.loadingData = true;
    }

    async loadData() {
        this.logger.info('[ParticipantStatus] - Loading VH Officer Dashboard Participant Status list');

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
                '[ParticipantStatus] - There was an error getting the VH Officer dashboard participant status list of names',
                error,
                { conference: conferenceId }
            );
            this.loadingData = false;
            this.errorService.handleApiError(error);
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

    setupEventHubSubscribers() {
        this.logger.debug('[ParticipantStatus] - Subscribing to participant status changes...');
        this.eventHubSubscriptions.add(
            this.eventService.getParticipantStatusMessage().subscribe(async message => {
                await this.handleParticipantStatusChange(message);
            })
        );

        this.logger.debug('[ParticipantStatus] - Subscribing to EventHub reconnects');
        this.eventHubSubscriptions.add(
            this.eventService.getServiceConnected().subscribe(async () => {
                this.logger.info(`[ParticipantStatus] - EventHub reconnected for vh officer`);
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
                thisJudge.hostInAnotherHearing =
                    message.status === ParticipantStatus.InHearing || message.status === ParticipantStatus.Available;
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
        this.logger.warn('[ParticipantStatus] - EventHub refresh pending...');
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

    sortParticipants() {
        const judges = this.participants.filter(participant => participant.hearingRole === HearingRole.JUDGE);

        const panelMembersAndWingers = this.participants.filter(participant =>
            [...HearingRoleHelper.panelMemberRoles, HearingRole.WINGER.toString()].includes(participant.hearingRole)
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
}
