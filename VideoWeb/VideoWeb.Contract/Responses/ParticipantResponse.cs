using System;

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
        /// The participant's username
        /// </summary>
        public string Username { get; set; }
        
        /// <summary>
        /// The participant's role
        /// </summary>
        public UserRole Role { get; set; }
        
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
    }
}