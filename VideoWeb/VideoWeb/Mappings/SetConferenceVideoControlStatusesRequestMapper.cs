using System.Collections.Generic;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;

namespace VideoWeb.Mappings;

public static class SetConferenceVideoControlStatusesRequestMapper
{
    public static ConferenceVideoControlStatuses Map(SetConferenceVideoControlStatusesRequest input)
    {
        if (input == null)
        {
            return null;
        }
        
        var conferenceVideoControlStatusesMap = new Dictionary<string, VideoControlStatus>();
        foreach (var (key, value) in input.ParticipantIdToVideoControlStatusMap)
        {
            conferenceVideoControlStatusesMap.Add(key, new VideoControlStatus()
            {
                IsHandRaised = value.IsHandRaised,
                IsRemoteMuted  = value.IsRemoteMuted,
                IsSpotlighted = value.IsSpotlighted,
                IsLocalAudioMuted = value.IsLocalAudioMuted,
                IsLocalVideoMuted = value.IsLocalVideoMuted
            });
        }
        
        return new ConferenceVideoControlStatuses
        {
            ParticipantIdToVideoControlStatusMap = conferenceVideoControlStatusesMap
        };
    }
}
