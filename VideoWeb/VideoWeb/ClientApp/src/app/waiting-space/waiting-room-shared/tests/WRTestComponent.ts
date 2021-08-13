import { ActivatedRoute, Router } from '@angular/router';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ClockService } from 'src/app/services/clock.service';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { HeartbeatModelMapper } from 'src/app/shared/mappers/heartbeat-model-mapper';
import { NotificationSoundsService } from '../../services/notification-sounds.service';
import { VideoCallService } from '../../services/video-call.service';
import { WaitingRoomBaseDirective } from '../waiting-room-base.component';
import { NotificationToastrService } from 'src/app/waiting-space/services/notification-toastr.service';
import { RoomClosingToastrService } from 'src/app/waiting-space/services/room-closing-toast.service';
import { ConsultationInvitationService } from '../../services/consultation-invitation.service';
import { Component } from '@angular/core';

@Component({
    selector: 'app-test-waiting-room',
    template: ''
})
export class WRTestComponent extends WaitingRoomBaseDirective {
    constructor(
        protected route: ActivatedRoute,
        protected videoWebService: VideoWebService,
        protected eventService: EventsService,
        protected logger: Logger,
        protected errorService: ErrorService,
        protected heartbeatMapper: HeartbeatModelMapper,
        protected videoCallService: VideoCallService,
        protected deviceTypeService: DeviceTypeService,
        protected router: Router,
        protected consultationService: ConsultationService,
        protected notificationSoundsService: NotificationSoundsService,
        protected notificationToastrService: NotificationToastrService,
        protected roomClosingToastrService: RoomClosingToastrService,
        protected clockService: ClockService,
        protected consultationInvitiationService: ConsultationInvitationService
    ) {
        super(
            route,
            videoWebService,
            eventService,
            logger,
            errorService,
            heartbeatMapper,
            videoCallService,
            deviceTypeService,
            router,
            consultationService,
            notificationSoundsService,
            notificationToastrService,
            roomClosingToastrService,
            clockService,
            consultationInvitiationService
        );
    }
}
