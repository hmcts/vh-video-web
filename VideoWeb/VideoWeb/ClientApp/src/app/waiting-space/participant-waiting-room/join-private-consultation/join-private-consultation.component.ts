import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Logger } from 'src/app/services/logging/logger-base';
import { Participant } from 'src/app/shared/models/participant';

@Component({
    selector: 'app-join-private-consultation',
    templateUrl: './join-private-consultation.component.html',
    styleUrls: ['./join-private-consultation.component.scss']
})
export class JoinPrivateConsultationComponent {
    selectedRoomLabel: string;
    @Input() participants: Participant[];
    @Output() continue = new EventEmitter<string>();
    @Output() cancel = new EventEmitter();

    constructor(protected logger: Logger) {}

    roomsAvailable() : boolean {
        return this.participants.some(p => p.base.current_room != null)
    }
    
    getRoomDetails(): Array<any> {        
        let roomDetails = [];
        let rooms = this.participants.filter(p => p.base.current_room != null).map(p => p.base.current_room).sort((a, b) => (a.label > b.label) ? 1 : -1);
        rooms.forEach(r => {
            if (roomDetails.filter(existing =>  existing.label == r.label).length > 0) {
                return;
            }

            let roomParticipants = this.participants
            .filter(p => p.base.current_room?.label == r.label)
            .sort((a, b) => (a.displayName > b.displayName) ? 1 : -1);
            if (roomParticipants.length > 0) {
                let displayName = this.camelToSpaced(
                    r.label.replace('ParticipantConsultationRoom', 'MeetingRoom')
                ).toLowerCase() ;
                roomDetails.push({
                    label: r.label,
                    displayName: displayName,
                    locked: r.locked,
                    participants: roomParticipants});
            }
        })

        return roomDetails;
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
