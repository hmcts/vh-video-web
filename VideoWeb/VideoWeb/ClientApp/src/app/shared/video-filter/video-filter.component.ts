import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
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
    activeFilter: BackgroundFilter | null;

    constructor(private videoFilterService: VideoFilterService, private logger: Logger) {}

    ngOnInit(): void {
        (<any>window).GOVUKFrontend.initAll();
        this.initCurrentFilter();
    }

    private initCurrentFilter() {
        this.activeFilter = this.videoFilterService.activeFilter;

        this.videoFilterService.onFilterChanged
            .pipe(
                takeUntil(this.destroy$),
                tap(x => console.log(`${this.loggerPrefix} Current filter selected ${x}`))
            )
            .subscribe(newFilter => {
                this.activeFilter = newFilter;
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
}

class FilterDto {
    constructor(public name: string, public value: any, public selected = false) {}
}
