using System;
using System.Collections.Generic;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class SetConferenceVideoControlStatusesRequestMapper : IMapTo<SetConferenceVideoControlStatusesRequest, ConferenceVideoControlStatuses>
    {
        public ConferenceVideoControlStatuses Map(SetConferenceVideoControlStatusesRequest input)
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
}
