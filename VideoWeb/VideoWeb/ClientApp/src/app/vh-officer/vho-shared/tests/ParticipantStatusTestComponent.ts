import { Component } from '@angular/core';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ParticipantStatusReader } from 'src/app/shared/models/participant-status-reader';
import { ParticipantStatusDirective } from '../participant-status-base/participant-status-base.component';

@Component({
    selector: 'app-test-participant-status',
    template: ''
})
export class ParticipantStatusTestComponent extends ParticipantStatusDirective {
    constructor(
        protected videoWebService: VideoWebService,
        protected errorService: ErrorService,
        protected eventService: EventsService,
        protected logger: Logger,
        protected participantStatusReader: ParticipantStatusReader
    ) {
        super(videoWebService, errorService, eventService, logger, participantStatusReader);
    }
}
