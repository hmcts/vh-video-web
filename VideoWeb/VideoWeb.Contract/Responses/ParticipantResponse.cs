using System;

namespace VideoWeb.Contract.Responses
{
    public class ParticipantResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Username { get; set; }
        public UserRole Role { get; set; }
        public ParticipantStatus Status { get; set; }
    }
}