using System;

namespace VideoWeb.EventHub.Exceptions
{
#pragma warning disable S3925 // "ISerializable" should be implemented correctly
    public class ParticipantNotFoundException : Exception
    {
        public ParticipantNotFoundException(Guid conferenceId, string username) : base(
            $"{username} is not a participant in conference {conferenceId}")
        {
        }
        
        public ParticipantNotFoundException(Guid conferenceId, Guid participantId) : base(
            $"{participantId} is not a participant in conference {conferenceId}")
        {
        }
    }
}
