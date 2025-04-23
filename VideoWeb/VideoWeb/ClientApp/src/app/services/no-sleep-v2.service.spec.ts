import { TestBed } from '@angular/core/testing';

import { NoSleepServiceV2 } from './no-sleep-v2.service';
import { Logger } from './logging/logger-base';
import { getSpiedPropertyGetter } from '../shared/jasmine-helpers/property-helpers';

describe('NoSleepV2Service', () => {
    let service: NoSleepServiceV2;
    let noSleepAppSpy: jasmine.SpyObj<any>;
    let logger: jasmine.SpyObj<Logger>;

    beforeEach(() => {
        noSleepAppSpy = jasmine.createSpyObj('NoSleepApp', ['enable', 'disable'], ['isEnabled']);
        logger = jasmine.createSpyObj<Logger>('Logger', ['debug']);
        TestBed.configureTestingModule({
            providers: [{ provide: Logger, useValue: logger }]
        });
        service = TestBed.inject(NoSleepServiceV2);
        service['noSleep'] = noSleepAppSpy;
    });

    describe('enable', () => {
        beforeEach(() => {
            noSleepAppSpy.enable.calls.reset();
        });
        it('should enable no sleep', () => {
            // Arrange
            getSpiedPropertyGetter(noSleepAppSpy, 'isEnabled').and.returnValue(false);

            // Act
            service.enable();

            // Assert
            expect(noSleepAppSpy.enable).toHaveBeenCalled();
            expect(logger.debug).toHaveBeenCalledWith('[NoSleepServiceV2] - enabling no sleep');
        });

        it('should not enable no sleep if already enabled', () => {
            // Arrange
            getSpiedPropertyGetter(noSleepAppSpy, 'isEnabled').and.returnValue(true);

            // Act
            service.enable();

            // Assert
            expect(noSleepAppSpy.enable).not.toHaveBeenCalled();
        });
    });

    describe('disable', () => {
        beforeEach(() => {
            noSleepAppSpy.disable.calls.reset();
        });

        it('should disable no sleep', () => {
            // Act
            service.disable();

            // Assert
            expect(noSleepAppSpy.disable).toHaveBeenCalled();
            expect(logger.debug).toHaveBeenCalledWith('[NoSleepServiceV2] - disabled no sleep');
        });
    });
});
