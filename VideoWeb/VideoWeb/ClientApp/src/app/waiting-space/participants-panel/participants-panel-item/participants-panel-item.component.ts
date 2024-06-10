import { Component, Input } from '@angular/core';
import { PanelModel } from '../../models/panel-model-base';
import { HearingRole } from '../../models/hearing-role-model';
import { TranslateService } from '@ngx-translate/core';
import { CaseTypeGroup } from '../../models/case-type-group';
import { LinkedParticipantPanelModel } from '../../models/linked-participant-panel-model';
import { VideoEndpointPanelModel } from '../../models/video-endpoint-panel-model';
import { ParticipantResponse } from 'src/app/services/clients/api-client';
import { ParticipantPanelModel } from '../../models/participant-panel-model';

@Component({
    selector: 'app-participants-panel-item',
    templateUrl: './participants-panel-item.component.html',
    styleUrl: './participants-panel-item.component.scss'
})
export class ParticipantsPanelItemComponent {
    @Input() participant: PanelModel;

    readonly idPrefix = 'participants-panel';

    constructor(private translateService: TranslateService) {}

    private static showCaseRole(participant: PanelModel) {
        return !(
            participant.caseTypeGroup.toLowerCase() === CaseTypeGroup.NONE.toLowerCase() ||
            participant.caseTypeGroup.toLowerCase() === CaseTypeGroup.OBSERVER.toLowerCase() ||
            participant.caseTypeGroup.toLowerCase() === CaseTypeGroup.JUDGE.toLowerCase() ||
            participant.caseTypeGroup.toLowerCase() === 'endpoint'
        );
    }

    // private static updateParticipant(participant: PanelModel, participantToBeUpdated: PanelModel) {
    //     participant.updateParticipant(
    //         participantToBeUpdated?.isMicRemoteMuted(),
    //         participantToBeUpdated?.hasHandRaised(),
    //         participantToBeUpdated?.hasSpotlight(),
    //         participantToBeUpdated?.id,
    //         participantToBeUpdated?.isLocalMicMuted(),
    //         participantToBeUpdated?.isLocalCameraOff()
    //     );
    //     participant.assignPexipId(participantToBeUpdated?.pexipId);
    // }

    isParticipantDisconnected(participant: PanelModel): boolean {
        return participant.isDisconnected();
    }

    isEndpoint(participant: PanelModel) {
        return participant instanceof VideoEndpointPanelModel;
    }

    isParticipantInHearing(participant: PanelModel): boolean {
        return participant.isInHearing();
    }

    isLinkedParticipantAndAnInterpreter(participant: PanelModel) {
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

    isWitness(participant: PanelModel) {
        return participant.isWitness;
    }

    toggleSpotlightParticipant() {
        //TODO: Implement this with emitter
    }

    toggleMuteParticipant() {
        //TODO: Implement this with emitter
    }

    lowerParticipantHand() {
        //TODO: Implement this with emitter
    }

    lowerLinkedParticipantHand() {
        //TODO: Implement this with emitter
    }

    callParticipantIntoHearing() {
        //TODO: Implement this with emitter
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
        return ParticipantsPanelItemComponent.showCaseRole(participant) ? `<br/>${translatedCaseTypeGroup}` : '';
    }
}
