using System;
using VideoWeb.EventHub.Enums;

namespace VideoWeb.EventHub.Models
{
    public class Participant
    {
        public Guid Id { get; set; }
        public string UserId { get; set; }
        public UserRole Role { get; set; }
        public string DisplayName { get; set; }

        public bool IsJudge()
        {
            return Role == UserRole.Judge;
        }
    }
}