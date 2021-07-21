using System;
using System.Collections.Generic;
using System.Text;

namespace VideoWeb.Common.Models
{
    public class UpdateParticipant
    {
        public Guid ParticipantRefId { get; set; }
        public string Fullname { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string DisplayName { get; set; }
        public string Representee { get; set; }
        public string ContactEmail { get; set; }
        public string ContactTelephone { get; set; }
        public string Username { get; set; }
        public List<LinkedParticipant> LinkedParticipants { get; set; }
    }
}
