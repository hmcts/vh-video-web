#nullable enable
using System;
using System.Threading;
using System.Threading.Tasks;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Models;
using VideoWeb.EventHub.Services;

namespace VideoWeb.Helpers
{
    public class ConferenceVideoControlStatusService(
        IConferenceVideoControlStatusCache conferenceVideoControlStatusCache)
        : IConferenceVideoControlStatusService
    {
        public async Task UpdateMediaStatusForParticipantInConference(Guid conferenceId, string participantId,
            ParticipantMediaStatus mediaStatus, CancellationToken cancellationToken = default)
        {
            var conferenceVideoControlStatuses = await conferenceVideoControlStatusCache.ReadFromCache(conferenceId, cancellationToken) ?? new ConferenceVideoControlStatuses();

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

            await conferenceVideoControlStatusCache.WriteToCache(conferenceId, conferenceVideoControlStatuses, cancellationToken);
        }
        
        public async Task SetVideoControlStateForConference(Guid conferenceId,
            ConferenceVideoControlStatuses? conferenceVideoControlStatuses, CancellationToken cancellationToken = default)
        {
            await conferenceVideoControlStatusCache.WriteToCache(conferenceId, conferenceVideoControlStatuses, cancellationToken);
        }
        
        public async Task<ConferenceVideoControlStatuses?> GetVideoControlStateForConference(Guid conferenceId, CancellationToken cancellationToken = default)
        {
            return await conferenceVideoControlStatusCache.ReadFromCache(conferenceId, cancellationToken);
        }
    }
}
