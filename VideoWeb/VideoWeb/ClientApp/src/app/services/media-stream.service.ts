import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { UserMediaDevice } from '../shared/models/user-media-device';
import { CallError } from '../waiting-space/models/video-call-models';
import { ErrorService } from './error.service';
import { Logger } from './logging/logger-base';
import { VideoFilterService } from './video-filter.service';

@Injectable({
    providedIn: 'root'
})
export class MediaStreamService {
    private readonly loggerPrefix = '[MediaServiceService] -';

    constructor(
        private logger: Logger,
        private errorService: ErrorService,
        private navigator: Navigator,
        private videoFilterService: VideoFilterService
    ) {
        this.navigator.getUserMedia =
            this.navigator.getUserMedia || (this.navigator as any).webkitGetUserMedia || (this.navigator as any).msGetUserMedia;
    }

    initialiseNewStream(tracks?: MediaStreamTrack[]) {
        return new MediaStream(tracks);
    }

    getStreamForMic(device: UserMediaDevice): Observable<MediaStream> {
        return from(this.navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: device.deviceId } } })).pipe(
            catchError(error => {
                this.logger.error(`${this.loggerPrefix} Could not get audio stream for microphone`, error);
                this.errorService.handlePexipError(new CallError(error.name), null);
                return of(null);
            })
        );
    }

    getStreamForCam(device: UserMediaDevice): Observable<MediaStream> {
        return from(this.navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: device.deviceId } } })).pipe(
            mergeMap(stream => {
                if (this.videoFilterService.doesSupportVideoFiltering()) {
                    return this.videoFilterService.activeCameraFilter$.pipe(
                        map(filter => {
                            if (filter) {
                                this.videoFilterService.initFilterFromMediaStream(stream);
                                return this.videoFilterService.startFilteredStream();
                            } else {
                                return stream;
                            }
                        })
                    );
                } else {
                    return of(stream);
                }
            }),
            catchError(error => {
                this.logger.error(`${this.loggerPrefix} Could not get cam stream for camera`, error);
                this.errorService.handlePexipError(new CallError(error.name), null);
                return of(null);
            })
        );
    }
}
