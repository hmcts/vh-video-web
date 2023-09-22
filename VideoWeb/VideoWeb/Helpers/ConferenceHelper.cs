using System;
using VideoApi.Contract.Enums;
using VideoWeb.Common.Models;

namespace VideoWeb.Helpers
{
    public static class ConferenceHelper
    {
        public static ConferenceStatus GetConferenceStatus(ConferenceState state)
        {
            if (!Enum.TryParse(state.ToString(), true, out ConferenceStatus status))
            {
                status = ConferenceStatus.NotStarted;
            }

            return status;
        }
    }
}
