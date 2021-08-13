import { ErrorService } from '../services/error.service';
import { Logger } from './logging/logger-base';
import { UserMediaStreamService } from './user-media-stream.service';
import { UserMediaService } from './user-media.service';

describe('UserMediaStreamService', () => {
    let sut: UserMediaStreamService;

    let loggerSpy: jasmine.SpyObj<Logger>;
    let errorServiceSpy: jasmine.SpyObj<ErrorService>;
    let userMediaServiceSpy: jasmine.SpyObj<UserMediaService>;
    let navigatorSpy: jasmine.SpyObj<Navigator>;

    beforeEach(() => {
        loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['info', 'warn', 'error', 'debug']);

        sut = new UserMediaStreamService(loggerSpy, errorServiceSpy, userMediaServiceSpy, navigatorSpy);
    });
});
