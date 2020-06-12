import { TestBed } from '@angular/core/testing';

import { AudioNotificationService } from './audio-notification.service';

describe('AudioNotificationService', () => {
    beforeEach(() => TestBed.configureTestingModule({}));

    it('should be created', () => {
        const service: AudioNotificationService = TestBed.get(AudioNotificationService);
        expect(service).toBeTruthy();
    });
});
