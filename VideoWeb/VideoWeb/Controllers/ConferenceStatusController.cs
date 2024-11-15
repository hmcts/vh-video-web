using System;
using System.Net;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.EventHub.Services;
using VideoWeb.Mappings;

namespace VideoWeb.Controllers;

[Produces("application/json")]
[ApiController]
[Route("conferences")]
public class ConferenceStatusController(
    ILogger<ConferenceManagementController> logger,
    IConferenceVideoControlStatusService conferenceVideoControlStatusService)
    : ControllerBase
{
    /// <summary>
    /// Updates the video control statuses for the conference
    /// </summary>
    /// <param name="conferenceId">conference id</param>
    /// <param name="setVideoControlStatusesRequest">Request object to set Video Control Staus</param>
    /// <param name="cancellationToken">cancellation token</param>
    /// <returns>Ok status</returns>
    /// <returns>Forbidden status</returns>
    /// <returns>Not Found status</returns>
    [HttpPut("{conferenceId}/setVideoControlStatuses")]
    [SwaggerOperation(OperationId = "SetVideoControlStatusesForConference")]
    [ProducesResponseType((int)HttpStatusCode.Accepted)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    public async Task<IActionResult> SetVideoControlStatusesForConference(Guid conferenceId, [FromBody] SetConferenceVideoControlStatusesRequest setVideoControlStatusesRequest, CancellationToken cancellationToken)
    {
        var videoControlStatuses = SetConferenceVideoControlStatusesRequestMapper.Map(setVideoControlStatusesRequest);

        logger.LogDebug("Setting the video control statuses for {ConferenceId}", conferenceId);
        logger.LogTrace("Updating conference videoControlStatuses in cache: {Serialize}", JsonSerializer.Serialize(videoControlStatuses));

        await conferenceVideoControlStatusService.SetVideoControlStateForConference(conferenceId, videoControlStatuses, cancellationToken);

        logger.LogTrace("Set video control statuses ({@VideoControlStatuses}) for {ConferenceId}", videoControlStatuses, conferenceId);
        return Accepted();
    }

    /// <summary>
    /// Returns the video control statuses for the conference
    /// </summary>
    /// <param name="conferenceId">conference id</param>
    /// <returns>Ok status</returns>
    /// <returns>Forbidden status</returns>
    /// <returns>Not Found status</returns>
    [HttpGet("{conferenceId}/getVideoControlStatuses")]
    [SwaggerOperation(OperationId = "GetVideoControlStatusesForConference")]
    [ProducesResponseType(typeof(ConferenceVideoControlStatuses), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> GetVideoControlStatusesForConference(Guid conferenceId)
    {
        logger.LogDebug("Getting the video control statuses for {ConferenceId}", conferenceId);
        var videoControlStatuses =
            await conferenceVideoControlStatusService.GetVideoControlStateForConference(conferenceId);

        if (videoControlStatuses == null)
        {
            logger.LogWarning("video control statuses with id: {ConferenceId} not found", conferenceId);

            return Ok(new ConferenceVideoControlStatuses());
        }

        logger.LogTrace("Got video control statuses ({@VideoControlStatuses}) for {ConferenceId}", videoControlStatuses,
            conferenceId);
        return Ok(videoControlStatuses);
    }
}
