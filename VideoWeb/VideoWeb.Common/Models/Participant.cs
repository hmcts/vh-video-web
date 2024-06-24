using System;
using System.Collections.Generic;

namespace VideoWeb.Common.Models
{
    public class Participant
    {
        public Participant()
        {
            LinkedParticipants = new List<LinkedParticipant>();
        }
        public Guid Id { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string FullTitledName { get; set; }
        public string ContactEmail { get; set; }
        public string ContactTelephone { get; set; }
        public string Username { get; set; }
        public Role Role { get; set; }
        public string HearingRole { get; set; }
        public ParticipantStatus ParticipantStatus { get; set; }
        public string DisplayName { get; set; }
        public Guid RefId { get; set; }
        public string Representee { get; set; }
        public MeetingRoom CurrentRoom { get; set; }
        public MeetingRoom InterpreterRoom { get; set; }
        public List<LinkedParticipant> LinkedParticipants { get; set; }

        public bool IsJudge()
        {
            return Role == Role.Judge;
        }
        
        public bool IsStaffMember()
        {
            return Role == Role.StaffMember;
        }

        public bool IsJudicialOfficeHolder()
        {
            return Role == Role.JudicialOfficeHolder;
        }

        public bool IsWitness()
        {
            return HearingRole.Trim().Equals("witness", StringComparison.CurrentCultureIgnoreCase);
        }

        public bool IsQuickLinkUser()
        {
            return Role == Role.QuickLinkObserver || Role == Role.QuickLinkParticipant;
        }

        public bool IsCallable()
        {
            return IsWitness() || IsQuickLinkUser();
        }
        
        public bool IsHost()
        {
            return IsJudge() || IsStaffMember();
        }
        
        public ConsultationRoom CurrentRoom { get; set; }
    }
}
