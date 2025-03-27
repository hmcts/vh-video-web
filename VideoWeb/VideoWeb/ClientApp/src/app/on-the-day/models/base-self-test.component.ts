import { OnInit, ViewChild, Directive, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Role } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { vhContactDetails } from 'src/app/shared/contact-information';
import { ConferenceState } from 'src/app/waiting-space/store/reducers/conference.reducer';
import * as ConferenceSelectors from '../../waiting-space/store/selectors/conference.selectors';
import { combineLatest, Subject } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';
import { SelfTestScore, VHConference, VHParticipant } from 'src/app/waiting-space/store/models/vh-conference';
import { SelfTestV2Component } from 'src/app/shared/self-test-v2/self-test-v2.component';
import { AuthActions } from 'src/app/waiting-space/store/actions/auth.actions';

@Directive()
export abstract class BaseSelfTestComponentDirective implements OnInit, OnDestroy {
    @ViewChild(SelfTestV2Component, { static: false })
    selfTestComponent: SelfTestV2Component;

    selfTestScore: SelfTestScore;
    testInProgress: boolean;
    selfTestCompleted = false;
    isStaffMember = false;

    conference: VHConference;
    participant: VHParticipant;

    showEquipmentFaultMessage: boolean;
    contact = {
        phone: vhContactDetails.englandAndWales.phoneNumber
    };

    private readonly loggerPrefix = '[SelfTestBase] -';
    private onDestory$ = new Subject<void>();

    constructor(
        protected conferenceStore: Store<ConferenceState>,
        protected logger: Logger
    ) {
        this.showEquipmentFaultMessage = false;
    }

    ngOnInit() {
        this.conferenceStore.dispatch(AuthActions.loadUserProfile());

        const activeConference$ = this.conferenceStore.select(ConferenceSelectors.getActiveConference);
        const loggedInParticipant$ = this.conferenceStore.select(ConferenceSelectors.getLoggedInParticipant);
        combineLatest([activeConference$, loggedInParticipant$])
            .pipe(
                filter(([activeConference, participant]) => !!activeConference && !!participant),
                take(1)
            )
            .subscribe(([conf, participant]) => {
                this.conference = conf;
                this.participant = participant;
                this.isStaffMember = this.participant.role === Role.StaffMember;
            });

        this.conferenceStore
            .select(ConferenceSelectors.getUserProfile)
            .pipe(
                takeUntil(this.onDestory$),
                filter(profile => !!profile)
            )
            .subscribe(profile => {
                this.isStaffMember = profile.roles.includes(Role.StaffMember);
            });

        this.conferenceStore
            .select(ConferenceSelectors.getSelfTestScore)
            .pipe(
                takeUntil(this.onDestory$),
                filter(score => !!score)
            )
            .subscribe(selfTestScore => {
                this.selfTestCompleted = true;
                this.selfTestScore = selfTestScore;
                this.logger.debug(`${this.loggerPrefix} Self test score received`, { selfTestScore });
            });
        this.testInProgress = false;
    }

    ngOnDestroy(): void {
        this.onDestory$.next();
        this.onDestory$.complete();
    }

    onTestStarted() {
        this.testInProgress = true;
        this.selfTestCompleted = false;
    }

    restartTest() {
        this.logger.debug(`${this.loggerPrefix} restarting self test`);
        this.testInProgress = false;
    }

    onSelfTestCompleted(): void {
        this.testInProgress = false;
    }
}
