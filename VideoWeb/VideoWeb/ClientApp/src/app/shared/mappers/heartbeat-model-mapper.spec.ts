import { TestBed, inject } from '@angular/core/testing';
import {HeartbeatModelMapper} from './heartbeat-model-mapper';
import {EventsService} from '../../services/events.service';
import {Heartbeat} from '../models/heartbeat';

describe('HeartbeatModelMapper', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HeartbeatModelMapper]
    });
  });

  it('should map', inject([HeartbeatModelMapper], async (mapper: HeartbeatModelMapper) => {
    const heartbeat: any = {
      media_statistics: {
        outgoing: {
          audio: {}, video: {}
        },
        incoming: {
          audio: {}, video: {}
        }
      }
    };

    heartbeat.media_statistics.outgoing.audio['percentage-lost'] = '1%';
    heartbeat.media_statistics.outgoing.audio['percentage-lost-recent'] = '2%';
    heartbeat.media_statistics.incoming.audio['percentage-lost'] = '3%';
    heartbeat.media_statistics.incoming.audio['percentage-lost-recent'] = '4%';
    heartbeat.media_statistics.outgoing.video['percentage-lost'] = '5%';
    heartbeat.media_statistics.outgoing.video['percentage-lost-recent'] = '6%';
    heartbeat.media_statistics.incoming.video['percentage-lost'] = '7%';
    heartbeat.media_statistics.incoming.video['percentage-lost-recent'] = '8%';

    const browserName = 'chrome';
    const browserVersion = 'v1.0.1';

    const result = mapper.map(heartbeat, browserName, browserVersion);

    expect(result).not.toBeNull();
    expect(result.outgoingAudioPercentageLost).toBe('1');
    expect(result.outgoingAudioPercentageLostRecent).toBe('2');
    expect(result.incomingAudioPercentageLost).toBe('3');
    expect(result.incomingAudioPercentageLostRecent).toBe('4');
    expect(result.outgoingVideoPercentageLost).toBe('5');
    expect(result.outgoingVideoPercentageLostRecent).toBe('6');
    expect(result.incomingVideoPercentageLost).toBe('7');
    expect(result.incomingVideoPercentageLostRecent).toBe('8');
    expect(result.browserName).toBe(browserName);
    expect(result.browserVersion).toBe(browserVersion);
  }));
});
