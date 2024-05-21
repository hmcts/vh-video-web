import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
    AllowedEndpointResponse,
    EndpointStatus,
    LinkedParticipantResponse,
    LinkType,
    LoggedParticipantResponse,
    ParticipantResponse,
    ParticipantStatus,
    Role,
    VideoEndpointResponse
} from 'src/app/services/clients/api-client';
import { HearingRole } from '../../models/hearing-role-model';
import { ParticipantListItem } from '../participant-list-item';
import { mapParticipantToVHParticipant } from '../../store/models/api-contract-to-state-model-mappers';
import { map } from 'rxjs/operators';
@Component({
    selector: 'app-start-private-consultation',
    templateUrl: './start-private-consultation.component.html',
    styleUrls: ['./start-private-consultation.component.scss']
})
export class StartPrivateConsultationComponent implements OnChanges {
    @Input() loggedInUser: LoggedParticipantResponse;
    @Input() participants: ParticipantResponse[] = [];
    @Input() allowedEndpoints: AllowedEndpointResponse[];
    @Input() endpoints: VideoEndpointResponse[];
    @Output() continue = new EventEmitter<{ participants: string[]; endpoints: string[] }>();
    @Output() cancel = new EventEmitter();

    selectedParticipants = Array<string>();
    selectedEndpoints = Array<string>();

    filteredParticipants: ParticipantListItem[] = [];
    displayTermsOfService = false;

    constructor(private translateService: TranslateService) {}

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
        if (this.loggedInUser.role === Role.Representative && this.selectedEndpoints?.length > 0) {
            this.displayTermsOfService = true;
            return;
        }
        this.continue.emit({ participants: this.selectedParticipants, endpoints: this.selectedEndpoints });
    }

    onTermsOfServiceAccepted() {
        this.displayTermsOfService = false;
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
        const someLinkedParticipantsUnavailable = participant.linked_participants?.some(lp => {
            const p = this.getParticipantFromLinkedParticipant(lp);
            return p.status !== ParticipantStatus.Available && p.status !== ParticipantStatus.InConsultation;
        });

        return (
            someLinkedParticipantsUnavailable ||
            (participant.status !== ParticipantStatus.Available && participant.status !== ParticipantStatus.InConsultation)
        );
    }

    getEndpointStatusCss(endpoint: VideoEndpointResponse): string {
        if (endpoint.status !== EndpointStatus.Connected && endpoint.status !== EndpointStatus.InConsultation) {
            return 'unavailable';
        } else if (endpoint.status === EndpointStatus.InConsultation) {
            return 'in-consultation';
        }
    }

    getParticipantStatusCss(participant: ParticipantResponse): string {
        if (this.getParticipantDisabled(participant)) {
            return 'unavailable';
        } else if (participant.status === ParticipantStatus.InConsultation) {
            return 'in-consultation';
        }
    }

    participantIsInConsultationRoom(participant: ParticipantResponse): boolean {
        return participant.status === ParticipantStatus.InConsultation && participant.current_room != null;
    }

    endpointIsInConsultationRoom(endpoint: VideoEndpointResponse): boolean {
        return endpoint.status === EndpointStatus.InConsultation && endpoint.current_room != null;
    }

    trackParticipant(index: number, item: ParticipantListItem) {
        return item.status;
    }

    private mapParticipants(participantResponses: ParticipantResponse[]): ParticipantListItem[] {
        return participantResponses
            .filter(
                p =>
                    p.hearing_role !== HearingRole.INTERPRETER &&
                    p.hearing_role !== HearingRole.MACKENZIE_FRIEND &&
                    p.role !== Role.QuickLinkObserver &&
                    p.hearing_role !== HearingRole.VICTIM &&
                    p.hearing_role !== HearingRole.POLICE
            )
            .map(p => {
                const interpreterLink = p.linked_participants.find(x => x.link_type === LinkType.Interpreter);
                const participant: ParticipantListItem = mapParticipantToVHParticipant(p);
                if (p.linked_participants && interpreterLink) {
                    const pat = this.getParticipantFromLinkedParticipant(interpreterLink);
                    participant.interpreter = pat ? mapParticipantToVHParticipant(pat) : null;
                }
                return participant;
            });
    }

    private getParticipantFromLinkedParticipant(linkedParticipant: LinkedParticipantResponse) {
        return this.participants.find(x => x.id === linkedParticipant.linked_id);
    }
}
