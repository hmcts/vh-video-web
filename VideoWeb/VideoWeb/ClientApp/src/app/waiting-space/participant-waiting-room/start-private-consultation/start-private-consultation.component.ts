import { Component, EventEmitter, Input, Output, SimpleChange, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import {
    AllowedEndpointResponse,
    EndpointStatus,
    LinkType,
    ParticipantResponse,
    ParticipantStatus,
    VideoEndpointResponse
} from 'src/app/services/clients/api-client';
import { HearingRole } from '../../models/hearing-role-model';

interface ParticipantListItem extends Omit<ParticipantResponse, 'init' | 'toJSON'> {
    interpreter?: ParticipantResponse;
}

@Component({
    selector: 'app-start-private-consultation',
    templateUrl: './start-private-consultation.component.html',
    styleUrls: ['./start-private-consultation.component.scss']
})
export class StartPrivateConsultationComponent {
    selectedParticipants = Array<string>();
    selectedEndpoints = Array<string>();
    @Input() participants: ParticipantResponse[];

    filteredParticipants: ParticipantListItem[] = [];

    @Input() allowedEndpoints: AllowedEndpointResponse[];
    @Input() endpoints: VideoEndpointResponse[];
    @Output() continue = new EventEmitter<{ participants: string[]; endpoints: string[] }>();
    @Output() cancel = new EventEmitter();
    constructor(private translateService: TranslateService, private consultationService: ConsultationService) {}

    ngOnChanges(changes: SimpleChanges) {
        if (changes.participants) {
            this.filteredParticipants = this.mapParticipants(changes.participants.currentValue);
        }
    }

    participantHearingRoleText(participant: ParticipantResponse): string {
        const translatedtext = this.translateService.instant('start-private-consultation.for');
        const hearingRoleText = this.translateService.instant(
            'hearing-role.' + participant.hearing_role.toLowerCase().split(' ').join('-')
        );
        return participant.representee ? `${hearingRoleText} ${translatedtext} ${participant.representee}` : hearingRoleText;
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
            return this.translateService.instant('start-private-consultation.unavailable');
        }
        if (participant.status === ParticipantStatus.InConsultation && participant.current_room != null) {
            return (
                this.translateService.instant('start-private-consultation.in') +
                ' ' +
                this.consultationService.consultationNameToString(participant.current_room.label, false).toLowerCase() +
                (participant.current_room.locked ? ' <span class="fas fa-lock-alt"></span>' : '')
            );
        }
    }

    getEndpointStatus(endpoint: VideoEndpointResponse): string {
        if (this.getEndpointDisabled(endpoint)) {
            return this.translateService.instant('start-private-consultation.unavailable');
        }
        if (endpoint.status === EndpointStatus.InConsultation && endpoint.current_room != null) {
            return (
                this.translateService.instant('start-private-consultation.in') +
                ' ' +
                this.consultationService.consultationNameToString(endpoint.current_room.label, false).toLowerCase() +
                (endpoint.current_room.locked ? ' <span class="fas fa-lock-alt"></span>' : '')
            );
        }
    }

    trackParticipant(index: number, item: ParticipantListItem) {
        return item.status;
    }

    private mapParticipants(participantResponses: ParticipantResponse[]): ParticipantListItem[] {
        return participantResponses
            .filter(p => p.hearing_role !== HearingRole.INTERPRETER && p.hearing_role !== HearingRole.MACKENZIE_FRIEND)
            .map(p => {
                const interpreterLink = p.linked_participants.find(x => x.link_type === LinkType.Interpreter);
                const participant: ParticipantListItem = { ...p };
                if (p.linked_participants && interpreterLink) {
                    participant.interpreter = participantResponses.find(x => x.id === interpreterLink.linked_id);
                }
                return participant;
            });
    }
}
