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
public class EndpointsController(
    ILogger<EndpointsController> logger,
    IConferenceService conferenceService)
    : ControllerBase
{
    [HttpGet("{conferenceId}/participants")]
    [SwaggerOperation(OperationId = "GetVideoEndpointsForConference")]
    [ProducesResponseType(typeof(List<VideoEndpointResponse>), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> GetVideoEndpointsForConferenceAsync(Guid conferenceId, CancellationToken cancellationToken)
    {
        try
        {
            var conference = await conferenceService.GetConference(conferenceId, cancellationToken);
            return Ok(conference.Endpoints.Select(VideoEndpointsResponseMapper.Map).ToList());
        }
        catch (VideoApiException e)
        {
            logger.LogError(e, "Endpoints could not be fetched for ConferenceId: {ConferenceId}", conferenceId);
            return StatusCode(e.StatusCode, e.Response);
        }
    }
}
