import { Injectable } from '@angular/core';
import { Participant } from 'src/app/shared/models/participant';
import { Logger } from 'src/app/services/logging/logger-base';
import { ToastrService } from 'ngx-toastr';
import { VhToastComponent } from 'src/app/shared/toast/vh-toast.component';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { ConsultationAnswer } from 'src/app/services/clients/api-client';

@Injectable()
export class NotificationToastrService {
    private readonly loggerPrefix = '[NotificationToastService] -';
    constructor(private logger: Logger, private toastr: ToastrService, private consultationService: ConsultationService) {}
    
    ShowConsultationInvite(roomLabel: string, conferenceId: string, requestedBy: Participant, requestedFor: Participant, participants: Participant[]) {
        this.logger.debug(`${this.loggerPrefix} creating 'ShowConsultationInvite' toastr notification`);
        let message = `<span class="govuk-!-font-weight-bold">Call from ${requestedBy.displayName}</span>`
        var participantsList = participants.filter(p => p.id != requestedBy.id).map(p => p.displayName).join('\n');
        if (participantsList) {
            participantsList = `with\n${participantsList}`
            message += `\nwith\n${participantsList}`
        }
        
        const toast = this.toastr.show('', '', {
            timeOut: 1200000,
            tapToDismiss: false,
            toastComponent: VhToastComponent
          });

          respondToConsultationRequest: async (answer: ConsultationAnswer) => {
                this.logger.info(`${this.loggerPrefix} Responding to consultation request with ${answer}`);
                await this.consultationService.respondToConsultationRequest(conferenceId, requestedBy.id, requestedFor.id, answer, roomLabel);
            }

          (toast.toastRef.componentInstance as VhToastComponent).vhToastOptions = {
              color: 'white',
              htmlBody: message,
              timeout: async () => {
                this.logger.info(`${this.loggerPrefix} Responding to consultation request with ${ConsultationAnswer.None}`);
                await this.consultationService.respondToConsultationRequest(conferenceId, requestedBy.id, requestedFor.id, ConsultationAnswer.None, roomLabel);
              },
              buttons: [
                {
                    label: 'Accept',
                    action: async () => {
                        this.logger.info(`${this.loggerPrefix} Responding to consultation request with ${ConsultationAnswer.Accepted}`);
                        await this.consultationService.respondToConsultationRequest(conferenceId, requestedBy.id, requestedFor.id, ConsultationAnswer.Accepted, roomLabel);
                    }
                }, 
                {
                    label: 'Decline',
                    action: async () => {
                        this.logger.info(`${this.loggerPrefix} Responding to consultation request with ${ConsultationAnswer.Rejected}`);
                        await this.consultationService.respondToConsultationRequest(conferenceId, requestedBy.id, requestedFor.id, ConsultationAnswer.Rejected, roomLabel);
                    }
                }
              ]
          }
    }
}
