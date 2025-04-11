import { Component, EventEmitter, Input, Output } from '@angular/core';
import { VHConference, VHEndpoint, VHParticipant } from '../store/models/vh-conference';
import { VHHearing } from 'src/app/shared/models/hearing.vh';

@Component({
    selector: 'app-video-call',
    standalone: false,
    templateUrl: './video-call.component.html',
    styleUrls: ['../waiting-room-global-styles.scss', './video-call.component.scss']
})
export class VideoCallComponent {
    @Input() isJohRoom: boolean;
    @Input() canToggleParticipantsPanel: boolean;
    @Input() isPrivateConsultation: boolean;
    @Input() vhParticipant: VHParticipant;
    @Input() hasCaseNameOverflowed: boolean;
    @Input() vhConference: VHConference;
    @Input() connected: boolean;
    @Input() outgoingStream: MediaStream | URL;
    @Input() isSupportedBrowserForNetworkHealth: boolean;
    @Input() showConsultationControls: boolean;
    @Input() isParticipantsPanelHidden: boolean;
    @Input() hearing: VHHearing;
    @Input() participantEndpoints: VHEndpoint[] = [];
    @Input() showVideo: boolean;
    @Input() presentationStream: MediaStream | URL;
    @Input() streamInMain: boolean;
    @Input() callStream: MediaStream | URL;
    @Input() roomName: string;
    @Input() caseNameAndNumber: string;
    @Input() isParticipantsPanelEnabled: boolean;
    @Input() isChatVisible: boolean;

    @Output() ready = new EventEmitter<void>();
    @Output() leaveConsultation = new EventEmitter<void>();
    @Output() consultationLockToggle = new EventEmitter<boolean>();
    @Output() deviceToggle = new EventEmitter<void>();
    @Output() languageChange = new EventEmitter<void>();
    @Output() participantsPanelToggle = new EventEmitter<string>();
    @Output() feedToggle = new EventEmitter<void>();
    @Output() unreadCountUpdate = new EventEmitter<number>();

    videoWrapperReady() {
        this.ready.emit();
    }

    leaveConsultationClicked() {
        this.leaveConsultation.emit();
    }

    lockConsultationClicked(lock: boolean) {
        this.consultationLockToggle.emit(lock);
    }

    changeDeviceToggleClicked() {
        this.deviceToggle.emit();
    }

    changeLanguageSelected() {
        this.languageChange.emit();
    }

    participantsPanelToggled(panelName: string) {
        this.participantsPanelToggle.emit(panelName);
    }

    secondIncomingFeedClicked() {
        this.feedToggle.emit();
    }

    unreadCountUpdated(count: number) {
        this.unreadCountUpdate.emit(count);
    }
}
