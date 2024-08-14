using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using BookingsApi.Client;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Contract.Responses;
using VideoApi.Client;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;
using VideoWeb.Common;
using VideoWeb.Extensions;
using VideoWeb.Helpers.Sorting;
using VideoWeb.Mappings;
using ConferenceForIndividualResponse = VideoWeb.Contract.Responses.ConferenceForIndividualResponse;
using ConferenceForHostResponse = VideoWeb.Contract.Responses.ConferenceForHostResponse;
using VideoWeb.Middleware;

namespace VideoWeb.Controllers;

[Produces("application/json")]
[ApiController]
[Route("conferences")]
public class ConferencesController(
    IVideoApiClient videoApiClient,
    ILogger<ConferencesController> logger,
    IBookingsApiClient bookingApiClient,
    IConferenceService conferenceService)
    : ControllerBase
{
    /// <summary>
    /// Get conferences today for a host
    /// </summary>
    /// <returns>List of conferences, if any</returns>
    [HttpGet("hosts")]
    [ProducesResponseType(typeof(List<ConferenceForHostResponse>), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    [SwaggerOperation(OperationId = "GetConferencesForHost")]
    [Authorize("Judicial")]
    public async Task<ActionResult<List<ConferenceForHostResponse>>> GetConferencesForHostAsync(CancellationToken cancellationToken)
    {
        logger.LogDebug("GetConferencesForHost");
        
        try
        {
            var username = User.Identity!.Name;
            var hearings = await bookingApiClient.GetConfirmedHearingsByUsernameForTodayAsync(username, cancellationToken);
            var conferencesForHost = await videoApiClient.GetConferencesForHostByHearingRefIdAsync(new GetConferencesByHearingIdsRequest
            {
                HearingRefIds = hearings.Select(x => x.Id).ToArray()
            }, cancellationToken);
            
            if(conferencesForHost.Count != hearings.Count)
                logger.LogError("Number of hearings ({HearingCount}) does not match number of conferences ({ConferenceCount}) for user {Username}",
                    hearings.Count, conferencesForHost.Count, username);
            
            var response = hearings
                .Where(h => conferencesForHost.Any(c => c.HearingId == h.Id))
                .Select(h => BookingForHostResponseMapper.Map(h, conferencesForHost.ToList()))
                .ToList();
            
            return Ok(response);
        }
        catch (BookingsApiException e)
        {
            return HandleBookingsApiExceptionForGetHearings<ConferenceForHostResponse>(e);
        }
        catch (VideoApiException e)
        {
            return HandleVideoApiExceptionForGetConferences(e);
        }
    }
    
    /// <summary>
    /// Get conferences today for staff member with the specifed hearing venue names
    /// </summary>
    /// <returns>List of conferences, if any</returns>
    [HttpGet("staffmember")]
    [ProducesResponseType(typeof(List<ConferenceForHostResponse>), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    [SwaggerOperation(OperationId = "GetConferencesForStaffMember")]
    [Authorize("Judicial")]
    public async Task<ActionResult<List<ConferenceForHostResponse>>> GetConferencesForStaffMemberAsync([FromQuery] IEnumerable<string> hearingVenueNames, CancellationToken cancellationToken)
    {
        logger.LogDebug("GetConferencesForStaffMember");
        
        try
        {
            var hearingsForToday = await bookingApiClient.GetHearingsForTodayByVenueAsync(hearingVenueNames, cancellationToken);
            var request = new GetConferencesByHearingIdsRequest { HearingRefIds = hearingsForToday.Select(x => x.Id).ToArray() };
            var conferencesForStaffMember = await videoApiClient.GetConferencesForHostByHearingRefIdAsync(request, cancellationToken);
            var response = conferencesForStaffMember
                .Select(ConferenceForHostResponseMapper.Map)
                .ToList();
            return Ok(response);
        }
        catch (BookingsApiException e)
        {
            return HandleBookingsApiExceptionForGetHearings<ConferenceForHostResponse>(e);
        }
        catch (VideoApiException e)
        {
            return HandleVideoApiExceptionForGetConferences(e);
        }
    }
    
    /// <summary>
    /// Get conferences today for individual or representative excluding those that have been closed for over 120 minutes
    /// </summary>
    /// <returns>List of conferences, if any</returns>
    [HttpGet("individuals")]
    [ProducesResponseType(typeof(List<ConferenceForIndividualResponse>), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    [SwaggerOperation(OperationId = "GetConferencesForIndividual")]
    [Authorize("Individual")]
    public async Task<ActionResult<List<ConferenceForIndividualResponse>>> GetConferencesForIndividual(CancellationToken cancellationToken)
    {
        logger.LogDebug("GetConferencesForIndividual");
        try
        {
            var username = User.Identity!.Name;
            if (IsQuicklinkUser())
            {
                var conferencesForIndividual = await videoApiClient.GetConferencesTodayForIndividualByUsernameAsync(username, cancellationToken);
                var response = conferencesForIndividual
                    .Select(ConferenceForIndividualResponseMapper.Map)
                    .ToList();
                return Ok(response);
            }
            else
            {
                var hearings = await bookingApiClient.GetConfirmedHearingsByUsernameForTodayAsync(username, cancellationToken);
                var conferencesForIndividual =
                    await videoApiClient.GetConferencesTodayForIndividualByUsernameAsync(username, cancellationToken);
                var response = hearings
                    .Select(hearing => BookingForIndividualResponseMapper.Map(hearing, conferencesForIndividual.ToList()));
                response = response.Where(c => c.IsWaitingRoomOpen);
                return Ok(response.ToList());
            }
        }
        catch (BookingsApiException e)
        {
            return HandleBookingsApiExceptionForGetHearings<ConferenceForIndividualResponse>(e);
        }
        catch (VideoApiException e)
        {
            return HandleVideoApiExceptionForGetConferences(e);
        }
    }
    
    private bool IsQuicklinkUser()
    {
        var claims = User.Identities!.FirstOrDefault()?.Claims as List<Claim>;
        var isQuicklinkUser = claims?.Find(x =>
            x.Value == Role.QuickLinkObserver.ToString() || x.Value == Role.QuickLinkParticipant.ToString());
        return isQuicklinkUser != null;
    }
    
    /// <summary>
    /// Get conferences for user
    /// </summary>
    /// <returns>List of conferences, if any</returns>
    [HttpGet("vhofficer")]
    [ProducesResponseType(typeof(List<ConferenceForVhOfficerResponse>), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.Unauthorized)]
    [SwaggerOperation(OperationId = "GetConferencesForVhOfficer")]
    [Authorize(AppRoles.VhOfficerRole)]
    public async Task<ActionResult<List<ConferenceForVhOfficerResponse>>> GetConferencesForVhOfficerAsync([FromQuery] VhoConferenceFilterQuery query, CancellationToken cancellationToken)
    {
        logger.LogDebug("GetConferencesForVhOfficer");
        try
        {
            var hearingsForToday = await bookingApiClient.GetHearingsForTodayByVenueAsync(query.HearingVenueNames, cancellationToken);
            var request = new GetConferencesByHearingIdsRequest { HearingRefIds = hearingsForToday.Select(e => e.Id).ToArray()};
            var conferences = await videoApiClient.GetConferencesForAdminByHearingRefIdAsync(request, cancellationToken);
            var allocatedHearings = await bookingApiClient.GetAllocationsForHearingsAsync(conferences.Select(e => e.HearingRefId), cancellationToken);
            var responses = conferences
                .Where(c => c.IsWaitingRoomOpen && c.Participants.Exists(e => e.UserRole == UserRole.Judge))
                .Select(x => ConferenceForVhOfficerResponseMapper.Map(x, allocatedHearings?.FirstOrDefault(conference => conference.HearingId == x.HearingRefId)))
                .ApplyCsoFilter(query)
                .ToList();
            
            // display conferences in order of scheduled date time and then by case name. if a conference if closed then it should be at the bottom of the list. if a conference is closed at the same time then order by case name
            responses.Sort(new SortConferenceForVhoOfficerHelper());
            return Ok(responses);
        }
        catch (BookingsApiException e)
        {
            return HandleBookingsApiExceptionForGetHearings<ConferenceForVhOfficerResponse>(e);
        }
        catch (VideoApiException e)
        {
            return HandleVideoApiExceptionForGetConferences(e);
        }
    }
    
    
    /// <summary>
    /// Get the details of a conference by id for VH officer
    /// </summary>
    /// <param name="conferenceId">The unique id of the conference</param>
    /// <returns>the details of a conference, if permitted</returns>
    [HttpGet("{conferenceId}/vhofficer")]
    [ProducesResponseType(typeof(ConferenceResponseVho), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    [ProducesResponseType((int)HttpStatusCode.NoContent)]
    [SwaggerOperation(OperationId = "GetConferenceByIdVHO")]
    [Authorize(AppRoles.VhOfficerRole)]
    public async Task<ActionResult<ConferenceResponseVho>> GetConferenceByIdVhoAsync(Guid conferenceId, CancellationToken cancellationToken)
    {
        if (conferenceId == Guid.Empty)
        {
            logger.LogWarning("Unable to get conference when id is not provided");
            ModelState.AddModelError(nameof(conferenceId), $"Please provide a valid {nameof(conferenceId)}");
            
            return BadRequest(ModelState);
        }
        
        ConferenceDetailsResponse conference;
        try
        {
            conference = await videoApiClient.GetConferenceDetailsByIdAsync(conferenceId, cancellationToken);
            if (conference == null)
            {
                logger.LogWarning("Conference details with id: {ConferenceId} not found", conferenceId);
                return NoContent();
            }
        }
        catch (VideoApiException e)
        {
            logger.LogError(e, "Unable to retrieve conference: {ConferenceId}", conferenceId);
            
            return StatusCode(e.StatusCode, e.Response);
        }
        
        if (!conference.IsWaitingRoomOpen)
        {
            logger.LogInformation(
                "Unauthorised to view conference details {ConferenceId} because user is not Officer " +
                "nor a participant of the conference, or the conference has been closed for over 30 minutes", conferenceId);
            
            return Unauthorized();
        }
        
        // these are roles that are filtered against when lists participants on the UI
        var displayRoles = new List<Role>
        {
            Role.Judge,
            Role.StaffMember,
            Role.Individual,
            Role.Representative,
            Role.VideoHearingsOfficer,
            Role.JudicialOfficeHolder,
            Role.QuickLinkParticipant,
            Role.QuickLinkObserver
        };
        
        conference.Participants = conference
            .Participants
            .Where(x => displayRoles.Contains((Role)x.UserRole)).ToList();

        return Ok(ConferenceResponseVhoMapper.Map(conference));
    }
    
    /// <summary>
    /// Get the details of a conference by id
    /// </summary>
    /// <param name="conferenceId">The unique id of the conference</param>
    /// <returns>the details of a conference, if permitted</returns>
    [ServiceFilter(typeof(CheckParticipantCanAccessConferenceAttribute))]
    [HttpGet("{conferenceId}")]
    [ProducesResponseType(typeof(ConferenceResponse), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    [ProducesResponseType((int)HttpStatusCode.NoContent)]
    [SwaggerOperation(OperationId = "GetConferenceById")]
    public async Task<ActionResult<ConferenceResponse>> GetConferenceByIdAsync(Guid conferenceId, CancellationToken cancellationToken)
    {
        logger.LogDebug("GetConferenceById");
        
        var userProfile = ClaimsPrincipalToUserProfileResponseMapper.Map(User);
        
        if (conferenceId == Guid.Empty)
        {
            logger.LogWarning("Unable to get conference when id is not provided");
            ModelState.AddModelError(nameof(conferenceId), $"Please provide a valid {nameof(conferenceId)}");
            return BadRequest(ModelState);
        }
        
        var username = userProfile.Username.ToLower().Trim();
        Conference conference;
        try
        {
            conference = await conferenceService.ForceGetConference(conferenceId, cancellationToken);
            if (conference == null)
            {
                logger.LogWarning("Conference details with id: {ConferenceId} not found", conferenceId);
                return NoContent();
            }
        }
        catch (VideoApiException e)
        {
            logger.LogError(e, "Unable to retrieve conference: {ConferenceId}", conferenceId);
            return StatusCode(e.StatusCode, e.Response);
        }
        
        if (!userProfile.Roles.Contains(Role.StaffMember) &&
            (conference.Participants.TrueForAll(x => x.Username.ToLower().Trim() != username) || !conference.IsWaitingRoomOpen))
        {
            logger.LogInformation(
                "Unauthorised to view conference details {ConferenceId} because user is neither a VH Officer " +
                "nor a participant of the conference, or the conference has been closed for over 30 minutes", conferenceId);
            return Unauthorized();
        }
        
        return Ok(ConferenceResponseMapper.Map(conference));
    }
    
    private ActionResult HandleBookingsApiExceptionForGetHearings<T>(BookingsApiException e) where T : class
    {
        if (e.StatusCode == (int)HttpStatusCode.NotFound)
        {
            logger.LogWarning("No hearings found for user");
            return Ok(new List<T>());
        }
        
        return StatusCode(e.StatusCode, e.Response);
    }
    
    private ObjectResult HandleVideoApiExceptionForGetConferences(VideoApiException e)
    {
        logger.LogError(e, "Unable to get conferences for user");
        return StatusCode(e.StatusCode, e.Response);
    }
}
