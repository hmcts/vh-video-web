using System;
using System.Collections.Generic;
using System.Linq;

namespace VideoWeb.Common.Models
{
    public class Conference
    {
        public Guid Id { get; set; }
        public Guid HearingId { get; set; }
        public List<Participant> Participants { get; set; }
        public string HearingVenueName { get; set; }

        public Participant GetJudge()
        {
            return Participants.SingleOrDefault(x => x.IsJudge());
        }
    }
}
