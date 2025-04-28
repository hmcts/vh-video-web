using System;
using System.Net;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Common.Logging;
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

        logger.LogSettingVideoControlStatuses(conferenceId);
        logger.LogUpdatingVideoControlStatusesInCache(JsonSerializer.Serialize(videoControlStatuses));

        await conferenceVideoControlStatusService.SetVideoControlStateForConference(conferenceId, videoControlStatuses, cancellationToken);

        logger.LogSetVideoControlStatuses(videoControlStatuses, conferenceId);
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
        logger.LogGettingVideoControlStatuses(conferenceId);
        var videoControlStatuses =
            await conferenceVideoControlStatusService.GetVideoControlStateForConference(conferenceId);

        if (videoControlStatuses == null)
        {
            logger.LogVideoControlStatusesNotFound(conferenceId);

            return Ok(new ConferenceVideoControlStatuses());
        }

        logger.LogGotVideoControlStatuses(videoControlStatuses, conferenceId);
        return Ok(videoControlStatuses);
    }
}
