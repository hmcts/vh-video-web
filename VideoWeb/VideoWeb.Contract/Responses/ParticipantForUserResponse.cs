using System;

namespace VideoWeb.Contract.Responses
{
    public class ParticipantForUserResponse
    {
        /// <summary>
        /// The participant Id
        /// </summary>
        public Guid Id { get; set; }

        /// <summary>
        /// The participant username
        /// </summary>
        public string Username { get; set; }
        
        /// <summary>
        /// The participant display name during a conference
        /// </summary>
        public string DisplayName { get; set; }
        
        /// <summary>
        /// The participant role in conference
        /// </summary>
        public UserRole Role { get; set; }
        
        /// <summary>
        /// The current status of a participant
        /// </summary>
        public ParticipantStatus Status { get; set; }
        
        /// <summary>
        /// The representee (if participant is a representative)
        /// </summary>
        public string Representee { get; set; }
        
        /// <summary>
        /// The group a participant belongs to
        /// </summary>
        public string CaseTypeGroup { get; set; }
    }
}
