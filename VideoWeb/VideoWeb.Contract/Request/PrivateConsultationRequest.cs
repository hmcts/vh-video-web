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
        /// ID unique to the request
        /// </summary>
        public Guid InvitationId { get; set; }
        
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
        /// Response to a consultation request (i.e. 'Accepted or Rejected')
        /// </summary>
        [EnumDataType(typeof(ConsultationAnswer))]
        public ConsultationAnswer Answer { get; set; }

        /// <summary>
        /// The room to have a private consultation in
        /// </summary>
        public string RoomLabel { get; set; }
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

    public class PrivateVideoEndpointConsultationRequest
    {
        public Guid ConferenceId { get; set; }
        public Guid EndpointId { get; set; }
    }
}
