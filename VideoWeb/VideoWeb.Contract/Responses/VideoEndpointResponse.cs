using System;
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
    }
}
