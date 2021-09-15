import { convertToParamMap, ParamMap } from '@angular/router';

export class ActivatedRouteSnapshotMock {
    get queryParamMap(): ParamMap {
        return convertToParamMap({});
    }
}
