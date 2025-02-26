import { Component, EventEmitter, Input, Output, HostListener, ElementRef, OnInit } from '@angular/core';
import { Logger } from 'src/app/services/logging/logger-base';
import { PanelModel } from '../models/panel-model-base';
import {
    ToggleMuteParticipantEvent,
    ToggleSpotlightParticipantEvent,
    LowerParticipantHandEvent,
    CallParticipantIntoHearingEvent,
    DismissParticipantFromHearingEvent,
    ToggleLocalMuteParticipantEvent
} from 'src/app/shared/models/participant-event';
import { HearingRole } from '../models/hearing-role-model';
import { TranslateService } from '@ngx-translate/core';
import { HearingRoleHelper } from 'src/app/shared/helpers/hearing-role-helper';

@Component({
    standalone: false,
    selector: 'app-judge-context-menu',
    templateUrl: './judge-context-menu.component.html',
    styleUrls: ['./judge-context-menu.component.scss']
})
export class JudgeContextMenuComponent implements OnInit {
    @Output() toggleMuteParticipantEvent = new EventEmitter<ToggleMuteParticipantEvent>();
    @Output() toggleSpotlightParticipantEvent = new EventEmitter<ToggleSpotlightParticipantEvent>();
    @Output() lowerParticipantHandEvent = new EventEmitter<LowerParticipantHandEvent>();
    @Output() callParticipantIntoHearingEvent = new EventEmitter<CallParticipantIntoHearingEvent>();
    @Output() dismissParticipantFromHearingEvent = new EventEmitter<DismissParticipantFromHearingEvent>();
    @Output() toggleLocalMuteParticipantEvent = new EventEmitter<ToggleLocalMuteParticipantEvent>();

    idPrefix: string;
    isDroppedDown = false;
    participant: PanelModel;

    private readonly loggerPrefix = '[JudgeContextMenu] -';
    private readonly initialPrefix = 'judge-context-menu';

    constructor(
        private logger: Logger,
        private elementRef: ElementRef,
        protected translateService: TranslateService
    ) {}

    get isJudge(): boolean {
        return this.participant.hearingRole === HearingRole.JUDGE;
    }

    get isWitness(): boolean {
        return this.participant.hearingRole === HearingRole.WITNESS;
    }

    get isPanelMember(): boolean {
        return HearingRoleHelper.isPanelMember(this.participant.hearingRole);
    }

    @Input() set participantInput(participant: PanelModel) {
        this.participant = participant;
    }

    @HostListener('document:click', ['$event'])
    clickout(event: Event) {
        if (this.isClickedOutsideOfOpenMenu(event)) {
            this.logger.debug(`${this.loggerPrefix} Hiding the context menu, click detected outside of this element`, {
                participant: this.participant.id
            });
            this.isDroppedDown = false;
        }
    }
    ngOnInit(): void {
        this.idPrefix = this.participant?.id ? `${this.initialPrefix}-participant-${this.participant.id}` : this.initialPrefix;
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

    toggleLocalMuteParticipant(participant: PanelModel) {
        this.logger.debug(`${this.loggerPrefix} Attempting to toggle local mute`, { participant: participant.id });
        this.toggleLocalMuteParticipantEvent.emit(new ToggleLocalMuteParticipantEvent(participant));
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

    showHearingRole(): boolean {
        return !(this.isJudge || this.isPanelMember);
    }

    getMuteAndLockStatusText(): string {
        return this.participant.isMicRemoteMuted()
            ? this.translateService.instant('judge-context-menu.unmute-lock')
            : this.translateService.instant('judge-context-menu.mute-lock');
    }

    getLocalMuteAStatusText(individualParticipant: PanelModel): string {
        let text = individualParticipant.isLocalMicMuted()
            ? `${this.translateService.instant('judge-context-menu.unmute')}`
            : `${this.translateService.instant('judge-context-menu.mute')}`;
        if (this.participant.participantsList().length > 1) {
            text = text.concat(` ${individualParticipant.displayName}`);
        }
        return text;
    }

    getPinStatusText(): string {
        return this.participant.hasSpotlight()
            ? this.translateService.instant('judge-context-menu.unpin')
            : this.translateService.instant('judge-context-menu.pin');
    }

    canCallParticipantIntoHearing(): boolean {
        return !this.participant.isInHearing();
    }

    canDismissParticipantFromHearing(): boolean {
        return this.participant.isInHearing();
    }
}
