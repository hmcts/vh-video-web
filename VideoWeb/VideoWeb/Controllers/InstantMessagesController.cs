using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Helpers;
using VideoApi.Client;
using VideoApi.Contract.Responses;
using VideoWeb.Common;
using VideoWeb.Extensions;
using VideoWeb.Mappings;
using VideoWeb.Middleware;

namespace VideoWeb.Controllers;

[Consumes("application/json")]
[Produces("application/json")]
[Route("conferences")]
[ApiController]
public class InstantMessagesController(
    IVideoApiClient videoApiClient,
    ILogger<InstantMessagesController> logger,
    IMessageDecoder messageDecoder,
    IConferenceService conferenceService)
    : ControllerBase
{
    /// <summary>
    /// Get all the instant messages for a conference for a participant
    /// </summary>
    /// <param name="conferenceId">Id of the conference</param>
    /// <param name="participantId">the participant in the conference</param>
    /// <returns>List of instant messages involving participant in a conference</returns>
    [ServiceFilter(typeof(CheckParticipantCanAccessConferenceAttribute))]
    [HttpGet("{conferenceId}/instantmessages/participant/{participantId}")]
    [SwaggerOperation(OperationId = "GetConferenceInstantMessageHistoryForParticipant")]
    [ProducesResponseType(typeof(List<ChatResponse>), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    public async Task<IActionResult> GetConferenceInstantMessageHistoryForParticipantAsync(Guid conferenceId, Guid participantId)
    {
        logger.LogDebug($"GetMessages for {conferenceId}");
        try
        {
            var conference = await conferenceService.GetConference(conferenceId);
            var participant = conference.Participants.Single(x => x.Id == participantId);
            
            var messages =
                await videoApiClient.GetInstantMessageHistoryForParticipantAsync(conferenceId, participant.Username);
            if (messages== null || !messages.Any())
            {
                return Ok(new List<ChatResponse>());
            }
            
            var response = await MapMessages(messages.ToList(), conferenceId);
            response = response.OrderBy(r => r.Timestamp).ToList();
            
            return Ok(response);
        }
        catch (VideoApiException e)
        {
            logger.LogError(e, $"Unable to get messages for conference {conferenceId}");
            return StatusCode(e.StatusCode, e.Response);
        }
    }
    
    /// <summary>
    /// Get number of unread messages for vho
    /// </summary>
    /// <param name="conferenceId">Id of the conference</param>
    /// <returns>Number of unread message</returns>
    [HttpGet("{conferenceId}/instantmessages/unread/vho")]
    [SwaggerOperation(OperationId = "GetNumberOfUnreadAdminMessagesForConference")]
    [ProducesResponseType(typeof(UnreadInstantMessageConferenceCountResponse), (int)HttpStatusCode.OK)]
    [Authorize(AppRoles.VhOfficerRole)]
    public async Task<IActionResult> GetUnreadMessagesForVideoOfficerAsync(Guid conferenceId)
    {
        logger.LogDebug($"GetMessages for {conferenceId}");
        try
        {
            var messages = await videoApiClient.GetInstantMessageHistoryAsync(conferenceId);
            if (messages.IsNullOrEmpty())
            {
                return Ok(new UnreadInstantMessageConferenceCountResponse());
            }
            
            var conference = await conferenceService.GetConference(conferenceId);
            
            var response = UnreadInstantMessageConferenceCountResponseMapper.Map(conference, messages.ToList());
            
            return Ok(response);
        }
        catch (VideoApiException e)
        {
            logger.LogError(e, $"Unable to get messages for conference {conferenceId}");
            return StatusCode(e.StatusCode, e.Response);
        }
    }
    
    /// <summary>
    /// Get number of unread messages for a participant
    /// </summary>
    /// <param name="conferenceId">Id of the conference</param>
    /// <param name="participantId">the participant in the conference</param>
    /// <returns>Number of unread message</returns>
    [ServiceFilter(typeof(CheckParticipantCanAccessConferenceAttribute))]
    [HttpGet("{conferenceId}/instantmessages/unread/participant/{participantId}")]
    [SwaggerOperation(OperationId = "GetNumberOfUnreadAdminMessagesForConferenceByParticipant")]
    [ProducesResponseType(typeof(UnreadAdminMessageResponse), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> GetUnreadMessagesForParticipantAsync(Guid conferenceId, Guid participantId)
    {
        logger.LogDebug($"GetMessages for {conferenceId}");
        try
        {
            
            var conference = await conferenceService.GetConference(conferenceId);
            var participant = conference.Participants.Single(x => x.Id == participantId);
            
            var messages =
                await videoApiClient.GetInstantMessageHistoryForParticipantAsync(conferenceId, participant.Username);
            if (messages.IsNullOrEmpty())
            {
                return Ok(new UnreadAdminMessageResponse());
            }
            
            var response = UnreadInstantMessageConferenceCountResponseMapper.Map(conference, messages.ToList());
            
            return Ok(response);
        }
        catch (VideoApiException e)
        {
            logger.LogError(e, $"Unable to get messages for conference {conferenceId}");
            return StatusCode(e.StatusCode, e.Response);
        }
    }
    
    private async Task<List<ChatResponse>> MapMessages(IList<InstantMessageResponse> messages, Guid conferenceId)
    {
        var response = new List<ChatResponse>();
        
        if (!messages.Any())
        {
            return response;
        }
        
        var conference = await conferenceService.GetConference(conferenceId);
        
        var username = User.Identity?.Name;
        
        foreach (var message in messages)
        {
            var isUser = messageDecoder.IsMessageFromUser(message, username);
            string fromDisplayName;
            if (isUser)
            {
                fromDisplayName = "You";
            }
            else
            {
                fromDisplayName = await messageDecoder.GetMessageOriginatorAsync(conference, message);
            }
            
            var mapped = ChatResponseMapper.Map(message, fromDisplayName, isUser, conference);
            response.Add(mapped);
        }
        
        return response;
    }
}
