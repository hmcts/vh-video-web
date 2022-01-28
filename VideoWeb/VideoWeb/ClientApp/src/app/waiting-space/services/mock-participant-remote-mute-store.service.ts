import { Subject } from 'rxjs';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { IConferenceParticipantsStatus } from '../models/conference-participants-status';
import { ParticipantRemoteMuteStoreService } from './participant-remote-mute-store.service';

export const conferenceParticipantsStatusSubject = new Subject<IConferenceParticipantsStatus>();
export const createParticipantRemoteMuteStoreServiceSpy = () => {
    const spy = jasmine.createSpyObj<ParticipantRemoteMuteStoreService>(
        ['updateRemoteMuteStatus', 'updateLocalMuteStatus', 'assignPexipId'],
        ['conferenceParticipantsStatus$']
    );
    getSpiedPropertyGetter(spy, 'conferenceParticipantsStatus$').and.returnValue(conferenceParticipantsStatusSubject.asObservable());

    return spy;
};
