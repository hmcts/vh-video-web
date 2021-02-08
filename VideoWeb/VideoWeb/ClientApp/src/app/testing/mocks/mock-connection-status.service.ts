import { of } from 'rxjs';
import { ConnectionStatusService } from 'src/app/services/connection-status.service';

export function connectionStatusServiceSpyFactory(): jasmine.SpyObj<ConnectionStatusService> {
    return jasmine.createSpyObj<ConnectionStatusService>(
        'ConnectionStatusService',
        {},
        {
            get status() {
                return true;
            },
            onConnectionStatusChange() {
                return of(true);
            },
            checkNow() {}
        }
    );
}
