import { Component, EventEmitter, Input, Output, HostListener, ElementRef } from '@angular/core';
import { Logger } from 'src/app/services/logging/logger-base';
import { PanelModel } from '../models/panel-model-base';
import {
    ToggleMuteParticipantEvent,
    ToggleSpotlightParticipantEvent,
    LowerParticipantHandEvent,
    CallParticipantIntoHearingEvent,
    DismissParticipantFromHearingEvent
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
    @Output() callParticipantIntoHearingEvent = new EventEmitter<CallParticipantIntoHearingEvent>();
    @Output() dismissParticipantFromHearingEvent = new EventEmitter<DismissParticipantFromHearingEvent>();

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

    callParticipantIntoHearing() {
        this.logger.debug(`${this.loggerPrefix} Attempting to call witness`, { participant: this.participant.id });
        this.callParticipantIntoHearingEvent.emit(new CallParticipantIntoHearingEvent(this.participant));
        this.toggleDropdown();
    }

    dismissParticipantFromHearing() {
        this.logger.debug(`${this.loggerPrefix} Attempting to dismiss participant`, { participant: this.participant.id });
        this.dismissParticipantFromHearingEvent.emit(new DismissParticipantFromHearingEvent(this.participant));
        this.toggleDropdown();
    }

    toggleDropdown() {
        this.logger.debug(`${this.loggerPrefix} ${this.isDroppedDown ? 'Hiding the context menu' : 'Showing the context menu'}`, {
            participant: this.participant.id
        });
        this.isDroppedDown = !this.isDroppedDown;
    }

    get isJudge(): boolean {
        return this.participant.hearingRole === HearingRole.JUDGE;
    }

    get isWitness(): boolean {
        return this.participant.hearingRole === HearingRole.WITNESS;
    }

    showCaseRole() {
        return !this.participant.caseTypeGroup ||
            this.participant.caseTypeGroup.toLowerCase() === CaseTypeGroup.NONE.toLowerCase() ||
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
