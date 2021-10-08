import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class AudioOnlyImageServiceService {
    private loadedImages: { [imagePath: string]: HTMLImageElement };
    private audioOnlyImageStreamFps = 1;
    private audioOnlyImagePath = '/assets/images/VhBgFilterHMCTS.jpg';

    private createAudioOnlyImageCanvas(image: HTMLImageElement): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d');

        context.drawImage(image, 0, 0);

        context.font = '48px serif';
        context.textAlign = 'center';
        context.fillText('Audio Only', image.width / 2, image.height * (2 / 3));

        return canvas;
    }

    private createAudioOnlyImage(imagePath: string): HTMLImageElement {
        const audioOnlyImage = new Image();
        audioOnlyImage.src = imagePath;

        return audioOnlyImage;
    }

    private getAudioOnlyImage(imagePath: string): HTMLImageElement {
        const existingImage = this.loadedImages[imagePath];

        if (!existingImage) {
            const newImage = this.createAudioOnlyImage(imagePath);
            this.loadedImages[imagePath] = newImage;
            return newImage;
        }

        return existingImage;
    }

    getAudioOnlyImageStream(): MediaStream {
        return this.createAudioOnlyImageCanvas(this.getAudioOnlyImage(this.audioOnlyImagePath)).captureStream(this.audioOnlyImageStreamFps);
    }
}
