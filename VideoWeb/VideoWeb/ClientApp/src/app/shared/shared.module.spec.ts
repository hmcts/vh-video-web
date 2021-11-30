import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { SharedModule } from './shared.module';

describe('SharedModule', () => {
    let librarySpy: jasmine.SpyObj<FaIconLibrary>;
    let module: SharedModule;

    beforeEach(() => {
        librarySpy = jasmine.createSpyObj<FaIconLibrary>('FaIconLibrary', ['addIcons']);
        module = new SharedModule(librarySpy);
    });

    it('should call add icons', () => {
        expect(librarySpy.addIcons).toHaveBeenCalledTimes(1);
    });
});
