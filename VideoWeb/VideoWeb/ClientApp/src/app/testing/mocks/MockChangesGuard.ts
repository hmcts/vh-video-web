import { CanDeactivate } from '@angular/router';
import { CanDeactiveComponent } from 'src/app/common/guards/changes.guard';
export class MockChangesGuard implements CanDeactivate<CanDeactiveComponent> {
  private _flag: boolean;
  canDeactivate() {
    return this._flag;
  }
  setflag(flag: boolean) {
    this._flag = flag;
  }
}
