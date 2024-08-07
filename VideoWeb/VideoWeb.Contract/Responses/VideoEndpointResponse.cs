using System;
using VideoWeb.Common.Models;

namespace VideoWeb.Contract.Responses;

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
    /// The current endpoint status
    /// </summary>
    public string DefenceAdvocateUsername { get; set; }
    
    /// <summary>
    /// The display name when connected to the pexip node
    /// </summary>
    public string PexipDisplayName { get; set; }
    
    public bool IsCurrentUser { get; set; }
    
    /// <summary>
    /// Current conference room
    /// </summary>
    public RoomSummaryResponse CurrentRoom { get; set; }
    
    /// <summary>
    /// The endpoint's interpreter language, if applicable
    /// </summary>
    public InterpreterLanguageResponse InterpreterLanguage { get; set; }
}
