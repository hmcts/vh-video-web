using System.Collections.Generic;

namespace VideoWeb.Common.Models;

public class ConferenceVideoControlStatuses
{
    public Dictionary<string, VideoControlStatus> ParticipantIdToVideoControlStatusMap { get; set; } = new();
    
    public int CompareTo(ConferenceVideoControlStatuses comparisonConferenceVideoControlStatuses)
    {
        foreach (var (key, videoControlStatus) in ParticipantIdToVideoControlStatusMap)
        {
            var comparisonvideoControlStatus = comparisonConferenceVideoControlStatuses.ParticipantIdToVideoControlStatusMap[key];
            if (videoControlStatus.CompareTo(comparisonvideoControlStatus) <= 0)
            {
                return 0;
            }
        }
        return  1;
    }
}
