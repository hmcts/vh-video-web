import { Injectable } from '@angular/core';
import { ModalService } from 'src/app/services/modal.service';

import { ConsultationInvitationService } from './consultation-invitation.service';

@Injectable({
    providedIn: 'root'
})
export class ConsultationInvitationDisplayService {
    constructor(private invitationService: ConsultationInvitationService, private modalService: ModalService) {}

    displayModal() {
        // this.modalService.open();
    }
}
