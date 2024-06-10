import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PanelModel } from '../../models/panel-model-base';
import { HearingRole } from '../../models/hearing-role-model';
import { TranslateService } from '@ngx-translate/core';
import { CaseTypeGroup } from '../../models/case-type-group';
import { LinkedParticipantPanelModel } from '../../models/linked-participant-panel-model';
import { VideoEndpointPanelModel } from '../../models/video-endpoint-panel-model';
import { ParticipantResponse } from 'src/app/services/clients/api-client';
import { ParticipantPanelModel } from '../../models/participant-panel-model';
import {
    CallParticipantIntoHearingEvent, DismissParticipantFromHearingEvent,
    LowerParticipantHandEvent, ToggleLocalMuteParticipantEvent,
    ToggleMuteParticipantEvent,
    ToggleSpotlightParticipantEvent
} from '../../../shared/models/participant-event';

@Component({
    selector: 'app-participants-panel-item',
    templateUrl: './participants-panel-item.component.html',
    styleUrl: './participants-panel-item.component.scss'
})
export class ParticipantsPanelItemComponent {
    @Output() participantMuteToggled = new EventEmitter<ToggleMuteParticipantEvent>();
    @Output() participantLocalMuteToggled = new EventEmitter<ToggleLocalMuteParticipantEvent>();
    @Output() participantSpotlightToggled = new EventEmitter<ToggleSpotlightParticipantEvent>();
    @Output() participantHandLowered = new EventEmitter<LowerParticipantHandEvent>();
    @Output() participantAdmitted = new EventEmitter<CallParticipantIntoHearingEvent>();
    @Output() participantDismissed = new EventEmitter<DismissParticipantFromHearingEvent>();

    readonly idPrefix = 'participants-panel';

    participant: PanelModel;

    isDisconnected = false;
    panelRowTooltipText = '';
    panelRowTooltipColour = '';
    isJudge = false;
    isHost = false;
    isEndpoint = false;
    isLinkedParticipantAndAnInterpreter = false;
    isJudicialOfficeHolder = false;
    isParticipantInHearing = false;
    isWitness = false;

    isMicRemoteMuted = false;
    isLocalMicMuted = false;
    hasHandRaised = false;
    isLocalCameraOff = false;
    hasSpotlight = false;

    isCallable = false;
    isInHearing = false;
    isAvailable = false;
    transferringIn = false;

    constructor(private translateService: TranslateService) {}

    @Input() set item (value: PanelModel) {
        this.participant = value;
        this.hasSpotlight = value.hasSpotlight();
        this.isDisconnected = value.isDisconnected();
        this.panelRowTooltipText = this.getPanelRowTooltipText(value);
        this.panelRowTooltipColour = this.getPanelRowTooltipColour(value);
        this.isJudge = value.hearingRole === HearingRole.JUDGE;
        this.isHost = value.isHost;
        this.isEndpoint = this.isItemAnEndpoint(value);
        this.isLinkedParticipantAndAnInterpreter = this.determineIfIsLinkedParticipantAndAnInterpreter(value);
        this.isJudicialOfficeHolder = value.isJudicialOfficeHolder;
        this.isParticipantInHearing = value.isInHearing();
        this.isWitness = value.isWitness;

        this.isMicRemoteMuted = value.isMicRemoteMuted();
        this.isLocalMicMuted = value.isLocalMicMuted();
        this.hasHandRaised = value.hasHandRaised();
        this.isLocalCameraOff = value.isLocalCameraOff();
        this.hasSpotlight = value.hasSpotlight();


        this.isCallable = value.isCallable;
        this.isInHearing = value.isInHearing();
        this.isAvailable = value.isAvailable();
        this.transferringIn = value.transferringIn;
    }

    isItemAnEndpoint(participant: PanelModel) {
        return participant instanceof VideoEndpointPanelModel;
    }

    determineIfIsLinkedParticipantAndAnInterpreter(participant: PanelModel) {
        if (!(participant instanceof LinkedParticipantPanelModel)) {
            return false;
        }
        return participant.participants.some(x => x.hearingRole === HearingRole.INTERPRETER);
    }

    mapParticipantToParticipantResponse(): ParticipantResponse {
        const participantModelTyped = this.participant as ParticipantPanelModel;
        const participantResponse = new ParticipantResponse();
        participantResponse.id = participantModelTyped.id;
        participantResponse.status = participantModelTyped.status;
        participantResponse.display_name = participantModelTyped.displayName;
        participantResponse.role = participantModelTyped.role;
        participantResponse.case_type_group = participantModelTyped.caseTypeGroup;
        participantResponse.hearing_role = participantModelTyped.hearingRole;
        participantResponse.representee = participantModelTyped.representee;
        return participantResponse;
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
        return participant.hearingRole !== HearingRole.JUDGE ? this.getHearingRole(participant) + this.getCaseRole(participant) : '';
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

    toggleParticipantSpotlight() {
        this.participantSpotlightToggled.emit({participant: this.participant});
    }

    toggleParticipantMute() {
        this.participantMuteToggled.emit({participant: this.participant});
    }

    toggleParticipantLocalMute() {
        this.participantLocalMuteToggled.emit({participant: this.participant});
    }

    lowerParticipantHand() {
        this.participantHandLowered.emit({participant: this.participant});
    }

    callParticipantIntoHearing() {
        this.participantAdmitted.emit({participant: this.participant});
    }

    dismissParticipantFromHearing() {
        this.participantDismissed.emit({participant: this.participant});
    }

    private getHearingRole(participant: PanelModel): string {
        if (participant.caseTypeGroup?.toLowerCase() === CaseTypeGroup.PANEL_MEMBER.toLowerCase()) {
            return '';
        }
        const translatedtext = this.getTranslatedText('for');
        const hearingRoleText = this.translateService.instant('hearing-role.' + participant.hearingRole.toLowerCase().split(' ').join('-'));
        return participant.representee ? `<br/>${hearingRoleText} ${translatedtext} ${participant.representee}` : `<br/>${hearingRoleText}`;
    }

    private getCaseRole(participant: PanelModel): string {
        if (!participant.caseTypeGroup) {
            return '';
        }
        const translatedCaseTypeGroup = this.translateService.instant(
            'case-type-group.' + participant.caseTypeGroup.toLowerCase().split(' ').join('-')
        );
        return this.showCaseRole(participant) ? `<br/>${translatedCaseTypeGroup}` : '';
    }

    private showCaseRole(participant: PanelModel) {
        return !(
            participant.caseTypeGroup.toLowerCase() === CaseTypeGroup.NONE.toLowerCase() ||
            participant.caseTypeGroup.toLowerCase() === CaseTypeGroup.OBSERVER.toLowerCase() ||
            participant.caseTypeGroup.toLowerCase() === CaseTypeGroup.JUDGE.toLowerCase() ||
            participant.caseTypeGroup.toLowerCase() === 'endpoint'
        );
    }
}
