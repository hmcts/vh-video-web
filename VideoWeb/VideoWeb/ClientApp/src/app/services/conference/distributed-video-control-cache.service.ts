import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
    ApiClient,
    ConferenceVideoControlStatuses,
    SetConferenceVideoControlStatusesRequest,
    SetConferenceVideoControlStatusesRequest_VideoControlStatusRequest
} from '../clients/api-client';
import { Logger } from '../logging/logger-base';
import {
    IHearingControlsState,
    IParticipantControlsState,
    IVideoControlCacheStorageService
} from './video-control-cache-storage.service.interface';

@Injectable({
    providedIn: 'root'
})
export class DistributedVideoControlCacheService implements IVideoControlCacheStorageService {
    private readonly loggerPrefix = '[DistributedVideoControlCacheService] -';

    constructor(
        private apiClient: ApiClient,
        private logger: Logger
    ) {}

    saveHearingStateForConference(currentConferenceId: string, hearingControlStates: IHearingControlsState) {
        const request = this.mapToRequest(hearingControlStates);
        this.logger.debug(`${this.loggerPrefix} saving hearing state for current conference ${currentConferenceId}`, {
            hearingControlStates: hearingControlStates,
            request: request
        });
        return this.apiClient.setVideoControlStatusesForConference(currentConferenceId, request).pipe(
            tap(() => {
                this.logger.debug(`${this.loggerPrefix} saved hearing state for current conference ${currentConferenceId}`);
            })
        );
    }

    loadHearingStateForConference(id: string): Observable<IHearingControlsState> {
        this.logger.debug(`${this.loggerPrefix} loading hearing state for current conference ${id}`);
        return this.apiClient.getVideoControlStatusesForConference(id).pipe(
            tap(response => {
                this.logger.debug(`${this.loggerPrefix} loaded hearing state for current conference ${id}`, {
                    response: response
                });
            }),
            map(this.mapFromResponse)
        );
    }

    private mapToRequest(hearingControlStates: IHearingControlsState) {
        if (!hearingControlStates) {
            return null;
        }

        const setConferenceVideoControlStatusesRequest = {
            participant_id_to_video_control_status_map: {}
        } as SetConferenceVideoControlStatusesRequest;

        if (hearingControlStates) {
            for (const participantOrVmrId in hearingControlStates.participantStates) {
                if (hearingControlStates.participantStates.hasOwnProperty(participantOrVmrId)) {
                    setConferenceVideoControlStatusesRequest.participant_id_to_video_control_status_map[participantOrVmrId] = {
                        is_spotlighted: hearingControlStates.participantStates[participantOrVmrId].isSpotlighted ?? false,
                        is_remote_muted: hearingControlStates.participantStates[participantOrVmrId].isRemoteMuted ?? false,
                        is_hand_raised: hearingControlStates.participantStates[participantOrVmrId].isHandRaised ?? false,
                        is_local_audio_muted: hearingControlStates.participantStates[participantOrVmrId].isLocalAudioMuted ?? false,
                        is_local_video_muted: hearingControlStates.participantStates[participantOrVmrId].isLocalVideoMuted ?? false
                    } as SetConferenceVideoControlStatusesRequest_VideoControlStatusRequest;
                }
            }
        }

        return setConferenceVideoControlStatusesRequest;
    }

    private mapFromResponse(response: ConferenceVideoControlStatuses) {
        if (!response) {
            return null;
        }

        const mappedResponse = {} as IHearingControlsState;
        mappedResponse.participantStates = {} as { [participantId: string]: IParticipantControlsState };

        if (response.participant_id_to_video_control_status_map) {
            for (const participantOrVmrId in response.participant_id_to_video_control_status_map) {
                if (response.participant_id_to_video_control_status_map.hasOwnProperty(participantOrVmrId)) {
                    mappedResponse.participantStates[participantOrVmrId] = {
                        isSpotlighted: response.participant_id_to_video_control_status_map[participantOrVmrId].is_spotlighted,
                        isRemoteMuted: response.participant_id_to_video_control_status_map[participantOrVmrId].is_remote_muted,
                        isHandRaised: response.participant_id_to_video_control_status_map[participantOrVmrId].is_hand_raised,
                        isLocalAudioMuted: response.participant_id_to_video_control_status_map[participantOrVmrId].is_local_audio_muted,
                        isLocalVideoMuted: response.participant_id_to_video_control_status_map[participantOrVmrId].is_local_video_muted
                    } as IParticipantControlsState;
                }
            }
        }
        return mappedResponse;
    }
}
