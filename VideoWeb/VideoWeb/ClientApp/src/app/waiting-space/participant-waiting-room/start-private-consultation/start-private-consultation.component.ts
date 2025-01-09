import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { EndpointStatus, LinkType, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { HearingRole } from '../../models/hearing-role-model';
import { ParticipantListItem } from '../participant-list-item';
import { VHEndpoint, VHParticipant } from '../../store/models/vh-conference';
@Component({
    selector: 'app-start-private-consultation',
    templateUrl: './start-private-consultation.component.html',
    styleUrls: ['./start-private-consultation.component.scss']
})
export class StartPrivateConsultationComponent implements OnChanges {
    @Input() loggedInUser: VHParticipant;
    @Input() participants: VHParticipant[] = [];
    @Input() allowedEndpoints: VHEndpoint[];
    @Input() endpoints: VHEndpoint[];
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

    participantHearingRoleText(participant: VHParticipant): string {
        const translatedtext = this.translateService.instant('start-private-consultation.for');
        const hearingRoleText = this.translateService.instant('hearing-role.' + participant.hearingRole.toLowerCase().split(' ').join('-'));
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

    allowedFilter(endpoints: VHEndpoint[]): VHEndpoint[] {
        return endpoints.filter(endpoint => this.allowedEndpoints.some(e => e.id === endpoint.id));
    }

    getEndpointDisabled(endpoint: VHEndpoint): boolean {
        return endpoint.status !== EndpointStatus.Connected && endpoint.status !== EndpointStatus.InConsultation;
    }

    getParticipantDisabled(participant: VHParticipant): boolean {
        const someLinkedParticipantsUnavailable = participant.linkedParticipants?.some(lp => {
            const p = this.getParticipantFromLinkedParticipant(lp.linkedId);
            return p.status !== ParticipantStatus.Available && p.status !== ParticipantStatus.InConsultation;
        });

        return (
            someLinkedParticipantsUnavailable ||
            (participant.status !== ParticipantStatus.Available && participant.status !== ParticipantStatus.InConsultation)
        );
    }

    getEndpointStatusCss(endpoint: VHEndpoint): string {
        if (endpoint.status !== EndpointStatus.Connected && endpoint.status !== EndpointStatus.InConsultation) {
            return 'unavailable';
        } else if (endpoint.status === EndpointStatus.InConsultation) {
            return 'in-consultation';
        }
    }

    getParticipantStatusCss(participant: VHParticipant): string {
        if (this.getParticipantDisabled(participant)) {
            return 'unavailable';
        } else if (participant.status === ParticipantStatus.InConsultation) {
            return 'in-consultation';
        }
    }

    participantIsInConsultationRoom(participant: VHParticipant): boolean {
        return participant.status === ParticipantStatus.InConsultation && participant.room != null;
    }

    endpointIsInConsultationRoom(endpoint: VHEndpoint): boolean {
        return endpoint.status === EndpointStatus.InConsultation && endpoint.room != null;
    }

    trackParticipant(index: number, item: ParticipantListItem) {
        return item.status;
    }

    private mapParticipants(participantResponses: VHParticipant[]): ParticipantListItem[] {
        return participantResponses
            .filter(
                p =>
                    p.hearingRole !== HearingRole.INTERPRETER &&
                    p.hearingRole !== HearingRole.MACKENZIE_FRIEND &&
                    p.role !== Role.QuickLinkObserver &&
                    p.hearingRole !== HearingRole.VICTIM &&
                    p.hearingRole !== HearingRole.POLICE
            )
            .map(p => {
                const interpreterLink = p.linkedParticipants.find(x => x.linkedType === LinkType.Interpreter);
                const participant: ParticipantListItem = p;
                if (p.linkedParticipants && interpreterLink) {
                    const pat = this.getParticipantFromLinkedParticipant(interpreterLink.linkedId);
                    participant.interpreter = pat ?? null;
                }
                return participant;
            });
    }

    private getParticipantFromLinkedParticipant(linkedId: string) {
        return this.participants.find(x => x.id === linkedId);
    }
}
