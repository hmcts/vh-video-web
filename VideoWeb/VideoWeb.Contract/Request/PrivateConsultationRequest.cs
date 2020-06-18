using System;
using System.ComponentModel.DataAnnotations;
using VideoWeb.Common.Models;

namespace VideoWeb.Contract.Request
{
    /// <summary>
    /// Raise or respond to a private consultation request
    /// </summary>
    public class PrivateConsultationRequest
    {
        /// <summary>
        /// Conference ID
        /// </summary>
        public Guid ConferenceId { get; set; }
        
        /// <summary>
        /// Id of participant requesting consultation
        /// </summary>
        public Guid RequestedById { get; set; }
    
        /// <summary>
        /// Id of participant requesting consultation with
        /// </summary>
        public Guid RequestedForId { get; set; }
    
        /// <summary>
        /// Consultation Answer (absent value is treated as raising a consultation request)
        /// </summary>
        [EnumDataType(typeof(ConsultationAnswer))]
        public ConsultationAnswer? Answer { get; set; }
    }

    /// <summary>
    /// Leave a private consultation
    /// </summary>
    public class LeavePrivateConsultationRequest
    {
        /// <summary>
        /// The id of the conference
        /// </summary>
        public Guid ConferenceId { get; set; }
        
        /// <summary>
        /// The id of the participant
        /// </summary>
        public Guid ParticipantId { get; set; }
    }
    
    /// <summary>
    /// Request a private consultation with another participant
    /// </summary>
    public class PrivateAdminConsultationRequest
    {
        /// <summary>
        /// The conference UUID
        /// </summary>
        public Guid ConferenceId { get; set; }
        
        /// <summary>
        /// UUID of participant VH Officer attempted to call
        /// </summary>
        public Guid ParticipantId { get; set; }
        
        /// <summary>
        /// Response to a consultation request (i.e. 'Accepted or Rejected')
        /// </summary>
        [EnumDataType(typeof(ConsultationAnswer))]
        public ConsultationAnswer Answer { get; set; }
        
        /// <summary>
        /// The room to have a private consultation in
        /// </summary>
        public RoomType ConsultationRoom { get; set; }
    }
}
