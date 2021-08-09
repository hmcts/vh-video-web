import { Component, OnInit } from '@angular/core';
import { Logger } from 'src/app/services/logging/logger-base';
import { BackgroundFilter } from 'src/app/services/models/background-filter';
import { VideoFilterService } from 'src/app/services/video-filter.service';

@Component({
    selector: 'app-video-filter',
    templateUrl: './video-filter.component.html',
    styleUrls: ['./video-filter.component.css']
})
export class VideoFilterComponent implements OnInit {
    private readonly loggerPrefix = '[VideoFilter] -';
    filters: FilterDto[] = [
        new FilterDto('none', 'none'),
        new FilterDto('blur', BackgroundFilter.blur),
        new FilterDto('HMCTS', BackgroundFilter.HMCTS),
        new FilterDto('SCTS', BackgroundFilter.SCTS)
    ];

    constructor(private videoFilterService: VideoFilterService, private logger: Logger) {}

    ngOnInit(): void {
        if (this.videoFilterService.filterOn) {
            this.filters.find(x => x.value === this.videoFilterService.activeFilter).selected = true;
        } else {
            this.filters[0].selected = true;
        }
    }

    backgroundChanged(e: Event) {
        const filter = BackgroundFilter[(e.target as HTMLInputElement).value];
        this.logger.info(`${this.loggerPrefix} filter dropdown changed ${filter}`);
        this.videoFilterService.updateFilter(filter);
    }
}

class FilterDto {
    constructor(public name: string, public value: any, public selected = false) {}
}
