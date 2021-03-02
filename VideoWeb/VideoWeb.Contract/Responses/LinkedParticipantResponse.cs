using System;
using VideoWeb.Common.Models;

namespace VideoWeb.Contract.Responses
{
    public class LinkedParticipantResponse
    {
        /// <summary>
        /// The id of the participant linked to
        /// </summary>
        public Guid LinkedId { get; set; }
        
        /// <summary>
        /// The type of link to participant
        /// </summary>
        public LinkType LinkType { get; set; }
    }
}
