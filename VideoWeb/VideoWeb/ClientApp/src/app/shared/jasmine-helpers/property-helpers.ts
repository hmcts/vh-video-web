export function getSpiedPropertyGetter<T, K extends keyof T>(spyObj: jasmine.SpyObj<T>, propName: K): jasmine.Spy<() => T[K]> {
    return Object.getOwnPropertyDescriptor(spyObj, propName)?.get as jasmine.Spy<() => T[K]>;
}

export function getSpiedPropertySetter<T, K extends keyof T, TValue>(
    spyObj: jasmine.SpyObj<T>,
    propName: K
): jasmine.Spy<(value: TValue) => void> {
    return Object.getOwnPropertyDescriptor(spyObj, propName)?.set as jasmine.Spy<(value: TValue) => void>;
}
