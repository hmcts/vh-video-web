import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, Observable, Subject } from 'rxjs';
import { ParticipantStatusBaseDirective } from 'src/app/on-the-day/models/participant-status-base';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { Role } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceLite } from 'src/app/services/models/conference-lite';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { Store } from '@ngrx/store';
import { ConferenceState } from '../../waiting-space/store/reducers/conference.reducer';
import * as ConferenceSelectors from '../../waiting-space/store/selectors/conference.selectors';
import { HearingRole } from '../../waiting-space/models/hearing-role-model';
import { filter, takeUntil } from 'rxjs/operators';

@Component({
    standalone: false,
    selector: 'app-introduction',
    templateUrl: './introduction.component.html',
    styleUrls: ['./introduction.component.scss']
})
export class IntroductionComponent extends ParticipantStatusBaseDirective implements OnInit, OnDestroy {
    conferenceId: string;
    conference: ConferenceLite;
    existingTest$: Observable<boolean>;
    isRepresentative: boolean;
    isObserver: boolean;

    private readonly destroy$ = new Subject<void>();

    constructor(
        private router: Router,
        protected route: ActivatedRoute,
        private videoWebService: VideoWebService,
        protected participantStatusUpdateService: ParticipantStatusUpdateService,
        protected logger: Logger,
        private conferenceStore: Store<ConferenceState>
    ) {
        super(participantStatusUpdateService, logger);
    }
    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    ngOnInit() {
        const loggedInParticipant$ = this.conferenceStore.select(ConferenceSelectors.getLoggedInParticipant);
        const getActiveConference = this.conferenceStore.select(ConferenceSelectors.getActiveConference);
        this.existingTest$ = this.videoWebService.checkUserHasCompletedSelfTest();
        combineLatest([loggedInParticipant$, getActiveConference])
            .pipe(
                filter(([loggedInParticipant, activeConference]) => !!loggedInParticipant && !!activeConference),
                takeUntil(this.destroy$)
            )
            .subscribe(([loggedInParticipant, activeConference]) => {
                this.conferenceId = activeConference.id;
                this.isRepresentative = loggedInParticipant.role === Role.Representative;
                this.isObserver =
                    loggedInParticipant.hearingRole === HearingRole.OBSERVER || loggedInParticipant.role === Role.QuickLinkObserver;
            });
    }

    getConference() {
        this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
        this.conference = this.videoWebService.getActiveIndividualConference();
    }

    goToEquipmentCheck() {
        this.router.navigate([pageUrls.EquipmentCheck, this.conferenceId]);
    }

    skipToCourtRulesPage() {
        this.logger.info('Introduction] - Skipping to court rules page', { conferenceId: this.conferenceId });
        this.router.navigate([pageUrls.HearingRules, this.conferenceId]);
    }
}
