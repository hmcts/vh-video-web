import { LoggerService } from '../logging/logger.service';

import { LocalStorageService } from './local-storage.service';

describe('LocalStorageService', () => {
    let loggerServiceSpy: jasmine.SpyObj<LoggerService>;

    let service: LocalStorageService;

    beforeEach(() => {
        loggerServiceSpy = jasmine.createSpyObj<LoggerService>('LoggerService', ['info', 'warn', 'debug']);

        service = new LocalStorageService(loggerServiceSpy);
    });

    afterEach(() => {
        window.localStorage.clear();
    });

    describe('save', () => {
        it('should save a value under a new key and return true', () => {
            // Arrange
            const key = 'key';
            const value = { value: 'value' };

            // Act
            const result = service.save(key, value, true);

            // Assert
            expect(result).toBeTrue();
            expect(JSON.parse(window.localStorage.getItem(key))).toEqual(value);
        });

        it('should save a value under an existing key if overwrite is true and return true', () => {
            // Arrange
            const key = 'key';
            const value = { value: 'value' };

            window.localStorage.setItem(key, JSON.stringify(value));

            // Act
            const result = service.save(key, value, true);

            // Assert
            expect(result).toBeTrue();
            expect(JSON.parse(window.localStorage.getItem(key))).toEqual(value);
        });

        it('should save a value under an existing key if overwrite is true and return true', () => {
            // Arrange
            const key = 'key';
            const value = { value: 'value' };

            window.localStorage.setItem(key, JSON.stringify(value));

            // Act
            const result = service.save(key, value);

            // Assert
            expect(result).toBeTrue();
            expect(JSON.parse(window.localStorage.getItem(key))).toEqual(value);
        });

        it('should NOT save a value under an existing key if overwrite is false and should return false', () => {
            // Arrange
            const key = 'key';
            const value = { value: 'value' };
            const initialValue = 'initial-value';

            window.localStorage.setItem(key, initialValue);

            // Act
            const result = service.save(key, value, false);

            // Assert
            expect(result).toBeFalse();
            expect(window.localStorage.getItem(key)).toEqual(initialValue);
        });

        it('should save a string value under a new key and return true', () => {
            // Arrange
            const key = 'key';
            const value = 'value';

            // Act
            const result = service.save(key, value, true);

            // Assert
            expect(result).toBeTrue();
            expect(window.localStorage.getItem(key)).toEqual(value);
        });
    });

    describe('load', () => {
        it('should load a value from a key', () => {
            // Arrange
            const key = 'key';
            const value = { value: 'value' };
            window.localStorage.setItem(key, JSON.stringify(value));

            // Act
            const result = service.load('key');

            // Assert
            expect(result).toEqual(value);
        });

        it('should return undefined if the key cannot be found', () => {
            // Act
            const result = service.load('key');

            // Assert
            expect(result).toBeUndefined();
        });

        it('should load a true boolean value from a key', () => {
            // Arrange
            const key = 'key';
            const value = 'true';
            window.localStorage.setItem(key, value);

            // Act
            const result = service.load<boolean>('key');

            // Assert
            expect(result).toBeTrue();
        });

        it('should load a false boolean value from a key', () => {
            // Arrange
            const key = 'key';
            const value = 'false';
            window.localStorage.setItem(key, value);

            // Act
            const result = service.load<boolean>('key');

            // Assert
            expect(result).toBeFalse();
        });
    });
});
