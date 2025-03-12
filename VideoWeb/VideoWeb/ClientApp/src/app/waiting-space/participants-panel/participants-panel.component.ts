import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { combineLatest, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { EndpointStatus, ParticipantResponse, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { TransferDirection } from 'src/app/services/models/hearing-transfer';
import { ParticipantPanelModelMapper } from 'src/app/shared/mappers/participant-panel-model-mapper';
import {
    CallParticipantIntoHearingEvent,
    DismissParticipantFromHearingEvent,
    LowerParticipantHandEvent,
    ToggleLocalMuteParticipantEvent,
    ToggleMuteParticipantEvent,
    ToggleSpotlightParticipantEvent
} from 'src/app/shared/models/participant-event';
import { HearingRole } from '../models/hearing-role-model';
import { LinkedParticipantPanelModel } from '../models/linked-participant-panel-model';
import { PanelModel } from '../models/panel-model-base';
import { ParticipantPanelModel } from '../models/participant-panel-model';
import { VideoEndpointPanelModel } from '../models/video-endpoint-panel-model';
import { ParticipantRemoteMuteStoreService } from '../services/participant-remote-mute-store.service';

import { ConferenceState } from '../store/reducers/conference.reducer';
import { Store } from '@ngrx/store';
import * as ConferenceSelectors from '../store/selectors/conference.selectors';
import { VHEndpoint, VHParticipant, VHPexipConference } from '../store/models/vh-conference';
import { VideoCallHostActions } from '../store/actions/video-call-host.actions';

@Component({
    standalone: false,
    selector: 'app-participants-panel',
    templateUrl: './participants-panel.component.html',
    styleUrls: ['./participants-panel.component.scss']
})
export class ParticipantsPanelComponent implements OnInit, OnDestroy {
    participants: PanelModel[] = [];
    nonEndpointParticipants: PanelModel[] = [];
    endpointParticipants: PanelModel[] = [];
    totalParticipants: number;
    totalParticipantsInWaitingRoom: number;
    isMuteAll = false;
    conferenceId: string;

    readonly idPrefix = 'participants-panel';

    private readonly loggerPrefix = '[ParticipantsPanel] -';
    private onDestroy$ = new Subject<void>();
    private mapper: ParticipantPanelModelMapper = new ParticipantPanelModelMapper();

    constructor(
        private eventService: EventsService,
        private logger: Logger,
        private translateService: TranslateService,
        private participantRemoteMuteStoreService: ParticipantRemoteMuteStoreService,
        private store: Store<ConferenceState>
    ) {}

    get participantsInHearing() {
        return this.participants.filter(x => x.isInHearing() && !x.isDisconnected());
    }

    get participantsInWaitingRoom() {
        return this.participants.filter(x => x.isAvailable() && !x.isInHearing());
    }

    get participantsNotConnected() {
        return this.participants.filter(x => !x.isAvailable() && !x.isInHearing());
    }

    ngOnInit() {
        this.store
            .select(ConferenceSelectors.getActiveConference)
            .pipe(
                takeUntil(this.onDestroy$),
                filter(x => !!x)
            )
            .subscribe(conference => {
                this.conferenceId = conference.id;
            });

        this.store
            .select(ConferenceSelectors.getPexipConference)
            .pipe(
                takeUntil(this.onDestroy$),
                filter(x => !!x)
            )
            .subscribe(conference => {
                this.handleUpdatedConferenceVideoCall(conference);
            });

        const participants$ = this.store.select(ConferenceSelectors.getParticipants);
        const endpoints$ = this.store.select(ConferenceSelectors.getEndpoints);
        combineLatest([participants$, endpoints$])
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(([participants, endpoints]) => {
                this.processParticipantAndEndpointUpdates(participants, endpoints);
            });
    }

    trackByParticipant(index: number, participant: PanelModel): string {
        return participant.id;
    }

    toggleMuteParticipantEventHandler(e: ToggleMuteParticipantEvent) {
        this.toggleMuteParticipant(e.participant);
    }

    async toggleLocalMuteParticipantEventHandler(e: ToggleLocalMuteParticipantEvent) {
        // toggling local mute targets individuals, not their links too
        const allParticipants = this.participants.flatMap(x => x.participantsList());
        const p = allParticipants.find(x => x.id === e.participant.id);
        await this.eventService.updateParticipantLocalMuteStatus(this.conferenceId, e.participant.id, !p.isLocalMicMuted());
    }

    updateAllParticipantsLocalMuteStatus(muteStatus: boolean) {
        if (muteStatus) {
            this.store.dispatch(VideoCallHostActions.localMuteAllParticipants());
        } else {
            this.store.dispatch(VideoCallHostActions.localUnmuteAllParticipants());
        }
    }

    toggleSpotlightParticipantEventHandler(e: ToggleSpotlightParticipantEvent) {
        this.toggleSpotlightParticipant(e.participant);
    }

    lowerParticipantHandEventHandler(e: LowerParticipantHandEvent) {
        this.lowerParticipantHand(e.participant);
    }

    callParticipantIntoHearingEventHandler(e: CallParticipantIntoHearingEvent) {
        this.callParticipantIntoHearing(e.participant);
    }

    dismissParticipantFromHearingEventHandler(e: DismissParticipantFromHearingEvent) {
        this.dismissParticipantFromHearing(e.participant);
    }

    ngOnDestroy(): void {
        this.onDestroy$.next();
        this.onDestroy$.complete();
    }

    handleUpdatedConferenceVideoCall(updatedConference: VHPexipConference): void {
        this.logger.debug(`${this.loggerPrefix} Conference has been muted`, {
            conference: this.conferenceId,
            guestedMuted: updatedConference.guestsMuted
        });
        this.isMuteAll = updatedConference.guestsMuted;
    }

    scrollToElement(elementId: string) {
        const element = document.getElementById(elementId);
        element?.scrollIntoView({ behavior: 'smooth' });
    }

    isParticipantInHearing(participant: PanelModel): boolean {
        return participant.isInHearing();
    }

    muteAndLockAll() {
        this.logger.debug(`${this.loggerPrefix} Judge is attempting to mute and lock all`, {
            conference: this.conferenceId,
            current: this.isMuteAll,
            new: true
        });
        this.store.dispatch(VideoCallHostActions.remoteMuteAndLockAllParticipants());
    }

    unlockAll() {
        this.logger.debug(`${this.loggerPrefix} Judge is attempting to unlock-mute all`, {
            conference: this.conferenceId,
            current: this.isMuteAll,
            new: false
        });
        // Unlock 'mute all guest participants' setting on conference
        this.store.dispatch(VideoCallHostActions.unlockRemoteMute());
    }

    toggleSpotlightParticipant(participant: PanelModel) {
        if (participant.hasSpotlight()) {
            this.store.dispatch(VideoCallHostActions.removeSpotlightForParticipant({ participantId: participant.id }));
        } else {
            this.store.dispatch(VideoCallHostActions.spotlightParticipant({ participantId: participant.id }));
        }
    }

    toggleMuteParticipant(participant: PanelModel) {
        const p = this.participants.find(x => x.id === participant.id);

        this.logger.debug(`${this.loggerPrefix} Judge is attempting to toggle mute for participant`, {
            conference: this.conferenceId,
            participant: p.id,
            pexipParticipant: p.pexipId,
            current: p.isMicRemoteMuted(),
            new: !p.isMicRemoteMuted()
        });

        if (participant.isMicRemoteMuted()) {
            this.store.dispatch(VideoCallHostActions.unlockRemoteMuteForParticipant({ participantId: participant.id }));
        } else {
            this.store.dispatch(VideoCallHostActions.lockRemoteMuteForParticipant({ participantId: participant.id }));
        }
    }

    lowerAllHands() {
        this.logger.debug(`${this.loggerPrefix} Judge is attempting to lower all hands in conference`, {
            conference: this.conferenceId
        });

        this.store.dispatch(VideoCallHostActions.lowerAllParticipantHands());
    }

    lowerParticipantHand(participant: PanelModel) {
        const p = this.participants.find(x => x.id === participant.id);
        this.logger.debug(`${this.loggerPrefix} Judge is attempting to lower hand for participant`, {
            conference: this.conferenceId,
            participant: p.id,
            pexipParticipant: p.pexipId
        });
        this.store.dispatch(VideoCallHostActions.lowerParticipantHand({ participantId: participant.id }));
    }

    callParticipantIntoHearing(participant: PanelModel) {
        this.logger.debug(`${this.loggerPrefix} Judge is attempting to call participant into hearing`, {
            conference: this.conferenceId,
            participant: participant.id
        });
        this.store.dispatch(VideoCallHostActions.admitParticipant({ participantId: participant.id }));
    }

    dismissParticipantFromHearing(participant: PanelModel) {
        const canDismiss = participant.isInHearing();
        if (!canDismiss) {
            return;
        }

        this.logger.debug(`${this.loggerPrefix} Judge is attempting to dismiss participant from hearing`, {
            conference: this.conferenceId,
            participant: participant.id
        });

        this.store.dispatch(VideoCallHostActions.dismissParticipant({ participantId: participant.id }));
    }

    isEndpoint(participant: PanelModel) {
        return participant instanceof VideoEndpointPanelModel;
    }

    isLinkedParticipantAndAnInterpreter(participant: PanelModel) {
        if (!(participant instanceof LinkedParticipantPanelModel)) {
            return false;
        }
        return participant.participants.some(x => x.hearingRole === HearingRole.INTERPRETER);
    }

    mapParticipantToParticipantResponse(participant: ParticipantPanelModel): ParticipantResponse {
        const participantResponse = new ParticipantResponse();
        participantResponse.id = participant.id;
        participantResponse.status = participant.status;
        participantResponse.display_name = participant.displayName;
        participantResponse.role = participant.role;
        participantResponse.hearing_role = participant.hearingRole;
        participantResponse.representee = participant.representee;
        return participantResponse;
    }

    isParticipantDisconnected(participant: PanelModel): boolean {
        return participant.isDisconnected();
    }

    getPanelRowTooltipText(participant: PanelModel) {
        let toolTipText = participant.displayName + this.getAdditionalText(participant);

        if (!participant.isDisconnected() && !participant.isInHearing()) {
            toolTipText = participant.displayName + ': ' + this.getTranslatedText('not-joined') + this.getAdditionalText(participant);
        }
        if (participant.isAvailable()) {
            toolTipText = participant.displayName + ': ' + this.getTranslatedText('joining') + this.getAdditionalText(participant);
        }
        if (participant.isWitness && participant.isAvailable() && !participant.isInHearing()) {
            toolTipText =
                participant.displayName + ': ' + this.getTranslatedText('participant-available') + this.getAdditionalText(participant);
        }
        if (participant.isDisconnected()) {
            toolTipText = participant.displayName + ': ' + this.getTranslatedText('disconnected') + this.getAdditionalText(participant);
        }

        return toolTipText;
    }

    getAdditionalText(participant: PanelModel): string {
        return participant.hearingRole !== HearingRole.JUDGE ? this.getHearingRole(participant) : '';
    }

    getPanelRowTooltipColour(participant: PanelModel) {
        if (participant.isDisconnected()) {
            return 'red';
        } else if (participant.isAvailable() || participant.isInHearing()) {
            return 'blue';
        } else {
            return 'grey';
        }
    }

    getTranslatedText(key: string): string {
        return this.translateService.instant(`participants-panel.${key}`);
    }

    isWitness(participant: PanelModel) {
        return participant.isWitness;
    }

    private processParticipantAndEndpointUpdates(participants: VHParticipant[], endpoints: VHEndpoint[]) {
        this.totalParticipants = participants.length + endpoints.length;
        this.totalParticipantsInWaitingRoom =
            participants.filter(x => x.status === ParticipantStatus.Available || x.status === ParticipantStatus.InConsultation).length +
            endpoints.filter(x => x.status === EndpointStatus.InConsultation).length;

        this.nonEndpointParticipants = this.mapper.mapFromVHParticipants(participants);
        this.endpointParticipants = endpoints.map(x => {
            const ep = new VideoEndpointPanelModel(x);
            ep.updateTransferringInStatus(x.transferDirection === TransferDirection.In);
            return ep;
        });
        this.updateParticipants();
    }

    private getHearingRole(participant: PanelModel): string {
        if (participant.role === Role.JudicialOfficeHolder) {
            return '';
        }
        const translatedtext = this.getTranslatedText('for');
        const hearingRoleText = this.translateService.instant('hearing-role.' + participant.hearingRole.toLowerCase().split(' ').join('-'));
        return participant.representee ? `<br/>${hearingRoleText} ${translatedtext} ${participant.representee}` : `<br/>${hearingRoleText}`;
    }

    private updateParticipants() {
        const combined = [...this.nonEndpointParticipants, ...this.endpointParticipants];
        this.getOrderedParticipants(combined);
    }

    private getOrderedParticipants(combined: PanelModel[]) {
        combined.sort((x, z) => {
            if (x.orderInTheList === z.orderInTheList) {
                // 4 here means regular participants and should be grouped by caseTypeGroup
                if (x.orderInTheList !== 4 || x.role === z.role) {
                    return x.displayName.localeCompare(z.displayName);
                }
                return x.role.localeCompare(z.role);
            }
            return x.orderInTheList > z.orderInTheList ? 1 : -1;
        });
        this.participants = combined;
    }
}
