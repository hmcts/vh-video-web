using System;
using System.Net;
using System.Text.Json;
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
    /// <returns>Ok status</returns>
    /// <returns>Forbidden status</returns>
    /// <returns>Not Found status</returns>
    [HttpPut("{conferenceId}/setVideoControlStatuses")]
    [SwaggerOperation(OperationId = "SetVideoControlStatusesForConference")]
    [ProducesResponseType((int)HttpStatusCode.Accepted)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    public async Task<IActionResult> SetVideoControlStatusesForConference(Guid conferenceId, [FromBody]SetConferenceVideoControlStatusesRequest setVideoControlStatusesRequest)
    {
        try
        {
            var videoControlStatuses = SetConferenceVideoControlStatusesRequestMapper.Map(setVideoControlStatusesRequest);
            
            logger.LogDebug("Setting the video control statuses for {conferenceId}", conferenceId);
            logger.LogTrace($"Updating conference videoControlStatuses in cache: {JsonSerializer.Serialize(videoControlStatuses)}");
            
            await conferenceVideoControlStatusService.SetVideoControlStateForConference(conferenceId, videoControlStatuses);
            
            logger.LogTrace("Set video control statuses ({videoControlStatuses}) for {conferenceId}", videoControlStatuses, conferenceId);
            return Accepted();
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Could not set video control statuses for {conferenceId} an unkown exception was thrown", conferenceId);
            throw;
        }
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
    [ProducesResponseType(typeof(ConferenceVideoControlStatuses), (int)HttpStatusCode.NoContent)]
    public async Task<IActionResult> GetVideoControlStatusesForConference(Guid conferenceId)
    {
        try
        {
            logger.LogDebug("Getting the video control statuses for {conferenceId}", conferenceId);
            var videoControlStatuses = await conferenceVideoControlStatusService.GetVideoControlStateForConference(conferenceId);
            
            if (videoControlStatuses == null)
            {
                logger.LogWarning("video control statuses with id: {conferenceId} not found", conferenceId);
                
                return NoContent();
            }
            
            logger.LogTrace("Got video control statuses ({videoControlStatuses}) for {conferenceId}", videoControlStatuses, conferenceId);
            return Ok(videoControlStatuses);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Could not get video control statuses for {conferenceId} an unkown exception was thrown", conferenceId);
            throw;
        }
    }
}
