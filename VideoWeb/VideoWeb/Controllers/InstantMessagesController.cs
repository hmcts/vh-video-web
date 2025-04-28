using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading;
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
using VideoWeb.Common.Logging;

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
    /// <param name="cancellationToken"></param>
    /// <returns>List of instant messages involving participant in a conference</returns>
    [ServiceFilter(typeof(CheckParticipantCanAccessConferenceAttribute))]
    [HttpGet("{conferenceId}/instantmessages/participant/{participantId}")]
    [SwaggerOperation(OperationId = "GetConferenceInstantMessageHistoryForParticipant")]
    [ProducesResponseType(typeof(List<ChatResponse>), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    public async Task<IActionResult> GetConferenceInstantMessageHistoryForParticipantAsync(Guid conferenceId,
        Guid participantId, CancellationToken cancellationToken)
    {
        logger.LogGetMessagesForConference(conferenceId);
        var conference = await conferenceService.GetConference(conferenceId, cancellationToken);
        var participant = conference.Participants.Single(x => x.Id == participantId);

        var messages =
            await videoApiClient.GetInstantMessageHistoryForParticipantAsync(conferenceId, participant.Username,
                cancellationToken);
        if (messages == null || messages.Count == 0)
        {
            return Ok(new List<ChatResponse>());
        }

        var response = await MapMessages(messages.ToList(), conferenceId, cancellationToken);
        response = response.OrderBy(r => r.Timestamp).ToList();

        return Ok(response);

    }

    /// <summary>
    /// Get number of unread messages for vho
    /// </summary>
    /// <param name="conferenceId">Id of the conference</param>
    /// <param name="cancellationToken"></param>
    /// <returns>Number of unread message</returns>
    [HttpGet("{conferenceId}/instantmessages/unread/vho")]
    [SwaggerOperation(OperationId = "GetNumberOfUnreadAdminMessagesForConference")]
    [ProducesResponseType(typeof(UnreadInstantMessageConferenceCountResponse), (int)HttpStatusCode.OK)]
    [Authorize(AppRoles.VhOfficerRole)]
    public async Task<IActionResult> GetUnreadMessagesForVideoOfficerAsync(Guid conferenceId, CancellationToken cancellationToken)
    {
        logger.LogGetMessagesForConference(conferenceId);
        var messages = await videoApiClient.GetInstantMessageHistoryAsync(conferenceId, cancellationToken);
        if (messages.IsNullOrEmpty())
        {
            return Ok(new UnreadInstantMessageConferenceCountResponse());
        }

        var conference = await conferenceService.GetConference(conferenceId, cancellationToken);

        var response = UnreadInstantMessageConferenceCountResponseMapper.Map(conference, messages.ToList());

        return Ok(response);
    }

    /// <summary>
    /// Get number of unread messages for a participant
    /// </summary>
    /// <param name="conferenceId">Id of the conference</param>
    /// <param name="participantId">the participant in the conference</param>
    /// <param name="cancellationToken"></param>
    /// <returns>Number of unread message</returns>
    [ServiceFilter(typeof(CheckParticipantCanAccessConferenceAttribute))]
    [HttpGet("{conferenceId}/instantmessages/unread/participant/{participantId}")]
    [SwaggerOperation(OperationId = "GetNumberOfUnreadAdminMessagesForConferenceByParticipant")]
    [ProducesResponseType(typeof(UnreadAdminMessageResponse), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> GetUnreadMessagesForParticipantAsync(Guid conferenceId, Guid participantId, CancellationToken cancellationToken)
    {
        logger.LogGetMessagesForConference(conferenceId);
        var conference = await conferenceService.GetConference(conferenceId, cancellationToken);
        var participant = conference.Participants.Single(x => x.Id == participantId);

        var messages =
            await videoApiClient.GetInstantMessageHistoryForParticipantAsync(conferenceId, participant.Username,
                cancellationToken);
        if (messages.IsNullOrEmpty())
        {
            return Ok(new UnreadAdminMessageResponse());
        }

        var response = UnreadAdminMessageResponseMapper.Map(conference, messages.ToList());

        return Ok(response);
    }

    private async Task<List<ChatResponse>> MapMessages(IList<InstantMessageResponse> messages, Guid conferenceId, CancellationToken cancellationToken)
    {
        var response = new List<ChatResponse>();
        
        if (!messages.Any())
        {
            return response;
        }
        
        var conference = await conferenceService.GetConference(conferenceId, cancellationToken);
        
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
