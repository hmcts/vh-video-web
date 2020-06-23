import { HeartbeatModelMapper } from './heartbeat-model-mapper';

describe('HeartbeatModelMapper', () => {
    let mapper: HeartbeatModelMapper;
    beforeEach(() => {
        mapper = new HeartbeatModelMapper();
    });

    it('should map', () => {
        const heartbeat: any = {
            media_statistics: {
                outgoing: {
                    audio: {},
                    video: {}
                },
                incoming: {
                    audio: {},
                    video: {}
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
    });

    it('should map with no package loss values', () => {
        const heartbeat: any = {
            media_statistics: {
                outgoing: {
                    audio: {},
                    video: {}
                },
                incoming: {
                    audio: {},
                    video: {}
                }
            }
        };

        heartbeat.media_statistics.outgoing.audio['percentage-lost'] = '';
        heartbeat.media_statistics.outgoing.audio['percentage-lost-recent'] = '';
        heartbeat.media_statistics.incoming.audio['percentage-lost'] = '';
        heartbeat.media_statistics.incoming.audio['percentage-lost-recent'] = undefined;
        heartbeat.media_statistics.outgoing.video['percentage-lost'] = null;
        heartbeat.media_statistics.outgoing.video['percentage-lost-recent'] = ' ';
        heartbeat.media_statistics.incoming.video['percentage-lost'] = '';
        heartbeat.media_statistics.incoming.video['percentage-lost-recent'] = '%';

        const browserName = 'chrome';
        const browserVersion = 'v1.0.1';
        const result = mapper.map(heartbeat, browserName, browserVersion);

        expect(result).not.toBeNull();
        expect(result.outgoingAudioPercentageLost).toBe('0');
        expect(result.outgoingAudioPercentageLostRecent).toBe('0');
        expect(result.incomingAudioPercentageLost).toBe('0');
        expect(result.incomingAudioPercentageLostRecent).toBe('0');
        expect(result.outgoingVideoPercentageLost).toBe('0');
        expect(result.outgoingVideoPercentageLostRecent).toBe('0');
        expect(result.incomingVideoPercentageLost).toBe('0');
        expect(result.incomingVideoPercentageLostRecent).toBe('0');
        expect(result.browserName).toBe(browserName);
        expect(result.browserVersion).toBe(browserVersion);
    });
});
