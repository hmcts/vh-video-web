import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { startWith, takeUntil } from 'rxjs/operators';
import { Logger } from 'src/app/services/logging/logger-base';
import { BackgroundFilter } from 'src/app/services/models/background-filter';
import { VideoFilterService } from 'src/app/services/video-filter.service';

@Component({
    selector: 'app-video-filter',
    templateUrl: './video-filter.component.html',
    styleUrls: ['./video-filter.component.scss']
})
export class VideoFilterComponent implements OnInit, OnDestroy {
    destroy$: Subject<boolean> = new Subject<boolean>();
    private readonly loggerPrefix = '[VideoFilter] -';
    vBG = BackgroundFilter;
    activeFilter: BackgroundFilter;
    filterOn: boolean;
    showOptions: boolean;

    constructor(private videoFilterService: VideoFilterService, private logger: Logger) {}

    ngOnInit(): void {
        this.showOptions = false;
        this.initCurrentFilter();
    }

    private initCurrentFilter() {
        this.videoFilterService.onFilterChanged
            .pipe(startWith(this.videoFilterService.activeFilter), takeUntil(this.destroy$))
            .subscribe(newFilter => {
                if (newFilter) {
                    this.activeFilter = newFilter;
                    this.filterOn = true;
                } else {
                    this.filterOn = false;
                }
            });
    }

    ngOnDestroy() {
        this.destroy$.next(true);
        this.destroy$.unsubscribe();
    }

    backgroundChanged(e: Event) {
        const filter = BackgroundFilter[(e.target as HTMLInputElement).value];
        this.logger.info(`${this.loggerPrefix} filter dropdown changed ${filter}`);
        this.videoFilterService.updateFilter(filter);
    }

    toggleDisplayOptions() {
        this.showOptions = !this.showOptions;
    }
}
