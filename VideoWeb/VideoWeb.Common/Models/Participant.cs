using System;

namespace VideoWeb.Common.Models
{
    public class Participant
    {
        public Guid Id { get; set; }
        public string Username { get; set; }
        public Role Role { get; set; }
        public string DisplayName { get; set; }

        public bool IsJudge()
        {
            return Role == Role.Judge;
        }
    }
}
