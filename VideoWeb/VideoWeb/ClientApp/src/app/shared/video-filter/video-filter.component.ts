import { Component } from '@angular/core';
import { Logger } from 'src/app/services/logging/logger-base';
import { BackgroundFilter } from 'src/app/services/models/background-filter';
import { VideoFilterService } from 'src/app/services/video-filter.service';

@Component({
    selector: 'app-video-filter',
    templateUrl: './video-filter.component.html',
    styleUrls: ['./video-filter.component.css']
})
export class VideoFilterComponent {
    private readonly loggerPrefix = '[VideoFilter] -';
    filters = [
        { name: 'blur', value: BackgroundFilter.blur },
        { name: 'HMCTS', value: BackgroundFilter.HMCTS },
        { name: 'SCTS', value: BackgroundFilter.SCTS }
    ];

    constructor(private videoFilterService: VideoFilterService, private logger: Logger) {}

    backgroundChanged(e: Event) {
        const filter = BackgroundFilter[(e.target as HTMLInputElement).value];
        this.logger.info(`${this.loggerPrefix} filter dropdown changed ${filter}`);
        this.videoFilterService.updateFilter(filter);
    }
}
