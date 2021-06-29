import { Injectable } from '@angular/core';
import { Guid } from 'guid-typescript';
import { Observable, ReplaySubject, Subject, Subscription, zip } from 'rxjs';
import { filter, map, mergeMap, take, tap } from 'rxjs/operators';
import { IParticipantHearingState, ParticipantModel } from 'src/app/shared/models/participant';
import { ParticipantUpdated } from 'src/app/waiting-space/models/video-call-models';
import { VideoCallService } from 'src/app/waiting-space/services/video-call.service';
import { ApiClient, ConferenceResponse, ConferenceStatus, ParticipantStatus } from '../clients/api-client';
import { EventsService } from '../events.service';
import { LoggerService } from '../logging/logger.service';
import { ParticipantStatusMessage } from '../models/participant-status-message';
import { ConferenceService } from './conference.service';
import { VirtualMeetingRoomModel } from './models/virtual-meeting-room.model';
import { VideoControlCacheService } from './video-control-cache.service';

export const InvalidNumberOfNonEndpointParticipantsError = () => new Error('Invalid number of non-endpoint participants.');

@Injectable({
    providedIn: 'root'
})
export class ParticipantService {
    private loggerPrefix = '[ParticipantService] -';
    private conferenceSubscriptions: Subscription[] = [];

    private _participants: ParticipantModel[] = [];
    public get participants(): ParticipantModel[] {
        return this._participants;
    }

    private _loggedInParticipant: ReplaySubject<ParticipantModel> = new ReplaySubject<ParticipantModel>();
    get loggedInParticipant(): Observable<ParticipantModel> {
        return this._loggedInParticipant.asObservable();
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

    private participantsLoadedSubject: Subject<ParticipantModel[]> = new Subject<ParticipantModel[]>();
    get onParticipantsLoaded$(): Observable<ParticipantModel[]> {
        return this.participantsLoadedSubject.asObservable();
    }

    private participantConnectedToPexipSubject: Subject<ParticipantModel> = new Subject<ParticipantModel>();
    get onParticipantConnectedToPexip$(): Observable<ParticipantModel> {
        return this.participantConnectedToPexipSubject.asObservable();
    }

    private participantPexipIdChangedSubject: Subject<ParticipantModel> = new Subject<ParticipantModel>();
    get onParticipantPexipIdChanged$(): Observable<ParticipantModel> {
        return this.participantPexipIdChangedSubject.asObservable();
    }

    private vmrConnectedToPexipSubject: Subject<VirtualMeetingRoomModel> = new Subject<VirtualMeetingRoomModel>();
    get onVmrConnectedToPexip$(): Observable<VirtualMeetingRoomModel> {
        return this.vmrConnectedToPexipSubject.asObservable();
    }

    private vmrPexipIdChangedSubject: Subject<VirtualMeetingRoomModel> = new Subject<VirtualMeetingRoomModel>();
    get onVmrPexipIdChanged$(): Observable<VirtualMeetingRoomModel> {
        return this.vmrPexipIdChangedSubject.asObservable();
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
        private videoControlCacheService: VideoControlCacheService,
        private logger: LoggerService
    ) {
        this.logger.warn(`${this.loggerPrefix} Constructor called.`);
        this.initialise();
    }

    getParticipantOrVirtualMeetingRoomById(participantOrVmrId: string | Guid): ParticipantModel | VirtualMeetingRoomModel {
        this.logger.info(`${this.loggerPrefix} getting participant or VMR by ID.`, {
            participantOrVmrId: participantOrVmrId ?? null
        });

        console.log(`${this.loggerPrefix} getParticipantOrVirtualMeetingRoomById`);
        console.table(this.participants);
        console.table(this.virtualMeetingRooms);

        if (Guid.isGuid(participantOrVmrId)) {
            const participant = this.participants.find(x => x.id === participantOrVmrId.toString());
            this.logger.info(`${this.loggerPrefix} getting participant or VMR by ID - ID was a participants ID.`, {
                participantOrVmrId: participantOrVmrId,
                participant: participant ?? null,
                participants: this.participants ?? null
            });
            return participant;
        } else {
            const vmr = this.virtualMeetingRooms.find(x => x.id === participantOrVmrId);
            this.logger.info(`${this.loggerPrefix} getting participant or VMR by ID - ID was a VMR ID.`, {
                participantOrVmrId: participantOrVmrId,
                virtualMeetingRoom: vmr ?? null,
                virtualMeetingRooms: this.virtualMeetingRooms ?? null
            });
            return vmr;
        }
    }

    private getParticipantOrVirtualMeetingRoomByPexipDisplayName(pexipDisplayName: string): ParticipantModel | VirtualMeetingRoomModel {
        console.log(`${this.loggerPrefix} getParticipantOrVirtualMeetingRoomByPexipDisplayName`);
        console.table(this.participants);
        console.table(this.virtualMeetingRooms);
        return (
            this.participants.find(x => pexipDisplayName.includes(x.id)) ??
            this.virtualMeetingRooms.find(x => pexipDisplayName.includes(x.id))
        );
    }

    getLoggedInParticipantForConference(conferenceId: Guid | string): Observable<ParticipantModel> {
        return this.getParticipantsForConference(conferenceId).pipe(
            mergeMap(participants =>
                this.apiClient
                    .getCurrentParticipant(conferenceId.toString())
                    .pipe(map(response => participants.find(participant => participant.id === response.participant_id)))
            )
        );
    }

    getParticipantsForConference(conferenceId: Guid | string): Observable<ParticipantModel[]> {
        this.logger.info(`${this.loggerPrefix} getting participants for conference.`);

        return this.apiClient.getParticipantsByConferenceId(conferenceId.toString()).pipe(
            tap(val =>
                console.log(
                    `${this.loggerPrefix} getParticipantsForConference - `,
                    val.map(x => x.interpreter_room)
                )
            ),
            map(participants =>
                participants.map(participantResponse => ParticipantModel.fromParticipantForUserResponse(participantResponse))
            )
        );
    }

    getEndpointsForConference(conferenceId: Guid | string): Observable<ParticipantModel[]> {
        this.logger.info(`${this.loggerPrefix} getting endpoints for conference.`);

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

    private handlePexipVmrUpdate(vmr: VirtualMeetingRoomModel, update: ParticipantUpdated) {
        if (!vmr.pexipId) {
            vmr.pexipId = update.uuid;
            this.vmrConnectedToPexipSubject.next(vmr);

            this.logger.warn(`${this.loggerPrefix} not updating VMR participants hearing state as it was their first pexip id`, {
                vmrId: vmr.id,
                participantUpdate: update
            });

            return;
        } else if (vmr.pexipId !== update.uuid) {
            this.logger.info(`${this.loggerPrefix} updating VMRs pexip ID`, {
                vmrId: vmr.id,
                oldValue: vmr.pexipId,
                newValue: update.uuid
            });

            vmr.pexipId = update.uuid;
            this.vmrPexipIdChangedSubject.next(vmr);
        }

        this.updateParticipantHearingState(vmr.participants, update);
    }

    private handlePexipParticipantUpdate(participant: ParticipantModel, update: ParticipantUpdated) {
        if (!participant.pexipId) {
            participant.pexipId = update.uuid;
            this.participantConnectedToPexipSubject.next(participant);

            this.logger.warn(`${this.loggerPrefix} not updating participants hearing state as it was their first pexip id`, {
                participantId: participant.id,
                participantsHearingState: participant as IParticipantHearingState,
                participantUpdate: update
            });

            return;
        }

        this.updateParticipantHearingState([participant], update);
    }

    private updateParticipantHearingState(participants: ParticipantModel[], update: ParticipantUpdated) {
        for (const participant of participants) {
            if (participant.pexipId !== update.uuid) {
                this.logger.info(`${this.loggerPrefix} participant pexip ID changed.`, {
                    participantId: participant.id,
                    participantUpdate: update
                });

                participant.pexipId = update.uuid;
                this.participantPexipIdChangedSubject.next(participant);
            }

            if (participant.isSpotlighted != update.isSpotlighted) {
                this.logger.info(`${this.loggerPrefix} updating participants spotlight status`, {
                    participantId: participant.id,
                    pexipDisplayName: update.pexipDisplayName,
                    oldValue: participant.isSpotlighted,
                    newValue: update.isSpotlighted
                });

                participant.isSpotlighted = update.isSpotlighted;
                this.participantSpotlightStatusChangedSubject.next(participant);
            }

            if (participant.isRemoteMuted != update.isRemoteMuted) {
                this.logger.info(`${this.loggerPrefix} updating participants remote muted status`, {
                    participantId: participant.id,
                    pexipDisplayName: update.pexipDisplayName,
                    oldValue: participant.isRemoteMuted,
                    newValue: update.isRemoteMuted
                });

                participant.isRemoteMuted = update.isRemoteMuted;
                this.participantRemoteMuteStatusChangedSubject.next(participant);
            }

            if (participant.isHandRaised != update.handRaised) {
                this.logger.info(`${this.loggerPrefix} updating participants hand raised status`, {
                    participantId: participant.id,
                    pexipDisplayName: update.pexipDisplayName,
                    oldValue: participant.isHandRaised,
                    newValue: update.handRaised
                });

                participant.isHandRaised = update.handRaised;
                this.participantHandRaisedStatusChangedSubject.next(participant);
            }
        }
    }

    handlePexipUpdate(update: ParticipantUpdated): void {
        this.logger.info(`${this.loggerPrefix} handling pexip update`, {
            participantUpdate: update
        });

        const participantOrVmr = this.getParticipantOrVirtualMeetingRoomByPexipDisplayName(update.pexipDisplayName);
        if (participantOrVmr instanceof VirtualMeetingRoomModel) {
            this.handlePexipVmrUpdate(participantOrVmr, update);
        } else if (participantOrVmr) {
            this.handlePexipParticipantUpdate(participantOrVmr, update);
        }

        console.log(`${this.loggerPrefix} handled pexip update`);
        console.table(this.participants);
        console.table(this.virtualMeetingRooms);
    }

    handleParticipantStatusUpdate(participantStatusMessage: ParticipantStatusMessage) {
        this.logger.info(`${this.loggerPrefix} handling participant status update`);

        const participant = this.participants.find(x => x.id === participantStatusMessage.participantId);

        if (!participant) {
            this.logger.warn(`${this.loggerPrefix} Cannot find participant in conference. Failed to updated status.`, {
                conferenceId: participantStatusMessage.conferenceId,
                participantId: participantStatusMessage.participantId,
                status: participantStatusMessage.status
            });

            return;
        }

        const oldValue = participant.status;

        if (oldValue !== participantStatusMessage.status) {
            this.logger.info(`${this.loggerPrefix} updating participants status`, {
                participantId: participant.id,
                oldValue: oldValue,
                newValue: participantStatusMessage.status
            });

            participant.status = participantStatusMessage.status;
            this.participantStatusChangedSubject.next(participant);
        }

        console.log(`${this.loggerPrefix} handled participant status update`);
        console.table(this.participants);
        console.table(this.virtualMeetingRooms);
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
            this.logger.info(`${this.loggerPrefix} new conference recieved`, {
                conference: conference
            });

            this._participants = [];
            this._virtualMeetingRooms = [];
            this.loadParticipants().subscribe(participants => {
                this.logger.info(`${this.loggerPrefix} new participant list retrieved`, {
                    oldValue: this.participants,
                    newValue: participants
                });

                this._participants = [];
                this._virtualMeetingRooms = [];
                this._participants = participants;

                this.populateVirtualMeetingRooms();

                this.restoreCachedVideoControlState();

                this.participantsLoadedSubject.next(this.participants);

                console.log(`${this.loggerPrefix} loaded participants and VMRs`);
                console.table(this.participants);
                console.table(this.virtualMeetingRooms);
            });

            this.getLoggedInParticipantForConference(conference.id).subscribe(participant => this._loggedInParticipant.next(participant));

            this.subscribeToConferenceEvents(conference);
        });

        this.videoCallService.onParticipantUpdated().subscribe(updatedParticipant => this.handlePexipUpdate(updatedParticipant));
    }

    restoreCachedVideoControlState() {
        const conferenceState = this.videoControlCacheService.getStateForConference(this.conferenceService.currentConferenceId);

        if (conferenceState !== null) {
            this.participants.forEach(participant => {
                if (conferenceState.participantStates[participant.id])
                    participant.isSpotlighted = conferenceState.participantStates[participant.id].isSpotlighted;
            });

            this.virtualMeetingRooms.forEach(vmr => {
                if (conferenceState.participantStates[vmr.id])
                    vmr.participants.forEach(
                        participant => (participant.isSpotlighted = conferenceState.participantStates[vmr.id].isSpotlighted)
                    );
            });
        }
    }

    private subscribeToConferenceEvents(conference: ConferenceResponse) {
        this.conferenceSubscriptions.forEach(x => x.unsubscribe());
        this.conferenceSubscriptions = [];

        this.conferenceSubscriptions.push(
            this.conferenceService.onCurrentConferenceStatusChanged$.subscribe(update => {
                if (update.newStatus === ConferenceStatus.InSession) {
                    this.participants
                        .filter(x => !x.virtualMeetingRoomSummary)
                        .forEach(participant => {
                            if (participant.status === ParticipantStatus.Disconnected) {
                                this.videoControlCacheService.setSpotlightStatus(
                                    this.conferenceService.currentConferenceId,
                                    participant.id,
                                    false
                                );
                            }
                        });

                    this.virtualMeetingRooms.forEach(vmr => {
                        if (vmr.participants.every(x => x.status === ParticipantStatus.Disconnected)) {
                            this.videoControlCacheService.setSpotlightStatus(this.conferenceService.currentConferenceId, vmr.id, false);
                        }
                    });
                }
            })
        );

        this.conferenceSubscriptions.push(
            this.eventsService
                .getParticipantStatusMessage()
                .pipe(
                    filter(x => x.conferenceId === conference.id),
                    tap(participantStatusMessage => {
                        if (participantStatusMessage.status === ParticipantStatus.Available)
                            this.loadParticipants().subscribe(participants => {
                                participants.forEach(upToDateParticipant => {
                                    const participant = this.participants.find(p => p.id === upToDateParticipant.id);
                                    if (upToDateParticipant.status !== participant.status) {
                                        participant.status = upToDateParticipant.status;
                                    }

                                    if (upToDateParticipant.virtualMeetingRoomSummary?.id !== participant.virtualMeetingRoomSummary?.id) {
                                        participant.virtualMeetingRoomSummary = upToDateParticipant.virtualMeetingRoomSummary;
                                    }
                                });

                                this.populateVirtualMeetingRooms();
                            });
                    }),
                    tap(participantStatusMessage => {
                        if (
                            participantStatusMessage.status === ParticipantStatus.Disconnected &&
                            this.conferenceService.currentConference.status === ConferenceStatus.InSession
                        ) {
                            this.logger.info(`${this.loggerPrefix} Participant disconnected while conference is in session`, {
                                message: participantStatusMessage
                            });

                            let participantOrVmr = this.getParticipantOrVirtualMeetingRoomById(participantStatusMessage.participantId);
                            if (participantOrVmr instanceof ParticipantModel) {
                                if (participantOrVmr.virtualMeetingRoomSummary) {
                                    const vmr = this.virtualMeetingRooms.find(
                                        x => x.id === (participantOrVmr as ParticipantModel).virtualMeetingRoomSummary.id
                                    );

                                    this.logger.info(`${this.loggerPrefix} Participant belongs to a VMR`, {
                                        vmr: vmr
                                    });

                                    if (vmr.participants.some(x => x.status === ParticipantStatus.InHearing)) {
                                        this.logger.info(
                                            `${this.loggerPrefix} Some participants are still in hearing. Not going to unspotlight the VMR.`,
                                            {
                                                vmr: vmr
                                            }
                                        );
                                        return;
                                    }

                                    participantOrVmr = vmr;
                                }
                            }

                            this.logger.info(`${this.loggerPrefix} Unspotlighting the participant or VMR.`, {
                                participantOrVmr: participantOrVmr
                            });

                            this.videoControlCacheService.setSpotlightStatus(
                                participantStatusMessage.conferenceId,
                                participantOrVmr.id,
                                false
                            );
                        }
                    })
                )
                .subscribe(participantStatusMessage => this.handleParticipantStatusUpdate(participantStatusMessage))
        );
    }

    private loadParticipants(): Observable<ParticipantModel[]> {
        this.logger.info(`${this.loggerPrefix} loading participants and VMRs`);

        const conferenceId = this.conferenceService.currentConferenceId;
        const participants = zip(this.getParticipantsForConference(conferenceId), this.getEndpointsForConference(conferenceId)).pipe(
            take(1), // Ensure this observable also completes
            map(participantLists => participantLists[0].concat(participantLists[1]))
        );

        return participants;
    }

    private populateVirtualMeetingRooms() {
        this.logger.info(`${this.loggerPrefix} populating VMRs`, {
            currentValue: this.virtualMeetingRooms ?? null
        });

        for (const participant of this.participants.filter(x => x.virtualMeetingRoomSummary)) {
            const existingVmr = this._virtualMeetingRooms.find(x => x.id === participant.virtualMeetingRoomSummary?.id);
            if (existingVmr) {
                if (existingVmr.participants.find(x => x.id === participant.id) !== participant) {
                    this.logger.warn(`${this.loggerPrefix} Participants are different instances`);
                    continue;
                }

                if (existingVmr.participants.find(x => x.id === participant.id)) {
                    continue;
                }

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
        }

        this.logger.info(`${this.loggerPrefix} populated VMRs`, {
            newValue:
                this.virtualMeetingRooms.map(x => {
                    return {
                        id: x.id,
                        displayName: x.displayName,
                        locked: x.locked
                    };
                }) ?? null
        });
    }
}
