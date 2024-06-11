import { Logger } from 'src/app/services/logging/logger-base';

export class DeviceDetectionService {
    constructor(
        protected logger: Logger,
        protected loggerPrefix: string
    ) {}

    isMobileIOSDevice(): boolean {
        const userAgent = navigator.userAgent || (window as any).opera;
        this.logger.info(`${this.loggerPrefix} Checking if user agent is mobile iOS device`, { userAgent: userAgent });

        if (/iPad|iPhone/.test(userAgent) && !(window as any).MSStream) {
            return true;
        }

        return false;
    }
}
