import { Component, EventEmitter, Input, Output, HostListener, ElementRef } from '@angular/core';
import { Logger } from 'src/app/services/logging/logger-base';
import { PanelModel } from '../models/panel-model-base';
import {
    ToggleMuteParticipantEvent,
    ToggleSpotlightParticipantEvent,
    LowerParticipantHandEvent,
    CallWitnessIntoHearingEvent,
    DismissWitnessFromHearingEvent
} from 'src/app/shared/models/participant-event';
import { HearingRole } from '../models/hearing-role-model';
import { CaseTypeGroup } from '../models/case-type-group';
import { TranslateService } from '@ngx-translate/core';

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
    @Output() dismissWitnessFromHearingEvent = new EventEmitter<DismissWitnessFromHearingEvent>();

    constructor(private logger: Logger, private elementRef: ElementRef, protected translateService: TranslateService) {}

    @HostListener('document:click', ['$event'])
    clickout(event: Event) {
        if (this.isClickedOutsideOfOpenMenu(event)) {
            this.logger.debug(`${this.loggerPrefix} Hiding the context menu, click detected outside of this element`, {
                participant: this.participant.id
            });
            this.isDroppedDown = false;
        }
    }

    isClickedOutsideOfOpenMenu(event: Event) {
        const outsideElement = !this.elementRef.nativeElement.contains(event.target);
        return outsideElement && this.isDroppedDown;
    }

    lowerParticipantHand() {
        this.logger.debug(`${this.loggerPrefix} Attempting to lower hand`, { participant: this.participant.id });
        this.lowerParticipantHandEvent.emit(new LowerParticipantHandEvent(this.participant));
        this.toggleDropdown();
    }
    toggleSpotlightParticipant() {
        this.logger.debug(`${this.loggerPrefix} Attempting to toggle spotlight`, { participant: this.participant.id });
        this.toggleSpotlightParticipantEvent.emit(new ToggleSpotlightParticipantEvent(this.participant));
        this.toggleDropdown();
    }

    toggleMuteParticipant() {
        this.logger.debug(`${this.loggerPrefix} Attempting to toggle mute`, { participant: this.participant.id });
        this.toggleMuteParticipantEvent.emit(new ToggleMuteParticipantEvent(this.participant));
        this.toggleDropdown();
    }

    callWitnessIntoHearing() {
        this.logger.debug(`${this.loggerPrefix} Attempting to call witness`, { participant: this.participant.id });
        this.callWitnessIntoHearingEvent.emit(new CallWitnessIntoHearingEvent(this.participant));
        this.toggleDropdown();
    }

    dismissWitnessFromHearing() {
        this.logger.debug(`${this.loggerPrefix} Attempting to dismiss witness`, { participant: this.participant.id });
        this.dismissWitnessFromHearingEvent.emit(new DismissWitnessFromHearingEvent(this.participant));
        this.toggleDropdown();
    }

    toggleDropdown() {
        this.logger.debug(`${this.loggerPrefix} ${this.isDroppedDown ? 'Hiding the context menu' : 'Showing the context menu'}`, {
            participant: this.participant.id
        });
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

    getMutedStatusText(): string {
        return this.participant.isMicRemoteMuted()
            ? this.translateService.instant('judge-context-menu.unmute')
            : this.translateService.instant('judge-context-menu.mute');
    }

    getPinStatusText(): string {
        return this.participant.hasSpotlight()
            ? this.translateService.instant('judge-context-menu.unpin')
            : this.translateService.instant('judge-context-menu.pin');
    }

    canCallParticipantIntoHearing(): boolean {
        return (this.participant.isWitness || this.participant.isQuickLinkUser) && !this.participant.isInHearing();
    }

    canDismissParticipantFromHearing(): boolean {
        return (this.participant.isWitness || this.participant.isQuickLinkUser) && this.participant.isInHearing();
    }
}
