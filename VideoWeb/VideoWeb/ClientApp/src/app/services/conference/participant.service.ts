import { Injectable } from '@angular/core';
import { Guid } from 'guid-typescript';
import { combineLatest, Observable, Subject, Subscription } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { IParticipantHearingState, ParticipantModel } from 'src/app/shared/models/participant';
import { ParticipantUpdated } from 'src/app/waiting-space/models/video-call-models';
import { VideoCallService } from 'src/app/waiting-space/services/video-call.service';
import { ApiClient, ConferenceResponse } from '../clients/api-client';
import { EventsService } from '../events.service';
import { LoggerService } from '../logging/logger.service';
import { ParticipantStatusMessage } from '../models/participant-status-message';
import { ConferenceService } from './conference.service';
import { VirtualMeetingRoomModel } from './models/virtual-meeting-room.model';

export const InvalidNumberOfNonEndpointParticipantsError = () => new Error('Invalid number of non-endpoint participants.');

@Injectable({
    providedIn: 'root'
})
export class ParticipantService {
    private loggingPrefix = '[ParticipantService] -';
    private conferenceSubscriptions: Subscription[] = [];

    private _participants: ParticipantModel[] = [];
    public get participants(): ParticipantModel[] {
        return this._participants;
    }

    public get nonEndpointParticipants(): ParticipantModel[] {
        const participants = this.participants.filter(x => !x.isEndPoint);

        if (participants.length < 1) throw InvalidNumberOfNonEndpointParticipantsError();

        return participants;
    }

    public get endpointParticipants(): ParticipantModel[] {
        return this.participants.filter(x => x.isEndPoint);
    }

    private _virtualMeetingRooms: VirtualMeetingRoomModel[];
    public get virtualMeetingRooms(): VirtualMeetingRoomModel[] {
        return this._virtualMeetingRooms;
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
        private logger: LoggerService
    ) {
        this.initialise();
    }

    getParticipantOrVirtualMeetingRoomById(participantOrVmrId: string | Guid): ParticipantModel | VirtualMeetingRoomModel {
        this.logger.info(`${this.loggingPrefix} getting participant or VMR by ID.`, {
            participantOrVmrId: participantOrVmrId
        });

        if (Guid.isGuid(participantOrVmrId)) {
            this.logger.info(`${this.loggingPrefix} getting participant or VMR by ID - ID was a participants ID.`, {
                participantOrVmrId: participantOrVmrId
            });
            return this.participants.find(x => x.id === participantOrVmrId.toString());
        } else {
            this.logger.info(`${this.loggingPrefix} getting participant or VMR by ID - ID was a VMR ID.`, {
                participantOrVmrId: participantOrVmrId
            });
            return this.virtualMeetingRooms.find(x => x.id === participantOrVmrId);
        }
    }

    private getParticipantOrVirtualMeetingRoomByPexipDisplayName(pexipDisplayName: string): ParticipantModel | VirtualMeetingRoomModel {
        return (
            this.participants.find(x => pexipDisplayName.includes(x.id)) ??
            this.virtualMeetingRooms.find(x => pexipDisplayName.includes(x.id))
        );
    }

    getParticipantsForConference(conferenceId: Guid | string): Observable<ParticipantModel[]> {
        this.logger.info(`${this.loggingPrefix} getting participants for conference.`);

        return this.apiClient
            .getParticipantsByConferenceId(conferenceId.toString())
            .pipe(
                map(participants =>
                    participants.map(participantResponse => ParticipantModel.fromParticipantForUserResponse(participantResponse))
                )
            );
    }

    getEndpointsForConference(conferenceId: Guid | string): Observable<ParticipantModel[]> {
        this.logger.info(`${this.loggingPrefix} getting endpoints for conference.`);

        return this.apiClient
            .getVideoEndpointsForConference(conferenceId.toString())
            .pipe(
                map(participants =>
                    participants.map(videoEndpointResponse => ParticipantModel.fromVideoEndpointResponse(videoEndpointResponse))
                )
            );
    }

    getPexipIdForParticipant(participantId: Guid | string): string {
        return this.participants.find(p => p.id === participantId?.toString())?.pexipId ?? null;
    }

    handlePexipParticipantUpdate(updatedParticipant: ParticipantUpdated): void {
        this.logger.info(`${this.loggingPrefix} handling pexip participant update`, {
            participantUpdate: updatedParticipant
        });

        // const participantsToUpdate = this.getParticipantOrVmrParticipantsFromPexipId(updatedParticipant.pexipDisplayName);

        let participantsToUpdate: ParticipantModel[] = [];
        const participantOrVmr = this.getParticipantOrVirtualMeetingRoomByPexipDisplayName(updatedParticipant.pexipDisplayName);
        if (participantOrVmr instanceof VirtualMeetingRoomModel) {
            const vmr = participantOrVmr as VirtualMeetingRoomModel;
            vmr.pexipId = updatedParticipant.uuid;
            participantsToUpdate = vmr.participants;

            this.logger.info(`${this.loggingPrefix} updating VMRs pexip ID`, {
                vmrId: vmr.id,
                vmr: vmr,
                oldValue: vmr.pexipId,
                newValue: updatedParticipant.uuid
            });
        } else if (participantOrVmr) {
            participantsToUpdate = [participantOrVmr as ParticipantModel];
        }

        for (const participant of participantsToUpdate) {
            const isParticipantsFirstPexipId = !participant.pexipId;
            this.logger.info(`${this.loggingPrefix} updating participants pexip ID`, {
                participantId: participant.id,
                participant: participant,
                oldValue: participant.pexipId,
                newValue: updatedParticipant.uuid
            });

            // TODO: Add pexip display name service
            // CIVILIAN;Judge Name;GUID 4 part id || long for a VMR id

            participant.pexipId = updatedParticipant.uuid;

            if (isParticipantsFirstPexipId) {
                this.logger.warn(`${this.loggingPrefix} not updating participants hearing state as it was their first pexip id`, {
                    participantId: participant.id,
                    participantsHearingState: participant as IParticipantHearingState,
                    participantUpdate: updatedParticipant
                });

                continue;
            }

            if (participant.isSpotlighted != updatedParticipant.isSpotlighted) {
                this.logger.info(`${this.loggingPrefix} updating participants spotlight status`, {
                    participantId: participant.id,
                    pexipDisplayName: updatedParticipant.pexipDisplayName,
                    oldValue: participant.isSpotlighted,
                    newValue: updatedParticipant.isSpotlighted
                });

                participant.isSpotlighted = updatedParticipant.isSpotlighted;
                this.participantSpotlightStatusChangedSubject.next(participant);
            }

            if (participant.isRemoteMuted != updatedParticipant.isRemoteMuted) {
                this.logger.info(`${this.loggingPrefix} updating participants remote muted status`, {
                    participantId: participant.id,
                    pexipDisplayName: updatedParticipant.pexipDisplayName,
                    oldValue: participant.isRemoteMuted,
                    newValue: updatedParticipant.isRemoteMuted
                });

                participant.isRemoteMuted = updatedParticipant.isRemoteMuted;
                this.participantRemoteMuteStatusChangedSubject.next(participant);
            }

            if (participant.isHandRaised != updatedParticipant.handRaised) {
                this.logger.info(`${this.loggingPrefix} updating participants hand raised status`, {
                    participantId: participant.id,
                    pexipDisplayName: updatedParticipant.pexipDisplayName,
                    oldValue: participant.isHandRaised,
                    newValue: updatedParticipant.handRaised
                });

                participant.isHandRaised = updatedParticipant.handRaised;
                this.participantHandRaisedStatusChangedSubject.next(participant);
            }
        }
    }

    handleParticipantStatusUpdate(participantStatusMessage: ParticipantStatusMessage) {
        this.logger.info(`${this.loggingPrefix} handling participant status update`);

        const participant = this.participants.find(x => x.id === participantStatusMessage.participantId);

        if (!participant) {
            this.logger.warn(`${this.loggingPrefix} Cannot find participant in conference. Failed to updated status.`, {
                conferenceId: participantStatusMessage.conferenceId,
                participantId: participantStatusMessage.participantId,
                status: participantStatusMessage.status
            });

            return;
        }

        if (participant.status !== participantStatusMessage.status) {
            this.logger.info(`${this.loggingPrefix} updating participants status`, {
                participantId: participant.id,
                oldValue: participant.status,
                newValue: participantStatusMessage.status
            });

            participant.status = participantStatusMessage.status;
            this.participantStatusChangedSubject.next(participant);
        }
    }

    // private getParticipantOrVmrParticipantsFromPexipId(pexipDisplayName: string): ParticipantModel[] {
    //     const participant = this.participants.find(x => pexipDisplayName.includes(x.id));

    //     if (!participant) {
    //         this.logger.warn(`${this.loggingPrefix} Could not find participant where their ID was contained in their pexip display name.`, {
    //             checkedParticipantIds: this.participants.map(x => x.id),
    //             pexipDisplayNameOfUpdatedParticipant: pexipDisplayName
    //         });
    //     } else {
    //         return [participant];
    //     }

    //     return this.virtualMeetingRooms.find(x => pexipDisplayName.includes(x.id))?.participants ?? [];
    // }

    private initialise() {
        this.conferenceService.currentConference$.subscribe(conference => {
            this.logger.info(`${this.loggingPrefix} new conference recieved`, {
                conference: conference
            });

            this._participants = [];
            this._virtualMeetingRooms = [];
            this.logger.info(`${this.loggingPrefix} fetching new participant list`);
            combineLatest([this.getParticipantsForConference(conference.id), this.getEndpointsForConference(conference.id)])
                .pipe(
                    take(1), // Ensure this observable also completes
                    map(participantLists => participantLists[0].concat(participantLists[1]))
                )
                .subscribe(participants => {
                    this.logger.info(`${this.loggingPrefix} new participant list retrieved`, {
                        oldValue: this.participants,
                        newValue: participants
                    });

                    this._participants = participants;
                    this.populateVirtualMeetingRooms();
                });

            this.subscribeToConferenceEvents(conference);
        });

        this.videoCallService.onParticipantUpdated().subscribe(updatedParticipant => this.handlePexipParticipantUpdate(updatedParticipant));
    }

    private populateVirtualMeetingRooms() {
        const oldValue = [...this.virtualMeetingRooms];
        for (const participant of this.participants.filter(x => !!x.virtualMeetingRoomSummary)) {
            const existingVmr = this._virtualMeetingRooms.find(x => x.id === participant.virtualMeetingRoomSummary?.id);
            if (existingVmr) {
                existingVmr.participants.push(participant);
            } else {
                const vmr = new VirtualMeetingRoomModel(
                    participant.virtualMeetingRoomSummary.id,
                    participant.virtualMeetingRoomSummary.label,
                    participant.virtualMeetingRoomSummary.locked,
                    [participant]
                );

                this._virtualMeetingRooms.push(vmr);
            }

            this.logger.info(`${this.loggingPrefix} populated VMRs`, {
                oldValue: oldValue,
                newValue: this.virtualMeetingRooms.map(x => {
                    return {
                        id: x.id,
                        displayName: x.displayName,
                        locked: x.locked
                    };
                })
            });
        }
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
