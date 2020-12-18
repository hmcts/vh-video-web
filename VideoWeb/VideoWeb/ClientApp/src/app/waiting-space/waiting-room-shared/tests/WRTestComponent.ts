import { ActivatedRoute, Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ClockService } from 'src/app/services/clock.service';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { UserMediaStreamService } from 'src/app/services/user-media-stream.service';
import { UserMediaService } from 'src/app/services/user-media.service';
import { HeartbeatModelMapper } from 'src/app/shared/mappers/heartbeat-model-mapper';
import { NotificationSoundsService } from '../../services/notification-sounds.service';
import { VideoCallService } from '../../services/video-call.service';
import { WaitingRoomBaseComponent } from '../waiting-room-base.component';

export class WRTestComponent extends WaitingRoomBaseComponent {
    constructor(
        protected route: ActivatedRoute,
        protected videoWebService: VideoWebService,
        protected eventService: EventsService,
        protected adalService: AdalService,
        protected logger: Logger,
        protected errorService: ErrorService,
        protected heartbeatMapper: HeartbeatModelMapper,
        protected videoCallService: VideoCallService,
        protected deviceTypeService: DeviceTypeService,
        protected router: Router,
        protected consultationService: ConsultationService,
        private clockService: ClockService,
        protected userMediaService: UserMediaService,
        protected userMediaStreamService: UserMediaStreamService,
        protected notificationSoundsService: NotificationSoundsService
    ) {
        super(
            route,
            videoWebService,
            eventService,
            adalService,
            logger,
            errorService,
            heartbeatMapper,
            videoCallService,
            deviceTypeService,
            router,
            consultationService,
            userMediaService,
            userMediaStreamService,
            notificationSoundsService
        );
    }
}
