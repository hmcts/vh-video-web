using System;
using System.Collections.Generic;
using VideoWeb.Common.Models;

namespace VideoWeb.Contract.Responses
{
    public class VideoEndpointResponse
    {
        /// <summary>
        /// The endpoint id
        /// </summary>
        public Guid Id { get; set; }

        /// <summary>
        /// The endpoint display name
        /// </summary>
        public string DisplayName { get; set; }

        /// <summary>
        /// The current endpoint status
        /// </summary>
        public EndpointStatus Status { get; set; }
        
        /// <summary>
        /// The display name when connected to the pexip node
        /// </summary>
        public string PexipDisplayName { get; set; }
        
        /// <summary>
        /// Current conference room
        /// </summary>
        public RoomSummaryResponse CurrentRoom { get; set; }
        
        public List<EndpointParticipantResponse> EndpointParticipants { get; set; }
        
        public bool IsCurrentUser { get; set; }
    }
}
