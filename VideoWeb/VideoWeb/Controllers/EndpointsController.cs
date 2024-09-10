using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;
using VideoApi.Client;
using VideoWeb.Common;

namespace VideoWeb.Controllers;

[Produces("application/json")]
[ApiController]
[Route("video-endpoints")]
public class EndpointsController : ControllerBase
{
    private readonly ILogger<EndpointsController> _logger;
    private readonly IConferenceService _conferenceService;
    
    public EndpointsController(ILogger<EndpointsController> logger,
        IConferenceService conferenceService)
    {
        _logger = logger;
        _conferenceService = conferenceService;
    }
    
    [HttpGet("{conferenceId}/participants")]
    [SwaggerOperation(OperationId = "GetVideoEndpointsForConference")]
    [ProducesResponseType(typeof(List<VideoEndpointResponse>), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> GetVideoEndpointsForConferenceAsync(Guid conferenceId, CancellationToken cancellationToken)
    {
        try
        {
            var conference = await _conferenceService.GetConference(conferenceId, cancellationToken);
            return Ok(conference.Endpoints.Select(VideoEndpointsResponseMapper.Map).ToList());
        }
        catch (VideoApiException e)
        {
            _logger.LogError(e, "Endpoints could not be fetched for ConferenceId: {ConferenceId}", conferenceId);
            return StatusCode(e.StatusCode, e.Response);
        }
    }
    
    [HttpGet("{conferenceId}/allowed-video-call-endpoints")]
    [SwaggerOperation(OperationId = "AllowedVideoCallEndpoints")]
    [ProducesResponseType(typeof(IList<AllowedEndpointResponse>), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> GetEndpointsLinkedToUser(Guid conferenceId, CancellationToken cancellationToken)
    {
        var username = User.Identity?.Name?.Trim() ??
                           throw new UnauthorizedAccessException("No username found in claims");
        var conference = await _conferenceService.GetConference(conferenceId, cancellationToken);
        var isHostOrJoh = conference.Participants.Exists(x =>
            (x.IsHost() || x.IsJudicialOfficeHolder()) && x.Username.Equals(User.Identity.Name?.Trim(),
                StringComparison.InvariantCultureIgnoreCase));
        var usersEndpoints = conference.Endpoints;
        if (!isHostOrJoh)
            usersEndpoints = usersEndpoints.Where(ep =>
                ep.DefenceAdvocateUsername != null &&
                ep.DefenceAdvocateUsername.Equals(username, StringComparison.CurrentCultureIgnoreCase)).ToList();
            
        var response = usersEndpoints.Select(AllowedEndpointResponseMapper.Map).ToList();
        return Ok(response);
    }
    
}
