import { Component, EventEmitter, Input, Output } from '@angular/core';
import { VHConference, VHEndpoint, VHParticipant } from '../store/models/vh-conference';
import { VHHearing } from 'src/app/shared/models/hearing.vh';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { ParticipantHelper } from 'src/app/shared/participant-helper';

@Component({
    selector: 'app-video-call',
    standalone: false,
    templateUrl: './video-call.component.html',
    styleUrls: ['../waiting-room-global-styles.scss', './video-call.component.scss']
})
export class VideoCallComponent {
    @Input() canToggleParticipantsPanel: boolean;
    @Input() isPrivateConsultation: boolean;
    @Input() vhParticipant: VHParticipant;
    @Input() hasCaseNameOverflowed: boolean;
    @Input() vhConference: VHConference;
    @Input() connected: boolean;
    @Input() outgoingStream: MediaStream | URL;
    @Input() showConsultationControls: boolean;
    @Input() hearing: VHHearing;
    @Input() participantEndpoints: VHEndpoint[] = [];
    @Input() showVideo: boolean;
    @Input() presentationStream: MediaStream | URL;
    @Input() callStream: MediaStream | URL;
    @Input() roomName: string;
    @Input() caseNameAndNumber: string;
    @Input() isParticipantsPanelEnabled: boolean;
    @Input() isIMEnabled: boolean;

    @Output() ready = new EventEmitter<void>();
    @Output() leaveConsultation = new EventEmitter<void>();
    @Output() consultationLockToggle = new EventEmitter<boolean>();
    @Output() deviceToggle = new EventEmitter<void>();
    @Output() languageChange = new EventEmitter<void>();
    @Output() unreadCountUpdate = new EventEmitter<number>();

    streamInMain = false;
    panelTypes = ['Participants', 'Chat'];
    panelStates = {
        Participants: true,
        Chat: false
    };

    constructor(protected deviceTypeService: DeviceTypeService) {}

    get isSupportedBrowserForNetworkHealth(): boolean {
        return this.deviceTypeService.isSupportedBrowserForNetworkHealth();
    }

    get isJohRoom(): boolean {
        return ParticipantHelper.isInJohRoom(this.vhParticipant);
    }

    get userIsHost(): boolean {
        return ParticipantHelper.isHost(this.vhParticipant);
    }

    get isChatVisible() {
        return this.panelStates['Chat'] && this.isIMEnabled;
    }

    get areParticipantsVisible() {
        return this.panelStates['Participants'];
    }

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

    unreadCountUpdated(count: number) {
        this.unreadCountUpdate.emit(count);
    }

    switchStreamWindows() {
        this.streamInMain = !this.streamInMain;
    }

    togglePanel(panelName: string) {
        const newState = !this.panelStates[panelName];
        if (newState) {
            this.panelTypes.forEach(pt => {
                this.panelStates[pt] = false;
            });
        }

        this.panelStates[panelName] = newState;
    }
}
