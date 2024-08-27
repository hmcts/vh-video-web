using System;
using System.Threading;
using System.Threading.Tasks;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Models;
using VideoWeb.EventHub.Services;

namespace VideoWeb.Helpers
{
    public class ConferenceVideoControlStatusService : IConferenceVideoControlStatusService
    {
        private readonly IConferenceVideoControlStatusCache _conferenceVideoControlStatusCache;

        public ConferenceVideoControlStatusService(IConferenceVideoControlStatusCache conferenceVideoControlStatusCache)
        {
            _conferenceVideoControlStatusCache = conferenceVideoControlStatusCache;
        }

        public async Task UpdateMediaStatusForParticipantInConference(Guid conferenceId, string participantId,
            ParticipantMediaStatus mediaStatus, CancellationToken cancellationToken = default)
        {
            var conferenceVideoControlStatuses = await _conferenceVideoControlStatusCache.ReadFromCache(conferenceId) ?? new ConferenceVideoControlStatuses();

            if (conferenceVideoControlStatuses.ParticipantIdToVideoControlStatusMap.ContainsKey(participantId))
            {
                conferenceVideoControlStatuses.ParticipantIdToVideoControlStatusMap[participantId].IsLocalAudioMuted = mediaStatus.IsLocalAudioMuted;
                conferenceVideoControlStatuses.ParticipantIdToVideoControlStatusMap[participantId].IsLocalVideoMuted = mediaStatus.IsLocalVideoMuted;
            }
            else
            {
                conferenceVideoControlStatuses.ParticipantIdToVideoControlStatusMap.Add(participantId, new VideoControlStatus()
                {
                    IsSpotlighted = false,
                    IsLocalAudioMuted = mediaStatus.IsLocalAudioMuted,
                    IsLocalVideoMuted = mediaStatus.IsLocalVideoMuted
                });
            }

            await _conferenceVideoControlStatusCache.WriteToCache(conferenceId, conferenceVideoControlStatuses);
        }
        
        public async Task SetVideoControlStateForConference(Guid conferenceId,
            ConferenceVideoControlStatuses? conferenceVideoControlStatuses, CancellationToken cancellationToken = default)
        {
            await _conferenceVideoControlStatusCache.WriteToCache(conferenceId, conferenceVideoControlStatuses);
        }
        
        public async Task<ConferenceVideoControlStatuses?> GetVideoControlStateForConference(Guid conferenceId, CancellationToken cancellationToken = default)
        {
            return await _conferenceVideoControlStatusCache.ReadFromCache(conferenceId);
        }
    }
}
