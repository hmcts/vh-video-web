import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PanelModel } from '../../models/panel-model-base';
import { HearingRole } from '../../models/hearing-role-model';
import { TranslateService } from '@ngx-translate/core';
import { LinkedParticipantPanelModel } from '../../models/linked-participant-panel-model';
import { VideoEndpointPanelModel } from '../../models/video-endpoint-panel-model';
import { ParticipantResponse } from 'src/app/services/clients/api-client';
import { ParticipantPanelModel } from '../../models/participant-panel-model';
import {
    CallParticipantIntoHearingEvent,
    DismissParticipantFromHearingEvent,
    LowerParticipantHandEvent,
    ToggleLocalMuteParticipantEvent,
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

    isJudge = false;
    isHost = false;
    isEndpoint = false;
    isJudicialOfficeHolder = false;
    isWitness = false;

    constructor(private translateService: TranslateService) {}

    @Input() set item(value: PanelModel) {
        this.participant = value;
        this.isJudge = value.hearingRole === HearingRole.JUDGE;
        this.isHost = value.isHost;
        this.isEndpoint = this.isItemAnEndpoint();
        this.isJudicialOfficeHolder = value.isJudicialOfficeHolder;
        this.isWitness = value.isWitness;
    }

    isLinkedParticipantAndAnInterpreter() {
        if (!(this.participant instanceof LinkedParticipantPanelModel)) {
            return false;
        }
        return this.participant.participants.some(x => x.hearingRole === HearingRole.INTERPRETER);
    }

    getPanelRowTooltipText() {
        let toolTipText = this.participant.displayName + this.getAdditionalText();

        if (!this.participant.isDisconnected() && !this.participant.isInHearing()) {
            toolTipText = this.participant.displayName + ': ' + this.getTranslatedText('not-joined') + this.getAdditionalText();
        }
        if (this.participant.isAvailable()) {
            toolTipText = this.participant.displayName + ': ' + this.getTranslatedText('joining') + this.getAdditionalText();
        }
        if (this.participant.isWitness && this.participant.isAvailable() && !this.participant.isInHearing()) {
            toolTipText = this.participant.displayName + ': ' + this.getTranslatedText('participant-available') + this.getAdditionalText();
        }
        if (this.participant.isDisconnected()) {
            toolTipText = this.participant.displayName + ': ' + this.getTranslatedText('disconnected') + this.getAdditionalText();
        }

        return toolTipText;
    }

    getPanelRowTooltipColour() {
        if (this.participant.isDisconnected()) {
            return 'red';
        } else if (this.participant.isAvailable() || this.participant.isInHearing()) {
            return 'blue';
        } else {
            return 'grey';
        }
    }

    toggleParticipantSpotlight() {
        this.participantSpotlightToggled.emit({ participant: this.participant });
    }

    toggleParticipantMute() {
        this.participantMuteToggled.emit({ participant: this.participant });
    }

    toggleParticipantLocalMute() {
        this.participantLocalMuteToggled.emit({ participant: this.participant });
    }

    lowerParticipantHand() {
        this.participantHandLowered.emit({ participant: this.participant });
    }

    callParticipantIntoHearing() {
        this.participantAdmitted.emit({ participant: this.participant });
    }

    dismissParticipantFromHearing() {
        this.participantDismissed.emit({ participant: this.participant });
    }

    mapParticipantToParticipantResponse(): ParticipantResponse {
        const participantModelTyped = this.participant as ParticipantPanelModel;
        const participantResponse = new ParticipantResponse();
        participantResponse.id = participantModelTyped.id;
        participantResponse.status = participantModelTyped.status;
        participantResponse.display_name = participantModelTyped.displayName;
        participantResponse.role = participantModelTyped.role;
        participantResponse.hearing_role = participantModelTyped.hearingRole;
        participantResponse.representee = participantModelTyped.representee;
        return participantResponse;
    }

    private getAdditionalText(): string {
        return this.participant.hearingRole !== HearingRole.JUDGE ? this.getHearingRole() : '';
    }

    private getTranslatedText(key: string): string {
        return this.translateService.instant(`participants-panel.${key}`);
    }

    private isItemAnEndpoint() {
        return this.participant instanceof VideoEndpointPanelModel;
    }

    private getHearingRole(): string {
        if (this.participant.hearingRole === HearingRole.PANEL_MEMBER) {
            return '';
        }
        const translatedtext = this.getTranslatedText('for');
        const hearingRoleText = this.translateService.instant(
            'hearing-role.' + this.participant.hearingRole.toLowerCase().split(' ').join('-')
        );
        return this.participant.representee
            ? `<br/>${hearingRoleText} ${translatedtext} ${this.participant.representee}`
            : `<br/>${hearingRoleText}`;
    }
}
