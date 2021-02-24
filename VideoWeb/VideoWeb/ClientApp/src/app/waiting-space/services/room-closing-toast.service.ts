import { Injectable } from '@angular/core';
import { Logger } from 'src/app/services/logging/logger-base';
import { ActiveToast, ToastrService } from 'ngx-toastr';
import { Hearing } from 'src/app/shared/models/hearing';
import { RoomClosingToastComponent } from 'src/app/shared/toast/room-closing/room-closing-toast.component';

@Injectable()
export class RoomClosingToastrService {
    private readonly loggerPrefix = '[RoomClosingToastrService] -';

    currentToast: ActiveToast<RoomClosingToastComponent> = null;
    expiresAt: Date;

    toastsDismissed = 0;

    showFirstToastAtMins = 25.5;
    showSecondToastAtMins = 25;

    constructor(private logger: Logger, private toastr: ToastrService) { }

    /**
     * If conditions are met, show the "room closing" notification
     */
    // timeNow - we could still use this instead of the new Date() if it's easier for testing
    showRoomClosingAlert(hearing: Hearing, timeNow: Date) {
        if (hearing.isClosed() && !hearing.isExpired(hearing.actualCloseTime) && !this.currentToast && this.toastsDismissed < 2) {
            const expiryTime = hearing.retrieveExpiryTime();

            if (!expiryTime)
                return;

            const msToExpiry = expiryTime.valueOf() - (new Date()).valueOf();
            // console.error('expires in minutes: ', (msToExpiry / 1000) / 60);

            if (msToExpiry <= this.minsToMs(this.showFirstToastAtMins)) {
                if (this.toastsDismissed === 0) {
                    // this is the first toast
                    this.showToast(expiryTime);
                } else {
                    if (msToExpiry <= this.minsToMs(this.showSecondToastAtMins)) {
                        // show the second toast
                        this.showToast(expiryTime);
                    }
                }
            }
        }
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
        this.toastr.remove(this.currentToast.toastId);
        this.currentToast = null;
        this.toastsDismissed++;
    }

    // just for convenience
    private minsToMs(minutes: number) {
        return (minutes * 60) * 1000;
    }
}
