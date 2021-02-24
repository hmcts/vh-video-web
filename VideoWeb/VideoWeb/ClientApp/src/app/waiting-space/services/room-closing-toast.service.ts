import { Injectable } from '@angular/core';
import { Logger } from 'src/app/services/logging/logger-base';
import { ToastrService } from 'ngx-toastr';
import { Hearing } from 'src/app/shared/models/hearing';
import { RoomClosingToastComponent } from 'src/app/shared/toast/room-closing/room-closing-toast.component';
import * as moment from 'moment';

@Injectable()
export class RoomClosingToastrService {
    private readonly loggerPrefix = '[RoomClosingToastrService] -';

    protected durations: moment.Duration[] = [];
    protected roomClosingLastShown: moment.Moment;
    isCurrentlyShowingToast = false;

    constructor(private logger: Logger, private toastr: ToastrService) {
        const fiveMinsLeft = moment.duration(5, 'minutes');
        const thirtySecondsLeft = moment.duration(30, 'seconds');
        this.durations.push(fiveMinsLeft);
        this.durations.push(thirtySecondsLeft);

        this.roomClosingLastShown = moment.utc().subtract(5, 'minutes');
    }

    expiresAt: Date;
    /**
     * If conditions are met, show the "room closing" notification
     */
    public showRoomClosingAlert(hearing: Hearing, timeNow: Date) {
        const now = moment(timeNow);

        if (!this.shouldShowAlert(hearing)) {
            return;
        }

        const expiresAt = hearing.retrieveExpiryTime();
        const gates = this.getGates(expiresAt);

        if (!this.hasEarliestGateBeenPassed(gates, now)) {
            return;
        }

        if (!this.isGateBetweenLastShownTimeAndNowDate(gates, now)) {
            return;
        }

        this.showToast(hearing, now);
    }

    protected shouldShowAlert(hearing: Hearing): boolean {
        if (!hearing.isClosed()) {
            return false;
        }

        if (hearing.isExpired(hearing.actualCloseTime)) {
            return false;
        }

        if (this.isCurrentlyShowingToast) {
            return false;
        }

        return true;
    }

    protected getGates(expiresAt: Date): moment.Moment[] {
        const gates: moment.Moment[] = [];
        for (const duration of this.durations) {
            gates.push(moment(expiresAt).subtract(duration));
        }
        return gates;
    }

    protected hasEarliestGateBeenPassed(gates: moment.Moment[], now: moment.Moment): boolean {
        return now.isAfter(gates[0]);
    }

    protected isGateBetweenLastShownTimeAndNowDate(gates: moment.Moment[], now: moment.Moment): boolean {
        const found = gates.find(gate => {
            if (gate.isBetween(this.roomClosingLastShown, now)) {
                return gate;
            }
        });

        return found !== undefined;
    }

    protected showToast(expiryDate: Date) {
        this.logger.debug(`${this.loggerPrefix} creating 'showRoomClosingAlert' toastr notification`);

        this.roomClosingLastShown = now;
        this.isCurrentlyShowingToast = true;

        const toast = this.toastr.show('', '', {
            disableTimeOut: true,
            tapToDismiss: false,
            toastComponent: RoomClosingToastComponent
        });

        const roomClosingToast = toast.toastRef.componentInstance as RoomClosingToastComponent;
        roomClosingToast.roomClosingToastOptions = {
            onNoAction: async () => {
                this.roomClosingLastShown = moment.utc();
                this.isCurrentlyShowingToast = false;
            },
            expiryDate: expiryDate
        };
    }
}
