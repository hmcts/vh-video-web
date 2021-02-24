import { Injectable } from '@angular/core';
import { Logger } from 'src/app/services/logging/logger-base';
import { ActiveToast, ToastrService } from 'ngx-toastr';
import { Hearing } from 'src/app/shared/models/hearing';
import { RoomClosingToastComponent } from 'src/app/shared/toast/room-closing/room-closing-toast.component';
import * as moment from 'moment';

@Injectable()
export class RoomClosingToastrService {
    private readonly loggerPrefix = '[RoomClosingToastrService] -';

    currentToast: ActiveToast<RoomClosingToastComponent> = null;
    expiresAt: Date;
    gates: Date[] = [];
    shownGates: Date[] = [];

    constructor(private logger: Logger, private toastr: ToastrService) {}

    /**
     * If conditions are met, show the "room closing" notification
     */
    public showRoomClosingAlert(hearing: Hearing, timeNow: Date) {
        if (this.currentToast) {
            return;
        }

        if (!this.expiresAt) {
            if (hearing.isClosed() && !hearing.isExpired(hearing.actualCloseTime)) {
                this.expiresAt = hearing.retrieveExpiryTime();
                this.gates = this.getGates(this.getDurations(), this.expiresAt);
            } else {
                return;
            }
        }

        const pastGates = this.getPastGates(timeNow);
        if (!pastGates.length || pastGates.length === this.shownGates.length) {
            return;
        }

        this.shownGates = pastGates;
        this.showToast(this.expiresAt);
    }

    protected getDurations(): moment.Duration[] {
        const durations: moment.Duration[] = [];

        // for (let i = 29; i > 0; i--) {
        //     const xMinsLeft = moment.duration(i, 'minutes');
        //     durations.push(xMinsLeft);
        // }

        const fiveMinsLeft = moment.duration(5, 'minutes');
        const thirtySecondsLeft = moment.duration(30, 'seconds');
        durations.push(fiveMinsLeft);
        durations.push(thirtySecondsLeft);

        return durations;
    }

    protected getGates(durations: moment.Duration[], expiresAt: Date): Date[] {
        const gates: Date[] = [];
        for (const duration of durations) {
            const dateMoment = moment(expiresAt).subtract(duration);
            const date = dateMoment.toDate();
            gates.push(date);
        }
        return gates;
    }

    protected getPastGates(timeNow: Date): Date[] {
        return this.gates.filter(gate => {
            return timeNow.valueOf() > gate.valueOf();
        });
    }

    protected showToast(expiryDate: Date): void {
        this.logger.debug(`${this.loggerPrefix} creating 'showRoomClosingAlert' toastr notification`);

        this.currentToast = this.toastr.show('', '', {
            disableTimeOut: true,
            tapToDismiss: false,
            toastComponent: RoomClosingToastComponent
        });

        const roomClosingToast = this.currentToast.toastRef.componentInstance as RoomClosingToastComponent;
        roomClosingToast.roomClosingToastOptions = {
            buttons: [
                {
                    label: 'Dismiss',
                    hoverColour: 'green',
                    action: async () => {
                        this.onToastClosed(new Date());
                    }
                }
            ],
            expiryDate: expiryDate
        };
    }

    protected onToastClosed(timeNow: Date): void {
        this.toastr.remove(this.currentToast.toastId);
        this.shownGates = this.getPastGates(timeNow);
        this.currentToast = null;
    }
}
