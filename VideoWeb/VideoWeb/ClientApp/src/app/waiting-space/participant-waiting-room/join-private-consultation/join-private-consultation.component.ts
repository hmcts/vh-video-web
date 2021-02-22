import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ParticipantResponse } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';

@Component({
    selector: 'app-join-private-consultation',
    templateUrl: './join-private-consultation.component.html',
    styleUrls: ['./join-private-consultation.component.scss']
})
export class JoinPrivateConsultationComponent {
    selectedRoomLabel: string;
    roomDetails = [];
    @Input() participants: ParticipantResponse[];
    @Output() continue = new EventEmitter<string>();
    @Output() cancel = new EventEmitter();

    constructor(protected logger: Logger) {}

    roomsAvailable(): boolean {
        return this.participants.some(p => p.current_room != null);
    }

    getRoomDetails(): Array<any> {
        const currentRooms = this.participants
            .filter(p => p.current_room != null)
            .map(p => p.current_room)
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
                const roomParticipants = this.participants
                    .filter(p => p.current_room?.label === r.label)
                    .sort((a, b) => (a.display_name > b.display_name ? 1 : -1));
                this.roomDetails.push({
                    label: r.label,
                    displayName: displayName,
                    locked: r.locked,
                    participants: roomParticipants
                });
                // update participants
            } else {
                this.roomDetails
                    .filter(rd => rd.label === r.label)
                    .forEach(rd => {
                        const roomParticipants = this.participants
                            .filter(p => p.current_room?.label === r.label)
                            .sort((a, b) => (a.display_name > b.display_name ? 1 : -1));
                        rd.participants = roomParticipants;
                    });
            }
        });

        return this.roomDetails;
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

    getParticipantHearingRoleText(participant: ParticipantResponse) {
        return participant.representee ? `${participant.hearing_role} for ${participant.representee}` : participant.hearing_role;
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
