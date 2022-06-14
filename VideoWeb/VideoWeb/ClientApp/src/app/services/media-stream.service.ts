import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { catchError, map, mergeMap, retry, take } from 'rxjs/operators';
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
        this.logger.info(`[MediaStreamTrack] - Returning audio or video tracks: ${tracks}`);
        return new MediaStream(tracks);
    }

    getStreamForMic(device: UserMediaDevice): Observable<MediaStream> {
        this.logger.info(
            `${this.loggerPrefix} getting microphone with the device label ${device.label} and ID ${device.deviceId} ${device.deviceId}`
        );
        return from(this.navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: device.deviceId } } }))
            .pipe(retry(3))
            .pipe(
                catchError(error => {
                    this.logger.error(`${this.loggerPrefix} Could not get audio stream for microphone`, error);
                    this.errorService.handlePexipError(new CallError(error.name), null);
                    return of(null);
                })
            );
    }

    getStreamForCam(device: UserMediaDevice): Observable<MediaStream> {
        this.logger.info(`${this.loggerPrefix} getting camera with the device label ${device.label} and ID ${device.deviceId}`);
        const constraints = { video: { deviceId: { exact: device.deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } } };
        return from(this.navigator.mediaDevices.getUserMedia(constraints))
            .pipe(retry(3))
            .pipe(
                mergeMap(stream => {
                    if (this.videoFilterService.doesSupportVideoFiltering()) {
                        this.logger.info(`${this.loggerPrefix} video filtering is supported`);
                        return this.videoFilterService.filterOn$.pipe(
                            mergeMap(filterOn => {
                                if (filterOn) {
                                    return this.videoFilterService.initFilterFromMediaStream(stream).pipe(
                                        take(1),
                                        map(() => {
                                            this.logger.debug(`${this.loggerPrefix} Returning filtered stream`);
                                            return this.videoFilterService.startFilteredStream();
                                        })
                                    );
                                } else {
                                    this.logger.debug(`${this.loggerPrefix} Returning unfiltered stream`);
                                    return of(stream);
                                }
                            })
                        );
                    } else {
                        this.logger.info(`${this.loggerPrefix} video filtering is NOT supported`);
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
