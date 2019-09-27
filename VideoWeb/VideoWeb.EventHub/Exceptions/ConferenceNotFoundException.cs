using System;

namespace VideoWeb.EventHub.Exceptions
{
    public class ConferenceNotFoundException : Exception
    {
        public ConferenceNotFoundException(Guid conferenceId) : base($"Conference {conferenceId} does not exist")
        {
        }
    }
}