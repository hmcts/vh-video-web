import { SessionStorage } from './session-storage';

class ObjectStub {
    property: string;
}

describe('SessionStorage', () => {
    const storageKey = 'key';
    const storage = new SessionStorage<ObjectStub>(storageKey);

    beforeEach(() => {
        sessionStorage.removeItem(storageKey);
    });

    afterEach(() => {
        sessionStorage.removeItem(storageKey);
    });

    it('can set and read data from storage', () => {
        storage.set({ property: 'value' });
        const result = storage.get();
        expect(result.property).toBe('value');
    });

    it('should not set null or undefined data', () => {
        const data = null;
        storage.set(data);
        const result = storage.get();
        expect(result).toBeNull();
    });

    it('removes invalid keys after failing to read', () => {
        sessionStorage.setItem(storageKey, 'invalid json');

        expect(() => storage.get()).toThrow();
        expect(storage.get()).toBeNull();
    });

    it('returns null if no data is cached', () => {
        expect(storage.get()).toBeNull();
    });

    it('can clear any stored value', () => {
        storage.set({ property: 'value' });
        storage.clear();
        expect(storage.get()).toBeNull();
    });
});
