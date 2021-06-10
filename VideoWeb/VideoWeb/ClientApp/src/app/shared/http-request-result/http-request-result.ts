import { Observable } from 'rxjs';

export interface IHttpRequestResult<TResult> {
    status: number;
    result: TResult;
    error: any;
}

export function toHttpRequestResult<TResult>() {
    return function (source: Observable<TResult>): Observable<IHttpRequestResult<TResult>> {
        return new Observable<IHttpRequestResult<TResult>>(subscriber => {
            return source.subscribe({
                next(value) {
                    subscriber.next({ status: 200, result: value, error: null });
                },
                error(err) {
                    subscriber.next({ status: err?.status, result: null, error: err });
                },
                complete() {
                    subscriber.complete();
                }
            });
        });
    };
}
