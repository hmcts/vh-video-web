using System;
using System.Collections.Generic;
using System.Linq;

namespace VideoWeb.Common.Models
{
    public class Participant
    {
        private readonly string[] witnessRoles = { "witness", "expert" };
        
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
        /// Needs to come from video-api not booking-api, for if the judge updates it within the hearing
        public string DisplayName { get; set; }
        public Guid RefId { get; set; }
        public string Representee { get; set; } 
        public ConsultationRoom CurrentRoom { get; set; }
        public ConsultationRoom InterpreterRoom { get; set; }
        public InterpreterLanguage InterpreterLanguage { get; set; }
        public List<LinkedParticipant> LinkedParticipants { get; set; }
        public string ExternalReferenceId { get; set; }
        public List<string> ProtectFrom { get; set; } = [];
        /// <summary>
        /// This is the time stamp of the last event that was sent for a change to the participant
        /// </summary>
        public DateTime? LastEventTime { get; set; }

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
            return HearingRole != null && witnessRoles.Contains(HearingRole.Trim(), StringComparer.CurrentCultureIgnoreCase);
        }

        public bool IsQuickLinkUser()
        {
            return Role is Role.QuickLinkObserver or Role.QuickLinkParticipant;
        }
        
        public bool IsObserver()
        {
            return Role == Role.QuickLinkObserver ||
                   (HearingRole?.Trim().Equals("observer", StringComparison.CurrentCultureIgnoreCase) ?? false);
        }

        public bool IsCallable()
        {
            return IsWitness() || IsQuickLinkUser();
        }
        
        public bool IsHost()
        {
            return IsJudge() || IsStaffMember();
        }

        public bool IsTransferredOnStart()
        {
            return !IsWitness() && !IsQuickLinkUser() && !IsHost();
        }
    }
}
