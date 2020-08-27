using System;
using System.Collections.Generic;
using System.Linq;

namespace VideoWeb.Common.Models
{
    public class Conference
    {
        public Conference()
        {
            Participants = new List<Participant>();
            Endpoints = new List<Endpoint>();
        }
        public Guid Id { get; set; }
        public Guid HearingId { get; set; }
        public List<Participant> Participants { get; set; }
        public List<Endpoint> Endpoints { get; set; }
        public string HearingVenueName { get; set; }

        public Participant GetJudge()
        {
            return Participants.SingleOrDefault(x => x.IsJudge());
        }
    }
}
