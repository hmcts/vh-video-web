import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ParticipantResponse, ParticipantStatus } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { WRParticipantStatusListDirective } from '../waiting-room-shared/wr-participant-list-shared.component';
import { FocusService } from 'src/app/services/focus.service';

@Component({
    selector: 'app-individual-participant-status-list',
    templateUrl: './individual-participant-status-list.component.html',
    styleUrls: ['./individual-participant-status-list.component.scss']
})
export class IndividualParticipantStatusListComponent extends WRParticipantStatusListDirective implements OnInit, OnDestroy {
    ParticipantStatus = ParticipantStatus;
    wingers: ParticipantResponse[];
    hearingVenueIsInScotland$: Observable<boolean>;

    constructor(
        protected consultationService: ConsultationService,
        protected eventService: EventsService,
        protected logger: Logger,
        protected videoWebService: VideoWebService,
        protected route: ActivatedRoute,
        protected translateService: TranslateService,
        protected focusService: FocusService
    ) {
        super(consultationService, eventService, videoWebService, logger, translateService, focusService);
    }

    ngOnInit() {
        this.loggedInUser = this.route.snapshot.data['loggedUser'];
        this.initParticipants();
        this.addSharedEventHubSubcribers();
    }

    ngOnDestroy(): void {
        this.executeTeardown();
    }

    getParticipantStatusText(participant: ParticipantResponse): string {
        return participant.status === ParticipantStatus.Available
            ? this.translateService.instant('individual-participant-status-list.available')
            : this.translateService.instant('individual-participant-status-list.unavailable');
    }

    getParticipantStatusCss(participant: ParticipantResponse): string {
        if (
            (participant.status !== ParticipantStatus.Available && participant.status !== ParticipantStatus.InConsultation) ||
            this.hasUnavailableLinkedParticipants(participant)
        ) {
            return 'unavailable';
        }

        if (participant.status === ParticipantStatus.Available) {
            return 'available';
        }

        if (participant.status === ParticipantStatus.InConsultation) {
            return 'in-consultation';
        }
    }

    getParticipantStatus(participant: ParticipantResponse): ParticipantStatus {
        if (this.hasUnavailableLinkedParticipants(participant)) {
            return null;
        }

        return participant.status;
    }

    isLoggedInParticipant(participant: ParticipantResponse) {
        return participant.id === this.loggedInUser.participant_id;
    }

    private hasUnavailableLinkedParticipants(participant: ParticipantResponse) {
        if (participant.linked_participants.length) {
            return participant.linked_participants.some(lp => {
                const linkedParticipant = this.nonJudgeParticipants.find(p => p.id === lp.linked_id);
                return (
                    linkedParticipant &&
                    linkedParticipant.status !== ParticipantStatus.Available &&
                    linkedParticipant.status !== ParticipantStatus.InConsultation
                );
            });
        }
        return false;
    }
}
