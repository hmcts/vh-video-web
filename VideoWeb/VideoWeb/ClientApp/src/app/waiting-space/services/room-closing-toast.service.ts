import { Injectable } from '@angular/core';
import { Logger } from 'src/app/services/logging/logger-base';
import { ActiveToast, ToastrService } from 'ngx-toastr';
import { Hearing } from 'src/app/shared/models/hearing';
import { RoomClosingToastComponent } from 'src/app/shared/toast/room-closing/room-closing-toast.component';
import * as moment from 'moment';

@Injectable()
export class RoomClosingToastrService {
    private readonly loggerPrefix = '[RoomClosingToastrService] -';
    //protected durations: moment.Duration[] = [];

    currentToast: ActiveToast<RoomClosingToastComponent> = null;
    expiresAt: Date;
    gates: Date[] = [];
    shownGates: Date[] = [];

    constructor(private logger: Logger, private toastr: ToastrService) {}

    /**
     * If conditions are met, show the "room closing" notification
     */
    public showRoomClosingAlert(hearing: Hearing, timeNow: Date) {
        console.error('--> showRoomClosingAlert');
        if (this.currentToast) {
            return;
        }

        if (!this.gates.length) {
            if (hearing.isClosed() && !hearing.isExpired(hearing.actualCloseTime)) {
                this.expiresAt = hearing.retrieveExpiryTime();
                this.gates = this.setGates(this.expiresAt);
            } else {
                return;
            }
        }

        console.warn('gates.length: ' + this.gates.length);
        var pastGates = this.gates.filter(gate => {
            return timeNow.valueOf() > gate.valueOf();
        });
        console.warn('pastGates.length: ' + pastGates.length);
        if (pastGates.length === 0) {
            console.error('3x');
            return;
        }

        if (pastGates.length !== this.shownGates.length && !this.currentToast) {
            console.error('show it');
            this.shownGates = pastGates;
            this.showToast(this.expiresAt);
        }
        console.error('<-- showRoomClosingAlert');
    }

    setGates(expiresAt: Date): Date[] {
        const durations: moment.Duration[] = [];

        // const fiveMinsLeft = moment.duration(5, 'minutes');
        // const thirtySecondsLeft = moment.duration(30, 'seconds');
        // durations.push(fiveMinsLeft);
        // durations.push(thirtySecondsLeft);

        for (let i = 29; i > 0; i--) {
            const xMinsLeft = moment.duration(1, 'minutes');
            durations.push(xMinsLeft);
        }

        const gates: Date[] = [];
        for (const duration of durations) {
            gates.push(moment(expiresAt).subtract(duration).toDate());
        }
        return gates;
    }

    showToast(expiryDate: Date) {
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
                    action: async () => this.onToastClosed()
                }
            ],
            expiryDate: expiryDate
        };
    }

    onToastClosed(): void {
        console.error('--> onToastClosed');
        this.toastr.remove(this.currentToast.toastId);
        this.currentToast = null;
        console.error('<-- onToastClosed');
    }
}
