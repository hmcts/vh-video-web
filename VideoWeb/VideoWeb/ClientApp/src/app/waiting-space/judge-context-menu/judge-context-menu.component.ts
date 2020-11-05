import { Component, EventEmitter, Input, Output, HostListener, ElementRef } from '@angular/core';
import { Logger } from 'src/app/services/logging/logger-base';
import { PanelModel } from '../models/participant-panel-model';
import {
    ToggleMuteParticipantEvent,
    ToggleSpotlightParticipantEvent,
    LowerParticipantHandEvent,
    CallWitnessIntoHearingEvent
} from 'src/app/shared/models/participant-event';
import { HearingRole } from '../models/hearing-role-model';
import { CaseTypeGroup } from '../models/case-type-group';

@Component({
    selector: 'app-judge-context-menu',
    templateUrl: './judge-context-menu.component.html',
    styleUrls: ['./judge-context-menu.component.scss']
})
export class JudgeContextMenuComponent {
    private readonly loggerPrefix = '[JudgeContextMenu] -';
    participant: PanelModel;
    isDroppedDown = false;

    @Input() set participantInput(participant: PanelModel) {
        this.participant = participant;
    }

    @Output() toggleMuteParticipantEvent = new EventEmitter<ToggleMuteParticipantEvent>();
    @Output() toggleSpotlightParticipantEvent = new EventEmitter<ToggleSpotlightParticipantEvent>();
    @Output() lowerParticipantHandEvent = new EventEmitter<LowerParticipantHandEvent>();
    @Output() callWitnessIntoHearingEvent = new EventEmitter<CallWitnessIntoHearingEvent>();

    constructor(private logger: Logger, private elementRef: ElementRef) {}

    @HostListener('document:click', ['$event'])
    clickout(event) {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.isDroppedDown = false;
        }
    }

    lowerParticipantHand() {
        this.logger.debug(`${this.loggerPrefix} Attempting to lower hand`, { participant: this.participant.id });
        this.lowerParticipantHandEvent.emit(new LowerParticipantHandEvent(this.participant));
    }
    toggleSpotlightParticipant() {
        this.logger.debug(`${this.loggerPrefix} Attempting to toggle spotlight`, { participant: this.participant.id });
        this.toggleSpotlightParticipantEvent.emit(new ToggleSpotlightParticipantEvent(this.participant));
    }

    toggleMuteParticipant() {
        this.logger.debug(`${this.loggerPrefix} Attempting to toggle mute`, { participant: this.participant.id });
        this.toggleMuteParticipantEvent.emit(new ToggleMuteParticipantEvent(this.participant));
    }

    callWitnessIntoHearing() {
        this.logger.debug(`${this.loggerPrefix} Attempting to call witness`, { participant: this.participant.id });
        this.callWitnessIntoHearingEvent.emit(new CallWitnessIntoHearingEvent(this.participant));
    }

    toggleDropdown() {
        this.isDroppedDown = !this.isDroppedDown;
    }

    getAdditionalText(): string {
        return this.participant.hearingRole !== HearingRole.JUDGE ? this.getHearingRole() + this.getCaseRole() : '';
    }

    private getHearingRole(): string {
        return this.participant.representee
            ? `<br/>${this.participant.hearingRole} for ${this.participant.representee}`
            : `<br/>${this.participant.hearingRole}`;
    }

    private getCaseRole(): string {
        return this.showCaseRole() ? `<br/>${this.participant.caseTypeGroup}` : '';
    }

    private showCaseRole() {
        return this.participant.caseTypeGroup.toLowerCase() === CaseTypeGroup.NONE.toLowerCase() ||
            this.participant.caseTypeGroup.toLowerCase() === CaseTypeGroup.OBSERVER.toLowerCase() ||
            this.participant.caseTypeGroup.toLowerCase() === CaseTypeGroup.PANEL_MEMBER.toLowerCase() ||
            this.participant.caseTypeGroup.toLowerCase() === CaseTypeGroup.JUDGE.toLowerCase() ||
            this.participant.caseTypeGroup.toLowerCase() === 'endpoint'
            ? false
            : true;
    }
}
