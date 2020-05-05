import { CanDeactivate } from '@angular/router';
import { CanDeactiveComponent } from 'src/app/shared/guards/changes.guard';
export class MockChangesGuard implements CanDeactivate<CanDeactiveComponent> {
    private flag: boolean;
    canDeactivate() {
        return this.flag;
    }
    setflag(flag: boolean) {
        this.flag = flag;
    }
}
