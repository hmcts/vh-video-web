import { Component, Input, OnInit } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { ConferenceResponse, ParticipantResponse, ParticipantStatus, UserRole } from 'src/app/services/clients/api-client';
import { Hearing } from '../../shared/models/hearing';
import { Participant } from '../../shared/models/participant';

@Component({
    selector: 'app-judge-participant-status-list',
    templateUrl: './judge-participant-status-list.component.html',
    styleUrls: ['./judge-participant-status-list.component.scss']
})
export class JudgeParticipantStatusListComponent implements OnInit {
    @Input() conference: ConferenceResponse;

    nonJudgeParticipants: ParticipantResponse[];
    judge: ParticipantResponse;
    representativeParticipants: ParticipantResponse[];
    litigantInPerson: boolean;
    individualParticipants: ParticipantResponse[];

    constructor(private adalService: AdalService) {}

    ngOnInit() {
        this.filterNonJudgeParticipants();
        this.filterJudge();

        this.filterRepresentatives();
    }

    isParticipantAvailable(participant: ParticipantResponse): boolean {
        return participant.status === ParticipantStatus.Available;
    }

    getParticipantStatusText(participant: ParticipantResponse): string {
        return participant.status === ParticipantStatus.Available ? 'Available' : 'Unavailable';
    }

    canCallParticipant(participant: ParticipantResponse): boolean {
        const hearing = new Hearing(this.conference);
        if (hearing.isStarting() || hearing.isDelayed() || hearing.isSuspended()) {
            return false;
        }

        const patModel = new Participant(participant);
        if (patModel.role === UserRole.Judge) {
            return false;
        }
        if (patModel.base.username.toLocaleLowerCase().trim() === this.adalService.userInfo.userName.toLocaleLowerCase().trim()) {
            return false;
        }
        return false;
    }

    private filterNonJudgeParticipants(): void {
        this.nonJudgeParticipants = this.conference.participants.filter(x => x.role !== UserRole.Judge);
    }

    private filterJudge(): void {
        this.judge = this.conference.participants.find(x => x.role === UserRole.Judge);
    }

    getParticipantStatus(participant: ParticipantResponse): string {
        if (participant.status === ParticipantStatus.Available) {
            return 'connected';
        } else if (participant.status === ParticipantStatus.Disconnected) {
            return 'disconnected';
        } else if (participant.status === ParticipantStatus.InConsultation) {
            return 'in a consultation';
        } else if (participant.status === ParticipantStatus.InHearing) {
            return 'connected';
        } else if (participant.status === ParticipantStatus.Joining) {
            return 'joining';
        } else if (participant.status === ParticipantStatus.NotSignedIn) {
            return 'not signed in';
        } else if (participant.status === ParticipantStatus.UnableToJoin) {
            return 'unable to join';
        } else if (participant.status === ParticipantStatus.None) {
            return 'not signed in';
        }
    }

    getParticipantStatusCss(participant: ParticipantResponse): string {
        if (participant.status === ParticipantStatus.Available) {
            return 'connected';
        } else if (participant.status === ParticipantStatus.Disconnected) {
            return 'disconnected';
        } else if (participant.status === ParticipantStatus.InConsultation) {
            return 'in_a_consultation';
        } else if (participant.status === ParticipantStatus.InHearing) {
            return 'in_a_hearing';
        } else if (participant.status === ParticipantStatus.Joining) {
            return 'joining';
        } else if (participant.status === ParticipantStatus.NotSignedIn) {
            return 'not_signed_in';
        } else if (participant.status === ParticipantStatus.UnableToJoin) {
            return 'unable_to_join';
        } else if (participant.status === ParticipantStatus.None) {
            return 'not_signed_in';
        }
    }

    isUserJudge(): boolean {
        const participant = this.conference.participants.find(
            x => x.username.toLowerCase() === this.adalService.userInfo.userName.toLocaleLowerCase()
        );
        return participant.role === UserRole.Judge;
    }

    private filterRepresentatives(): void {
        this.representativeParticipants = this.conference.participants.filter(x => x.role === UserRole.Representative);
        this.litigantInPerson = this.representativeParticipants.length === 0;
        this.individualParticipants = this.conference.participants.filter(x => x.role === UserRole.Individual);
    }
}
