import { Injectable } from '@angular/core';
import { Guid } from 'guid-typescript';
import { Observable, ReplaySubject, Subject, Subscription, zip } from 'rxjs';
import { filter, map, take, tap } from 'rxjs/operators';
import { IParticipantHearingState, ParticipantModel } from 'src/app/shared/models/participant';
import { ParticipantUpdated } from 'src/app/waiting-space/models/video-call-models';
import { ParticipantRemoteMuteStoreService } from 'src/app/waiting-space/services/participant-remote-mute-store.service';
import { VideoCallEventsService } from 'src/app/waiting-space/services/video-call-events.service';
import { ConferenceResponse, ParticipantStatus } from '../clients/api-client';
import { EventsService } from '../events.service';
import { LoggerService } from '../logging/logger.service';
import { ParticipantStatusMessage } from '../models/participant-status-message';
import { ConferenceService } from './conference.service';
import { VirtualMeetingRoomModel } from './models/virtual-meeting-room.model';
import { VideoControlCacheService } from './video-control-cache.service';

export const invalidNumberOfNonEndpointParticipantsError = () => new Error('Invalid number of non-endpoint participants.');

@Injectable({
    providedIn: 'root'
})
export class ParticipantService {
    private loggerPrefix = '[ParticipantService] -';
    private conferenceSubscriptions: Subscription[] = [];
    private _loggedInParticipant: ReplaySubject<ParticipantModel> = new ReplaySubject<ParticipantModel>(1);
    private _nonEndpointParticipants: ParticipantModel[] = [];
    private _endpointParticipants: ParticipantModel[] = [];
    private _virtualMeetingRooms: VirtualMeetingRoomModel[] = [];
    private participantsLoadedSubject = new Subject<ParticipantModel[]>();
    private participantConnectedToPexipSubject = new Subject<ParticipantModel>();
    private participantPexipIdChangedSubject = new Subject<ParticipantModel>();
    private vmrConnectedToPexipSubject = new Subject<VirtualMeetingRoomModel>();
    private vmrPexipIdChangedSubject = new Subject<VirtualMeetingRoomModel>();
    private participantStatusChangedSubject: Subject<ParticipantModel> = new Subject<ParticipantModel>();
    private participantSpotlightStatusChangedSubject = new Subject<ParticipantModel>();
    private participantRemoteMuteStatusChangedSubject = new Subject<ParticipantModel>();
    private participantHandRaisedStatusChangedSubject = new Subject<ParticipantModel>();
    private participantsUpdatedSubject = new Subject<boolean>();

    constructor(
        private conferenceService: ConferenceService,
        private videoCallEventsService: VideoCallEventsService,
        private eventsService: EventsService,
        private videoControlCacheService: VideoControlCacheService,
        private participantRemoteMuteStoreService: ParticipantRemoteMuteStoreService,
        private logger: LoggerService
    ) {
        this.initialise();
    }

    public get participants(): ParticipantModel[] {
        return [...this.nonEndpointParticipants, ...this.endpointParticipants];
    }

    /**
     * @deprecated This method is deprecated and will be removed in future versions.
     * Use `getLoggedInParticipant` selector from the ConferenceStore instead.
     */
    get loggedInParticipant$(): Observable<ParticipantModel> {
        return this._loggedInParticipant.asObservable();
    }

    public get nonEndpointParticipants(): ParticipantModel[] {
        return this._nonEndpointParticipants;
    }

    public get endpointParticipants(): ParticipantModel[] {
        return this._endpointParticipants;
    }

    public get virtualMeetingRooms(): VirtualMeetingRoomModel[] {
        return this._virtualMeetingRooms;
    }

    get onParticipantsLoaded$(): Observable<ParticipantModel[]> {
        return this.participantsLoadedSubject.asObservable();
    }

    get onParticipantConnectedToPexip$(): Observable<ParticipantModel> {
        return this.participantConnectedToPexipSubject.asObservable();
    }

    get onParticipantPexipIdChanged$(): Observable<ParticipantModel> {
        return this.participantPexipIdChangedSubject.asObservable();
    }

    get onVmrConnectedToPexip$(): Observable<VirtualMeetingRoomModel> {
        return this.vmrConnectedToPexipSubject.asObservable();
    }

    get onVmrPexipIdChanged$(): Observable<VirtualMeetingRoomModel> {
        return this.vmrPexipIdChangedSubject.asObservable();
    }

    get onParticipantStatusChanged$(): Observable<ParticipantModel> {
        return this.participantStatusChangedSubject.asObservable();
    }
    get onParticipantSpotlightStatusChanged$(): Observable<ParticipantModel> {
        return this.participantSpotlightStatusChangedSubject.asObservable();
    }
    get onParticipantRemoteMuteStatusChanged$(): Observable<ParticipantModel> {
        return this.participantRemoteMuteStatusChangedSubject.asObservable();
    }
    get onParticipantHandRaisedStatusChanged$(): Observable<ParticipantModel> {
        return this.participantHandRaisedStatusChangedSubject.asObservable();
    }

    get onParticipantsUpdated$(): Observable<boolean> {
        return this.participantsUpdatedSubject.asObservable();
    }

    getPexipIdForParticipant(participantId: Guid | string): string {
        return this.participants.find(p => p.id === participantId?.toString())?.pexipId ?? null;
    }

    handlePexipUpdate(update: ParticipantUpdated): void {
        this.logger.debug(`${this.loggerPrefix} handling pexip update`, {
            participantUpdate: update
        });

        if (!update.pexipDisplayName) {
            return;
        }
        const participantOrVmr = this.getParticipantOrVirtualMeetingRoomByPexipDisplayName(update.pexipDisplayName);
        if (participantOrVmr instanceof VirtualMeetingRoomModel) {
            this.handlePexipVmrUpdate(participantOrVmr, update);
        } else if (participantOrVmr) {
            this.handlePexipParticipantUpdate(participantOrVmr, update);
        }
    }

    handleParticipantStatusUpdate(participantStatusMessage: ParticipantStatusMessage) {
        this.logger.debug(`${this.loggerPrefix} handling participant status update`);

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
            this.logger.debug(`${this.loggerPrefix} updating participants status`, {
                participantId: participant.id,
                oldValue: oldValue,
                newValue: participantStatusMessage.status
            });

            participant.status = participantStatusMessage.status;
            this.participantStatusChangedSubject.next(participant);
        }
    }

    private getParticipantOrVirtualMeetingRoomByPexipDisplayName(pexipDisplayName: string): ParticipantModel | VirtualMeetingRoomModel {
        return (
            this.participants.find(x => pexipDisplayName.includes(x.id)) ??
            this.virtualMeetingRooms.find(x => pexipDisplayName.includes(x.id))
        );
    }

    private initialise() {
        this.conferenceService.currentConference$.subscribe(conference => {
            this.logger.debug(`${this.loggerPrefix} new conference`, {
                conference: conference
            });

            this._endpointParticipants = [];
            this._nonEndpointParticipants = [];
            this._virtualMeetingRooms = [];

            if (!conference) {
                this.logger.warn(`${this.loggerPrefix} no conference loaded; skipping initialisation.`);
                return;
            }

            zip(
                this.conferenceService.getParticipantsForConference(conference.id),
                this.conferenceService.getEndpointsForConference(conference.id)
            )
                .pipe(take(1))
                .subscribe(participantsArrays => {
                    this._virtualMeetingRooms = [];
                    this._nonEndpointParticipants = [...participantsArrays[0]];
                    this._endpointParticipants = [...participantsArrays[1]];

                    this.populateVirtualMeetingRooms();

                    this.restoreCachedVideoControlState();

                    this.participantsLoadedSubject.next(this.participants);
                });

            this.subscribeToConferenceEvents(conference);
        });

        this.videoCallEventsService.participantUpdated$.subscribe(updatedParticipant => this.handlePexipUpdate(updatedParticipant));
    }

    private restoreCachedVideoControlState() {
        this.participants.forEach(participant => {
            participant.isSpotlighted = this.videoControlCacheService.getSpotlightStatus(participant.id);
        });

        this.virtualMeetingRooms.forEach(vmr => {
            vmr.participants.forEach(participant => (participant.isSpotlighted = this.videoControlCacheService.getSpotlightStatus(vmr.id)));
        });
    }

    private loadParticipants(): Observable<ParticipantModel[]> {
        this.logger.debug(`${this.loggerPrefix} loading participants and VMRs`);

        const conferenceId = this.conferenceService.currentConferenceId;
        return zip(
            this.conferenceService.getParticipantsForConference(conferenceId),
            this.conferenceService.getEndpointsForConference(conferenceId)
        ).pipe(
            take(1),
            map(participantLists => participantLists[0].concat(participantLists[1]))
        );
    }

    private populateVirtualMeetingRooms() {
        this.logger.debug(`${this.loggerPrefix} populating VMRs`, {
            currentValue: this.virtualMeetingRooms ?? null
        });

        for (const participant of this.participants.filter(x => x.virtualMeetingRoomSummary)) {
            this.participantRemoteMuteStoreService.assignPexipId(participant.id, participant.pexipId);
            const existingVmr = this.virtualMeetingRooms.find(x => x.id === participant.virtualMeetingRoomSummary?.id);
            if (existingVmr) {
                if (existingVmr.participants.find(x => x.id === participant.id)) {
                    this.logger.warn(`${this.loggerPrefix} Participant is already registered in VMR`, {
                        areSameInstance: participant === existingVmr.participants.find(x => x.id === participant.id)
                    });
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

                this.virtualMeetingRooms.push(vmr);
            }
        }

        this.logger.debug(`${this.loggerPrefix} populated VMRs`, {
            newValue:
                this.virtualMeetingRooms.map(x => ({
                    id: x.id,
                    displayName: x.displayName,
                    locked: x.locked
                })) ?? null
        });
    }

    private subscribeToConferenceEvents(conference: ConferenceResponse) {
        this.conferenceSubscriptions.forEach(x => x.unsubscribe());
        this.conferenceSubscriptions = [];

        this.conferenceSubscriptions.push(
            this.conferenceService
                .getLoggedInParticipantForConference(conference.id)
                .subscribe(participant => this._loggedInParticipant.next(participant))
        );

        this.conferenceSubscriptions.push(
            this.eventsService
                .getParticipantStatusMessage()
                .pipe(
                    filter(x => x.conferenceId === conference.id),
                    tap(participantStatusMessage => this.checkForNewVmrsOnParticipantAvailable(participantStatusMessage))
                )
                .subscribe(participantStatusMessage => this.handleParticipantStatusUpdate(participantStatusMessage))
        );

        this.conferenceSubscriptions.push(
            this.eventsService
                .getParticipantsUpdated()
                .pipe(
                    filter(message => message.conferenceId === conference.id),
                    map(message => message.participants.map(x => ParticipantModel.fromParticipantResponseVho(x)))
                )
                .subscribe(participants => {
                    this._nonEndpointParticipants = [...participants];
                    this.participantsUpdatedSubject.next(true);
                })
        );

        this.conferenceSubscriptions.push(
            this.eventsService
                .getEndpointsUpdated()
                .pipe(filter(message => message.conferenceId === conference.id))
                .subscribe(message => {
                    // if new endpoint, push the endpoint to the endpoint list
                    // if existing endpoint, update the endpoint in the endpoint list
                    if (message.endpoints.new_endpoints.length > 0) {
                        this.logger.debug(`${this.loggerPrefix} new endpoints received`, {
                            endpoints: message.endpoints.new_endpoints
                        });
                        this._endpointParticipants.push(
                            ...message.endpoints.new_endpoints.map(x => ParticipantModel.fromVideoEndpointResponse(x))
                        );
                    }
                    // there is currently an issue where only one endpoint is provided at a time, so it is safe to process just the first entry in the list
                    if (message.endpoints.existing_endpoints.length > 0) {
                        this.logger.debug(`${this.loggerPrefix} existing endpoints received`, {
                            endpoints: message.endpoints.existing_endpoints
                        });
                        const first = message.endpoints.existing_endpoints[0];
                        const existingEndpointIndex = this._endpointParticipants.findIndex(x => x.id === first.id);
                        if (existingEndpointIndex > -1) {
                            this._endpointParticipants[existingEndpointIndex] = ParticipantModel.fromVideoEndpointResponse(first);
                        }
                    }
                    // TOOD: review if we need an endpointUpdatedSubject, the participant one does not seem to be used
                })
        );
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
            this.logger.debug(`${this.loggerPrefix} updating VMRs pexip ID`, {
                vmrId: vmr.id,
                oldValue: vmr.pexipId,
                newValue: update.uuid
            });

            vmr.pexipId = update.uuid;
            this.vmrPexipIdChangedSubject.next(vmr);
        }

        this.updateParticipantVideoControlState(vmr.participants, update);
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

        this.updateParticipantVideoControlState([participant], update);
    }

    private updateParticipantVideoControlState(participants: ParticipantModel[], update: ParticipantUpdated) {
        for (const participant of participants) {
            if (participant.pexipId !== update.uuid) {
                this.logger.debug(`${this.loggerPrefix} participant pexip ID changed.`, {
                    participantId: participant.id,
                    participantUpdate: update
                });

                participant.pexipId = update.uuid;
                this.participantPexipIdChangedSubject.next(participant);
            }

            if (participant.isSpotlighted !== update.isSpotlighted) {
                this.logger.debug(`${this.loggerPrefix} updating participants spotlight status`, {
                    participantId: participant.id,
                    pexipDisplayName: update.pexipDisplayName,
                    oldValue: participant.isSpotlighted,
                    newValue: update.isSpotlighted
                });

                participant.isSpotlighted = update.isSpotlighted;
                this.participantSpotlightStatusChangedSubject.next(participant);
            }

            if (participant.isRemoteMuted !== update.isRemoteMuted) {
                this.logger.debug(`${this.loggerPrefix} updating participants remote muted status`, {
                    participantId: participant.id,
                    pexipDisplayName: update.pexipDisplayName,
                    oldValue: participant.isRemoteMuted,
                    newValue: update.isRemoteMuted
                });

                participant.isRemoteMuted = update.isRemoteMuted;
                this.participantRemoteMuteStatusChangedSubject.next(participant);
            }

            if (participant.isHandRaised !== update.handRaised) {
                this.logger.debug(`${this.loggerPrefix} updating participants hand raised status`, {
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

    private checkForNewVmrsOnParticipantAvailable(participantStatusMessage: ParticipantStatusMessage) {
        if (participantStatusMessage.status === ParticipantStatus.Available) {
            this.loadParticipants().subscribe(participants => {
                participants.forEach(upToDateParticipant => {
                    const participant = this.participants.find(p => p.id === upToDateParticipant.id);

                    if (upToDateParticipant.virtualMeetingRoomSummary?.id !== participant.virtualMeetingRoomSummary?.id) {
                        participant.virtualMeetingRoomSummary = upToDateParticipant.virtualMeetingRoomSummary;
                    }
                });

                this.populateVirtualMeetingRooms();
            });
        }
    }
}
