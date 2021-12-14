using System;
using System.Collections.Generic;

namespace VideoWeb.Common.Models
{
    public class ConferenceVideoControlStatuses : IComparable<ConferenceVideoControlStatuses>
    {
        public ConferenceVideoControlStatuses()
        {
            ParticipantIdToVideoControlStatusMap = new Dictionary<string, VideoControlStatus>();
        }
        
        public Dictionary<string, VideoControlStatus> ParticipantIdToVideoControlStatusMap { get; set; }
        
        public int CompareTo(ConferenceVideoControlStatuses comparisonConferenceVideoControlStatuses)
        {
            bool areEqual = true;
            foreach (var (key, videoControlStatus) in ParticipantIdToVideoControlStatusMap)
            {
                var comparisonvideoControlStatus = comparisonConferenceVideoControlStatuses.ParticipantIdToVideoControlStatusMap[key];
                areEqual = areEqual && videoControlStatus.CompareTo(comparisonvideoControlStatus) > 0;
            }

            return areEqual ? 1 : 0;
        }
    }
}
