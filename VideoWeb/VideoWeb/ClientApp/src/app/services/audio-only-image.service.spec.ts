import { TestBed } from '@angular/core/testing';
import { AudioOnlyImageService } from './audio-only-image.service';
import { Logger } from './logging/logger-base';

describe('AudioOnlyImageServiceService', () => {
    let service: AudioOnlyImageService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                {
                    provide: Logger,
                    useValue: jasmine.createSpyObj<Logger>(['debug', 'info', 'warn', 'error'])
                }
            ]
        });
        service = TestBed.inject(AudioOnlyImageService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
