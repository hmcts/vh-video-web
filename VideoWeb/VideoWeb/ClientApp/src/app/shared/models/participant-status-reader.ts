import { EndpointStatus, ParticipantStatus } from 'src/app/services/clients/api-client';
import { Injectable } from '@angular/core';

@Injectable()
export class ParticipantStatusReader {
    public inAnotherHearingText = 'In another hearing';
    public unavailableText = 'Unavailable';

    getStatusAsText(status: ParticipantStatus): string {
        switch (status) {
            case ParticipantStatus.None:
            case ParticipantStatus.NotSignedIn:
                return 'Not signed in';
            case ParticipantStatus.InConsultation:
                return 'In consultation';
            case ParticipantStatus.InHearing:
                return 'In hearing';
            default:
                return status;
        }
    }

    getEndpointStatusAsText(status: EndpointStatus): string {
        switch (status) {
            case EndpointStatus.Connected:
            return 'Connected';
            case EndpointStatus.Disconnected:
            return 'Disconnected';
            case EndpointStatus.InConsultation:
            return 'In consultation';
            default:
            return status;
        }
    }

    getStatusAsTextForHost(status: ParticipantStatus): string {
        switch (status) {
            case ParticipantStatus.None:
            case ParticipantStatus.NotSignedIn:
                return this.unavailableText;
            case ParticipantStatus.InConsultation:
                return 'In consultation';
            case ParticipantStatus.InHearing:
                return 'In hearing';

            default:
                return status;
        }
    }
}
