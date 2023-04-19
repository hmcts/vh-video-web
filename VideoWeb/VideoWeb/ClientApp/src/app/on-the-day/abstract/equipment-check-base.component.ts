import { AbstractControl, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { AddSelfTestFailureEventRequest, SelfTestFailureReason } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceLite } from 'src/app/services/models/conference-lite';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ParticipantStatusBaseDirective } from 'src/app/on-the-day/models/participant-status-base';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';
import { Directive } from '@angular/core';
import { SessionStorage } from 'src/app/services/session-storage';
import { VhoStorageKeys } from 'src/app/vh-officer/services/models/session-keys';

@Directive()
export abstract class EquipmentCheckBaseComponentDirective extends ParticipantStatusBaseDirective {
    form: UntypedFormGroup;
    submitted = false;

    conferenceId: string;
    conference: ConferenceLite;
    participantId: string;
    participantName: string;
    sessionStorage = new SessionStorage<boolean>(VhoStorageKeys.EQUIPMENT_SELF_TEST_KEY);

    constructor(
        protected router: Router,
        protected route: ActivatedRoute,
        protected fb: UntypedFormBuilder,
        protected videoWebService: VideoWebService,
        protected errorService: ErrorService,
        protected logger: Logger,
        protected participantStatusUpdateService: ParticipantStatusUpdateService
    ) {
        super(participantStatusUpdateService, logger);
    }

    get equipmentCheck(): AbstractControl {
        return this.form.get('equipmentCheck');
    }

    initForm() {
        this.form = this.fb.group({
            equipmentCheck: [false, Validators.pattern('Yes')]
        });
    }

    getConference(): void {
        this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
        this.conference = this.videoWebService.getActiveIndividualConference();
    }

    checkEquipmentAgain() {
        this.logger.info(`[${this.getEquipmentCheck()} check] - Requested check equipment again.`, {
            conference: this.conferenceId,
            participant: this.participantId
        });
        this.router.navigate([pageUrls.EquipmentCheck, this.conferenceId]);
    }

    showError(): boolean {
        return this.form.invalid && this.submitted && this.form.pristine;
    }

    async onSubmit() {
        const logPayload = {
            conference: this.conference.id,
            participant: this.participantId
        };
        this.submitted = true;
        if (this.form.pristine) {
            return;
        }

        if (this.form.valid && this.form.dirty) {
            this.sessionStorage.set(this.form.valid);
            this.navigateToNextPage();
            return;
        }
        try {
            await this.videoWebService.raiseSelfTestFailureEvent(
                this.conferenceId,
                new AddSelfTestFailureEventRequest({
                    self_test_failure_reason: this.getFailureReason()
                })
            );
            this.logger.info(
                `[${this.getEquipmentCheck()} check] - ${this.getEquipmentCheck()} not working. Going to GetHelp page`,
                logPayload
            );
            this.router.navigate([pageUrls.GetHelp]);
        } catch (error) {
            this.logger.error(`[${this.getEquipmentCheck()} check] - Failed to raise "SelfTestFailureEvent"`, error, logPayload);
        }
    }

    abstract getEquipmentCheck(): string;
    abstract getFailureReason(): SelfTestFailureReason;
    abstract navigateToNextPage(): void;
}
