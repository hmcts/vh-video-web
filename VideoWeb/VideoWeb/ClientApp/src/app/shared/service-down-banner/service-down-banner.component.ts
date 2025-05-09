import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FEATURE_FLAGS, LaunchDarklyService } from 'src/app/services/launch-darkly.service';

@Component({
    selector: 'app-service-down-banner',
    standalone: false,
    templateUrl: './service-down-banner.component.html',
    styleUrl: './service-down-banner.component.scss'
})
export class ServiceDownBannerComponent implements OnInit, OnDestroy {
    serviceDownBannerText = '';

    private onDestroy = new Subject<void>();

    constructor(private ldService: LaunchDarklyService) {}

    ngOnInit(): void {
        this.ldService
            .getFlag<string>(FEATURE_FLAGS.serviceUpdateText)
            .pipe(takeUntil(this.onDestroy))
            .subscribe((text: string) => {
                this.serviceDownBannerText = text;
            });
    }

    ngOnDestroy(): void {
        this.onDestroy.next();
        this.onDestroy.complete();
    }
}
