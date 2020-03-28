using System;
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
        /// The participant's full name
        /// </summary>
        public string Name { get; set; }
        
        /// <summary>
        /// The participant's username
        /// </summary>
        public string Username { get; set; }
        
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
        /// The group a participant belongs to in a case
        /// </summary>
        public string CaseTypeGroup { get; set; }
        
        /// <summary>
        /// The representee the participant is acting on behalf
        /// </summary>
        public string Representee { get; set; }
        
    }
}
