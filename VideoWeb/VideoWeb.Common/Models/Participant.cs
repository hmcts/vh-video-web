using System;

namespace VideoWeb.Common.Models
{
    public class Participant
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Username { get; set; }
        public Role Role { get; set; }
        public ParticipantStatus ParticipantStatus { get; set; }
        public string DisplayName { get; set; }
        public string CaseTypeGroup { get; set; }
        public Guid RefId { get; set; }

        public bool IsJudge()
        {
            return Role == Role.Judge;
        }
    }
}
