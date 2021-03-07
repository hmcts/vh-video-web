import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ParticipantResponse, VideoEndpointResponse } from 'src/app/services/clients/api-client';
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
    @Input() endpoints: VideoEndpointResponse[];
    @Output() continue = new EventEmitter<string>();
    @Output() cancel = new EventEmitter();

    constructor(protected logger: Logger, protected translateService: TranslateService) {}

    roomsAvailable(): boolean {
        return this.roomDetails.length > 0;
    }

    getRoomDetails(): Array<any> {
        const currentRooms = this.participants
            .filter(p => p.current_room != null && p.current_room.label.toLowerCase().startsWith('participant'))
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
                // update details
            } else {
                this.roomDetails
                    .filter(rd => rd.label === r.label)
                    .forEach(rd => {
                        const roomParticipants = this.participants
                            .filter(p => p.current_room?.label === r.label)
                            .sort((a, b) => (a.display_name > b.display_name ? 1 : -1));
                        rd.participants = roomParticipants;

                        const roomEndpoints = this.endpoints
                            .filter(p => p.current_room?.label === r.label)
                            .sort((a, b) => (a.display_name > b.display_name ? 1 : -1));
                        rd.endpoints = roomEndpoints;
                        rd.locked = r.locked;
                    });
            }
        });

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

    getParticipantHearingRoleText(participant: ParticipantResponse) {
        const translatedtext = this.translateService.instant('join-private-consultation.for');
        return participant.representee
            ? `${participant.hearing_role} ${translatedtext} ${participant.representee}`
            : participant.hearing_role;
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
