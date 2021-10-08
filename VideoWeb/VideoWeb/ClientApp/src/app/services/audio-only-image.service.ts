import { Injectable } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Logger } from './logging/logger-base';

@Injectable({
    providedIn: 'root'
})
export class AudioOnlyImageService {
    private loggerPrefix = '[AudioOnlyImageService] -';
    private loadedImages: { [imagePath: string]: HTMLImageElement } = {};
    private audioOnlyImageStreamFps = 0;
    private audioOnlyImagePath = '/assets/images/Audio-only-BG.jpg';

    constructor(private logger: Logger) {}

    private createAudioOnlyImageCanvas(image$: Observable<HTMLImageElement>): Observable<HTMLCanvasElement> {
        return image$.pipe(
            map(image => {
                this.logger.info(
                    `${this.loggerPrefix} Building canvas for image. Width: ${image.width} Height: ${image.height} IsLoading: ${image.loading} Image: ${image}`
                );

                const canvas = document.createElement('canvas');
                canvas.width = image.width;
                canvas.height = image.height;
                const context = canvas.getContext('2d');
                context.drawImage(image, 0, 0);

                return canvas;
            })
        );
    }

    private createAudioOnlyImage(imagePath: string): Observable<HTMLImageElement> {
        this.logger.info(`${this.loggerPrefix} Creating image from path: ${imagePath}`);

        const audioOnlyImageSubject = new Subject<HTMLImageElement>();

        const audioOnlyImage = new Image();
        audioOnlyImage.onload = (event: Event) => {
            audioOnlyImageSubject.next(audioOnlyImage);
            audioOnlyImageSubject.complete();
        };
        audioOnlyImage.src = imagePath;

        return audioOnlyImageSubject.asObservable();
    }

    private getAudioOnlyImage(imagePath: string): Observable<HTMLImageElement> {
        this.logger.info(`${this.loggerPrefix} Attempting to get image with path: ${imagePath}`);
        const existingImage = this.loadedImages[imagePath];

        if (!existingImage) {
            this.logger.debug(`${this.loggerPrefix} Image was not cached.`);
            return this.createAudioOnlyImage(imagePath).pipe(tap(image => (this.loadedImages[imagePath] = image)));
        }

        this.logger.debug(`${this.loggerPrefix} image was cached.`);
        return of(existingImage);
    }

    getAudioOnlyImageStream(): Observable<MediaStream> {
        const canvas$ = this.createAudioOnlyImageCanvas(this.getAudioOnlyImage(this.audioOnlyImagePath));
        return canvas$.pipe(map(canvas => canvas.captureStream(this.audioOnlyImageStreamFps)));
    }
}
