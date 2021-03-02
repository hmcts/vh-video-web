import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
    AllowedEndpointResponse,
    EndpointStatus,
    ParticipantResponse,
    ParticipantStatus,
    VideoEndpointResponse
} from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
@Component({
    selector: 'app-start-private-consultation',
    templateUrl: './start-private-consultation.component.html',
    styleUrls: ['./start-private-consultation.component.scss']
})
export class StartPrivateConsultationComponent {
    selectedParticipants = Array<string>();
    selectedEndpoints = Array<string>();
    @Input() participants: ParticipantResponse[];
    @Input() allowedEndpoints: AllowedEndpointResponse[];
    @Input() endpoints: VideoEndpointResponse[];
    @Output() continue = new EventEmitter<{ participants: string[]; endpoints: string[] }>();
    @Output() cancel = new EventEmitter();
    constructor(protected logger: Logger) {}

    participantHearingRoleText(participant: ParticipantResponse): string {
        return participant.representee ? `${participant.hearing_role} for ${participant.representee}` : participant.hearing_role;
    }

    participantSelected(id: string): boolean {
        const index = this.selectedParticipants.indexOf(id);
        return index >= 0;
    }

    toggleParticipant(id: string) {
        const index = this.selectedParticipants.indexOf(id);
        if (index >= 0) {
            this.selectedParticipants.splice(index, 1);
        } else {
            this.selectedParticipants.push(id);
        }
    }

    endpointSelected(id: string): boolean {
        const index = this.selectedEndpoints.indexOf(id);
        return index >= 0;
    }

    toggleEndpoint(id: string) {
        const index = this.selectedEndpoints.indexOf(id);
        if (index >= 0) {
            this.selectedEndpoints.splice(index, 1);
        } else {
            this.selectedEndpoints = [];
            this.selectedEndpoints.push(id);
        }
    }

    onContinue() {
        this.continue.emit({ participants: this.selectedParticipants, endpoints: this.selectedEndpoints });
    }

    onCancel() {
        this.cancel.emit();
    }

    allowedFilter(endpoints: VideoEndpointResponse[]): VideoEndpointResponse[] {
        return endpoints.filter(endpoint => this.allowedEndpoints.some(e => e.id === endpoint.id));
    }

    getEndpointDisabled(endpoint: VideoEndpointResponse): boolean {
        return endpoint.status !== EndpointStatus.Connected && endpoint.status !== EndpointStatus.InConsultation;
    }

    getParticipantDisabled(participant: ParticipantResponse): boolean {
        return participant.status !== ParticipantStatus.Available && participant.status !== ParticipantStatus.InConsultation;
    }

    getEndpointStatusCss(endpoint: VideoEndpointResponse): string {
        if (endpoint.status !== EndpointStatus.Connected && endpoint.status !== EndpointStatus.InConsultation) {
            return 'unavailable';
        } else if (endpoint.status === EndpointStatus.InConsultation) {
            return 'in-consultation';
        }
    }

    getParticipantStatusCss(participant: ParticipantResponse): string {
        if (participant.status !== ParticipantStatus.Available && participant.status !== ParticipantStatus.InConsultation) {
            return 'unavailable';
        } else if (participant.status === ParticipantStatus.InConsultation) {
            return 'in-consultation';
        }
    }

    getShouldDisplayLabel(participant: ParticipantResponse): boolean {
        return this.getParticipantDisabled(participant) || participant.status === ParticipantStatus.InConsultation;
    }

    getParticipantStatus(participant: ParticipantResponse): string {
        if (this.getParticipantDisabled(participant)) {
            return 'Unavailable';
        }
        if (participant.status === ParticipantStatus.InConsultation && participant.current_room != null) {
            return (
                'In ' +
                this.camelToSpaced(
                    participant.current_room.label
                        .replace('ParticipantConsultationRoom', 'MeetingRoom')
                        .replace('JudgeJOHConsultationRoom', 'JudgeRoom')
                ).toLowerCase() +
                (participant.current_room.locked ? ' <span class="fas fa-lock-alt"></span>' : '')
            );
        }
    }

    getEndpointStatus(endpoint: VideoEndpointResponse): string {
        if (this.getEndpointDisabled(endpoint)) {
            return 'Unavailable';
        }
        if (endpoint.status === EndpointStatus.InConsultation && endpoint.current_room != null) {
            return (
                'In ' +
                this.camelToSpaced(endpoint.current_room.label.replace('ParticipantConsultationRoom', 'MeetingRoom')).toLowerCase() +
                (endpoint.current_room.locked ? ' <span class="fas fa-lock-alt"></span>' : '')
            );
        }
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
