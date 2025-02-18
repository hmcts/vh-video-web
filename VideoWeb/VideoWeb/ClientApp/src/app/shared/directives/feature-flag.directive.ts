import { Directive, Input, OnDestroy, TemplateRef, ViewContainerRef } from '@angular/core';

import { Subscription } from 'rxjs';
import { FEATURE_FLAGS, LaunchDarklyService } from 'src/app/services/launch-darkly.service';

@Directive({
    standalone: false,
    selector: '[appFeatureFlag]'
})
export class FeatureFlagDirective implements OnDestroy {
    private subscription: Subscription;

    constructor(
        private templateRef: TemplateRef<any>,
        private viewContainer: ViewContainerRef,
        private launchDarklyService: LaunchDarklyService
    ) {}

    @Input() set appFeatureFlag(flagKey: keyof typeof FEATURE_FLAGS) {
        this.subscription?.unsubscribe();

        this.subscription = this.launchDarklyService.getFlag<boolean>(flagKey).subscribe(flagValue => {
            if (flagValue) {
                this.viewContainer.createEmbeddedView(this.templateRef);
            } else {
                this.viewContainer.clear();
            }
        });
    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
    }
}
