using System;
using System.Collections.Generic;
using VideoWeb.Common.Models;

namespace VideoWeb.Contract.Responses
{
    /// <summary>
    /// Information about a participant in a conference
    /// </summary>
    public class ParticipantResponse
    {
        /// <summary>
        /// The participant id in a conference
        /// </summary>
        public Guid Id { get; set; }
        
        /// <summary>
        /// The participant's full name
        /// </summary>
        public string Name { get; set; }
        
        /// <summary>
        /// The participant's role
        /// </summary>
        public Role Role { get; set; }
        
        /// <summary>
        /// The participant's status
        /// </summary>
        public ParticipantStatus Status { get; set; }
        
        /// <summary>
        /// The participant's display name
        /// </summary>
        public string DisplayName { get; set; }
        
        /// <summary>
        /// The tiled display name (the fixed tile location, display name and UUID)
        /// </summary>
        public string TiledDisplayName { get; set; }
        
        /// <summary>
        /// The representee the participant is acting on behalf
        /// </summary>
        public string Representee { get; set; }

        /// <summary>
        /// The first name of the participant
        /// </summary>
        public string FirstName { get; set; }

        /// <summary>
        /// The last name of the participant
        /// </summary>
        public string LastName { get; set; }

        /// <summary>
        /// The hearing role
        /// </summary>
        public string HearingRole { get; set; }
        
        /// <summary>
        /// The User Name
        /// </summary>
        public string UserName { get; set; }

        /// <summary>
        /// Current conference room
        /// </summary>
        public RoomSummaryResponse CurrentRoom { get; set; }
        
        /// <summary>
        /// Current interpreter room
        /// </summary>
        public RoomSummaryResponse InterpreterRoom { get; set; }
        
        /// <summary>
        /// The participant's interpreter language, if applicable
        /// </summary>
        public InterpreterLanguageResponse InterpreterLanguage { get; set; }
        
        /// <summary>
        /// List of participants linked this participant
        /// </summary>
        public List<LinkedParticipantResponse> LinkedParticipants { get; set; }

        /// <summary>
        /// A unique identifier for the participant (used by special measures)
        /// </summary>
        public string ExternalReferenceId { get; set; }

        /// <summary>
        /// List of external references to protect this participant from
        /// </summary>
        public List<string> ProtectFrom { get; set; }
    }
}
