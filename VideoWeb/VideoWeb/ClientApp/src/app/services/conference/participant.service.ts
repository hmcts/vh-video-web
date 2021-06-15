import { Injectable } from '@angular/core';
import { Guid } from 'guid-typescript';
import { Observable, Subject, Subscriber, Subscription } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { ParticipantModel } from 'src/app/shared/models/participant';
import { ParticipantUpdated } from 'src/app/waiting-space/models/video-call-models';
import { VideoCallService } from 'src/app/waiting-space/services/video-call.service';
import { ApiClient, ConferenceResponse } from '../clients/api-client';
import { EventsService } from '../events.service';
import { Logger } from '../logging/logger-base';
import { ParticipantStatusMessage } from '../models/participant-status-message';
import { ConferenceService } from './conference.service';

@Injectable({
    providedIn: 'root'
})
export class ParticipantService {
    private loggingPrefix = 'ParticipantService -';
    private conferenceSubscriptions: Subscription[] = [];

    private _participants: ParticipantModel[] = [];
    public get participants(): ParticipantModel[] {
        return this._participants;
    }

    public get nonEndpointParticipants(): ParticipantModel[] {
        return this._participants.filter(x => !x.isEndPoint);
    }

    public get endpointParticipants(): ParticipantModel[] {
        return this._participants.filter(x => x.isEndPoint);
    }

    private _participantIdToPexipIdMap: { [participantId: string]: string } = {};
    public get participantIdToPexipIdMap() {
        return this._participantIdToPexipIdMap;
    }

    private participantStatusChangedSubject: Subject<ParticipantModel> = new Subject<ParticipantModel>();
    get onParticipantStatusChanged$(): Observable<ParticipantModel> {
        return this.participantStatusChangedSubject.asObservable();
    }

    private participantSpotlightStatusChangedSubject: Subject<ParticipantModel> = new Subject<ParticipantModel>();
    get onParticipantSpotlightStatusChanged$(): Observable<ParticipantModel> {
        return this.participantSpotlightStatusChangedSubject.asObservable();
    }

    private participantRemoteMuteStatusChangedSubject: Subject<ParticipantModel> = new Subject<ParticipantModel>();
    get onParticipantRemoteMuteStatusChanged$(): Observable<ParticipantModel> {
        return this.participantRemoteMuteStatusChangedSubject.asObservable();
    }

    private participantHandRaisedStatusChangedSubject: Subject<ParticipantModel> = new Subject<ParticipantModel>();
    get onParticipantHandRaisedStatusChanged$(): Observable<ParticipantModel> {
        return this.participantHandRaisedStatusChangedSubject.asObservable();
    }

    constructor(
        private apiClient: ApiClient,
        private conferenceService: ConferenceService,
        private videoCallService: VideoCallService,
        private eventsService: EventsService,
        private logger: Logger
    ) {
        this.initialise();
    }

    getParticipantsForConference(conferenceId: Guid | string): Observable<ParticipantModel[]> {
        return this.apiClient
            .getParticipantsByConferenceId(conferenceId.toString())
            .pipe(
                map(participants =>
                    participants.map(participantResponse => ParticipantModel.fromParticipantForUserResponse(participantResponse))
                )
            );
    }

    getEndpointsForConference(conferenceId: Guid | string): Observable<ParticipantModel[]> {
        return this.apiClient
            .getVideoEndpointsForConference(conferenceId.toString())
            .pipe(
                map(participants =>
                    participants.map(videoEndpointResponse => ParticipantModel.fromVideoEndpointResponse(videoEndpointResponse))
                )
            );
    }

    getPexipIdForParticipant(participantId: Guid | string): string {
        const pexipId = this.participantIdToPexipIdMap[participantId.toString()];
        return pexipId ? pexipId : Guid.EMPTY;
    }

    handlePexipParticipantUpdate(updatedParticipant: ParticipantUpdated): void {
        const participant = this.participants.find(x => updatedParticipant.pexipDisplayName.includes(x.id));

        if (!participant) {
            this.logger.warn(`${this.loggingPrefix} Could find participant where their ID was contained in the pexip display name.`, {
                checkedParticipants: this.participants.map(x => x.id),
                pexipDisplayNameOfUpdatedParticipant: updatedParticipant.pexipDisplayName
            });
            return;
        }

        this.setPexipIdForParticipant(updatedParticipant.uuid, participant.id);

        if (participant.isSpotlighted != updatedParticipant.isSpotlighted) {
            participant.isSpotlighted = updatedParticipant.isSpotlighted;
            this.participantSpotlightStatusChangedSubject.next(participant);
        }

        if (participant.isRemoteMuted != updatedParticipant.isRemoteMuted) {
            participant.isRemoteMuted = updatedParticipant.isRemoteMuted;
            this.participantRemoteMuteStatusChangedSubject.next(participant);
        }

        if (participant.isHandRaised != updatedParticipant.handRaised) {
            participant.isHandRaised = updatedParticipant.handRaised;
            this.participantHandRaisedStatusChangedSubject.next(participant);
        }
    }

    handleParticipantStatusUpdate(participantStatusMessage: ParticipantStatusMessage) {
        const participantToUpdate = this.participants.find(x => x.id === participantStatusMessage.participantId);

        if (!participantToUpdate) {
            this.logger.warn(`${this.loggingPrefix} Cannot find participant in conference. Failed to updated status.`, {
                conferenceId: participantStatusMessage.conferenceId,
                participantId: participantStatusMessage.participantId,
                status: participantStatusMessage.status
            });

            return;
        }

        if (participantToUpdate.status !== participantStatusMessage.status) {
            participantToUpdate.status = participantStatusMessage.status;
            this.participantStatusChangedSubject.next(participantToUpdate);
        }
    }

    private setPexipIdForParticipant(pexipId: string, participantId: string | Guid) {
        this._participantIdToPexipIdMap[participantId.toString()] = pexipId;
    }

    private initialise() {
        this.conferenceService.currentConference$.subscribe(conference => {
            this._participants = [];
            this.getParticipantsForConference(conference.id)
                .pipe(take(1))
                .subscribe(nonEndpointParticipants => {
                    this._participants = this._participants.concat(nonEndpointParticipants);
                });

            this.getEndpointsForConference(conference.id)
                .pipe(take(1))
                .subscribe(endpointParticipants => {
                    this._participants = this._participants.concat(endpointParticipants);
                });

            this.subscribeToConferenceEvents(conference);
        });

        this.videoCallService.onParticipantUpdated().subscribe(updatedParticipant => this.handlePexipParticipantUpdate(updatedParticipant));
    }

    private subscribeToConferenceEvents(conference: ConferenceResponse) {
        this.conferenceSubscriptions.forEach(x => x.unsubscribe());
        this.conferenceSubscriptions = [];

        this.conferenceSubscriptions.push(
            this.eventsService
                .getParticipantStatusMessage()
                .pipe(filter(x => x.conferenceId === conference.id))
                .subscribe(participantStatusMessage => this.handleParticipantStatusUpdate(participantStatusMessage))
        );
    }
}
