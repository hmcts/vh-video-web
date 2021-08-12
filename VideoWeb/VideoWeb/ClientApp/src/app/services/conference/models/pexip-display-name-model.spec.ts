import { invalidPexipDisplayNameFormatError } from '../errors/invalid-pexip-display-name-format.error';
import { HeartbeatMode } from './heartbeat-mode.model';
import { PexipDisplayNameModel } from './pexip-display-name.model';

describe('PexipDisplayNameModel', () => {
    describe('fromString', () => {
        it('should parse the string into the model when no heartbeat is set', () => {
            // Arrange
            const role = 'ROLE';
            const heartbeat = HeartbeatMode.NoHeartbeat;
            const displayName = 'DISPLAY_NAME';
            const id = 'ID';
            const toParse = `${role};${heartbeat};${displayName};${id}`;

            // Act
            const model = PexipDisplayNameModel.fromString(toParse);

            // Assert
            expect(model.pexipRole).toEqual(role);
            expect(model.heartbeatMode).toEqual(heartbeat);
            expect(model.displayName).toEqual(displayName);
            expect(model.participantOrVmrId).toEqual(id);
        });

        it('should should throw if the format is incorrect', () => {
            // Arrange
            const pexipDisplayName = `A;B`;

            // Act & Assert
            expect(() => PexipDisplayNameModel.fromString(pexipDisplayName)).toThrow(invalidPexipDisplayNameFormatError(pexipDisplayName));
        });

        it('should parse the string into the model when heartbeat is set', () => {
            // Arrange
            const role = 'ROLE';
            const heartbeat = HeartbeatMode.Heartbeat;
            const displayName = 'DISPLAY_NAME';
            const id = 'ID';
            const toParse = `${role};${heartbeat};${displayName};${id}`;
            console.log(HeartbeatMode);

            // Act
            const model = PexipDisplayNameModel.fromString(toParse);

            // Assert
            expect(model.pexipRole).toEqual(role);
            expect(model.heartbeatMode).toEqual(heartbeat);
            expect(model.displayName).toEqual(displayName);
            expect(model.participantOrVmrId).toEqual(id);
        });

        it('should parse the string into the model when no heartbeat mode is provided', () => {
            // Arrange
            const role = 'ROLE';
            const displayName = 'DISPLAY_NAME';
            const id = 'ID';
            const toParse = `${role};${displayName};${id}`;

            const expectedHeartbeat = HeartbeatMode.NoHeartbeat;

            // Act
            const model = PexipDisplayNameModel.fromString(toParse);

            // Assert
            expect(model.pexipRole).toEqual(role);
            expect(model.heartbeatMode).toEqual(expectedHeartbeat);
            expect(model.displayName).toEqual(displayName);
            expect(model.participantOrVmrId).toEqual(id);
        });
    });

    describe('toString', () => {
        it('should convert the model into a string no heartbeat is set', () => {
            // Arrange
            const role = 'ROLE';
            const heartbeat = HeartbeatMode.NoHeartbeat;
            const displayName = 'DISPLAY_NAME';
            const id = 'ID';
            const expectedString = `${role};${heartbeat};${displayName};${id}`;

            // Act
            const displayNameString = new PexipDisplayNameModel(role, displayName, id, heartbeat).toString();

            // Assert
            expect(displayNameString).toEqual(expectedString);
        });

        it('should convert the model into a string a heartbeat is set', () => {
            // Arrange
            const role = 'ROLE';
            const heartbeat = HeartbeatMode.Heartbeat;
            const displayName = 'DISPLAY_NAME';
            const id = 'ID';
            const expectedString = `${role};${heartbeat};${displayName};${id}`;

            // Act
            const displayNameString = new PexipDisplayNameModel(role, displayName, id, heartbeat).toString();

            // Assert
            expect(displayNameString).toEqual(expectedString);
        });
    });
});
