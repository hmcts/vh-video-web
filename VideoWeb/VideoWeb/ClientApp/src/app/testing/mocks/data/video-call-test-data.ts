import { Guid } from 'guid-typescript';

export class VideoCallTestData {
    getExamplePexipParticipant(displayName: string = null): PexipParticipant {
        const pexipParticipant: PexipParticipant = {
            buzz_time: 0,
            call_tag: Guid.create().toString(),
            display_name: `T1;John Doe;${Guid.create().toString()}`,
            has_media: true,
            is_audio_only_call: 'No',
            is_muted: 'Yes',
            is_external: false,
            is_video_call: 'Yes',
            mute_supported: 'Yes',
            local_alias: null,
            start_time: new Date().getTime(),
            uuid: Guid.create().toString(),
            spotlight: 0,
            external_node_uuid: null,
            protocol: 'webrtc'
        };
        if (displayName) {
            pexipParticipant.display_name = displayName;
        }
        return pexipParticipant;
    }
}
