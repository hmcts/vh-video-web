using System;
using System.Collections.Generic;
using VideoWeb.Common.Models;

namespace VideoWeb.Contract.Responses
{
    public class ParticipantContactDetailsResponseVho
    {
        /// <summary>
        /// The participant id in a conference
        /// </summary>
        public Guid Id { get; set; }

        /// <summary>
        /// The conference id
        /// </summary>
        public Guid ConferenceId { get; set; }

        /// <summary>
        /// The participant's full name
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// The participant's username
        /// </summary>
        public string Username { get; set; }

        /// <summary>
        /// The participant's user role
        /// </summary>
        public Role Role { get; set; }

        /// <summary>
        /// The participant's hearing role
        /// </summary>
        public string HearingRole { get; set; }

        /// <summary>
        /// The participant's status
        /// </summary>
        public ParticipantStatus Status { get; set; }

        /// <summary>
        /// The participant's display name
        /// </summary>
        public string DisplayName { get; set; }

        /// <summary>
        /// The group a participant belongs to in a case
        /// </summary>
        public string CaseTypeGroup { get; set; }

        /// <summary>
        /// The participant hearing ref id in a booking
        /// </summary>
        public Guid RefId { get; set; }

        /// <summary>
        /// The participant's first name
        /// </summary>
        public string FirstName { get; set; }

        /// <summary>
        /// The participant's last name
        /// </summary>
        public string LastName { get; set; }

        /// <summary>
        /// The participant's contact email
        /// </summary>
        public string ContactEmail { get; set; }

        /// <summary>
        /// The participant's contact telephone number
        /// </summary>
        public string ContactTelephone { get; set; }

        /// <summary>
        /// The hearing venue this participant is assigned to
        /// </summary>
        public string HearingVenueName { get; set; }

        /// <summary>
        /// The Host is In Another Hearing
        /// </summary>
        public bool HostInAnotherHearing { get; set; }

        /// <summary>
        /// The participant represented by the representative
        /// </summary>
        public string Representee { get; set; }    
        
        /// <summary>
        /// List of participants linked this participant
        /// </summary>
        public List<LinkedParticipantResponse> LinkedParticipants { get; set; }
    }
}
