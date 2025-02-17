import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Logger } from 'src/app/services/logging/logger-base';
import { VHEndpoint, VHParticipant } from '../../store/models/vh-conference';

@Component({
    standalone: false,
    selector: 'app-join-private-consultation',
    templateUrl: './join-private-consultation.component.html',
    styleUrls: ['./join-private-consultation.component.scss']
})
export class JoinPrivateConsultationComponent {
    @Output() continue = new EventEmitter<string>();
    @Output() cancel = new EventEmitter();

    selectedRoomLabel: string;
    roomDetails = [];

    private _participants: VHParticipant[] = [];
    private _endpoints: VHEndpoint[] = [];

    constructor(
        protected logger: Logger,
        protected translateService: TranslateService
    ) {}

    @Input() set participants(val: VHParticipant[]) {
        this._participants = val;
        this.updateRoomDetails();
    }

    @Input() set endpoints(val: VHEndpoint[]) {
        this._endpoints = val;
        this.updateRoomDetails();
    }

    roomsAvailable(): boolean {
        return this.roomDetails.length > 0;
    }

    updateRoomDetails() {
        const currentRooms = this._participants
            .filter(p => p.room?.label.toLowerCase().startsWith('participant'))
            .map(p => p.room)
            .sort((a, b) => (a.label > b.label ? 1 : -1));

        // remove all rooms that are no longer there
        this.roomDetails.forEach(rd => {
            if (currentRooms.filter(cr => rd.label === cr.label).length === 0) {
                this.roomDetails.splice(
                    this.roomDetails.indexOf(r => rd.label === r.label),
                    1
                );
            }
        });

        currentRooms.forEach(r => {
            // add any new rooms
            if (this.roomDetails.filter(rd => r.label === rd.label).length === 0) {
                const displayName = !r.label
                    ? ''
                    : this.camelToSpaced(r.label.replace('ParticipantConsultationRoom', 'MeetingRoom')).toLowerCase();
                const roomParticipants = this._participants
                    .filter(p => p.room?.label === r.label)
                    .sort((a, b) => (a.displayName > b.displayName ? 1 : -1));
                this.roomDetails.push({
                    label: r.label,
                    displayName: displayName,
                    locked: r.locked,
                    participants: roomParticipants
                });
                // update details
            } else {
                this.roomDetails
                    .filter(rd => rd.label === r.label)
                    .forEach(rd => {
                        const roomParticipants = this._participants
                            .filter(p => p.room?.label === r.label)
                            .sort((a, b) => (a.displayName > b.displayName ? 1 : -1));
                        rd.participants = roomParticipants;

                        const roomEndpoints = this._endpoints
                            .filter(p => p.room?.label === r.label)
                            .sort((a, b) => (a.displayName > b.displayName ? 1 : -1));
                        rd.endpoints = roomEndpoints;
                        rd.locked = r.locked;
                    });
            }
        });
    }

    getRoomDetails(): Array<any> {
        return this.roomDetails;
    }

    continueDisabled(): boolean {
        if (this.roomDetails.find(r => r.label === this.selectedRoomLabel)?.locked) {
            this.selectedRoomLabel = null;
        }

        return !this.selectedRoomLabel;
    }

    onContinue() {
        this.continue.emit(this.selectedRoomLabel);
    }

    onCancel() {
        this.cancel.emit();
    }

    setSelectedRoom(roomLabel: string) {
        this.selectedRoomLabel = roomLabel;
    }

    getParticipantHearingRoleText(participant: VHParticipant) {
        const translatedtext = this.translateService.instant('join-private-consultation.for');
        const hearingRoleText = this.translateService.instant('hearing-role.' + participant.hearingRole.toLowerCase().split(' ').join('-'));
        return participant.representee ? `${hearingRoleText} ${translatedtext} ${participant.representee}` : hearingRoleText;
    }

    protected camelToSpaced(word: string) {
        const splitWord = word
            .match(/[a-z]+|[^a-z]+/gi)
            .join(' ')
            .split(/(?=[A-Z])/)
            .join(' ');
        const lowcaseWord = splitWord.toLowerCase();
        return lowcaseWord.charAt(0).toUpperCase() + lowcaseWord.slice(1);
    }
}
