import { Component, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ModalService } from 'src/app/services/modal.service';

import { ConsultationInvitationService } from '../../services/consultation-invitation.service';

@Component({
    selector: 'app-consultation-invitations',
    templateUrl: './consultation-invitations.component.html',
    styleUrls: ['./consultation-invitations.component.css']
})
export class ConsultationInvitationsComponent implements OnChanges, OnDestroy {
    private readonly modalId = 'consultation-invitations-modal';
    private destroyed$ = new Subject();

    constructor(private invitationService: ConsultationInvitationService, private modalService: ModalService) {}
    ngOnDestroy(): void {
        this.destroyed$.next();
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.invitationService.consultationInvitations$.pipe(takeUntil(this.destroyed$)).subscribe(invitations => {
            console.log('Faz - Invitations changed');
        });
    }
}
