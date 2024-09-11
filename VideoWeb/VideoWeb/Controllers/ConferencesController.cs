using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using BookingsApi.Client;
using BookingsApi.Contract.V2.Requests;
using BookingsApi.Contract.V2.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoWeb.Common;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Contract.Responses;
using VideoWeb.Helpers.Sorting;
using VideoWeb.Mappings;
using VideoWeb.Middleware;
using ConferenceForIndividualResponse = VideoWeb.Contract.Responses.ConferenceForIndividualResponse;
using ConferenceForHostResponse = VideoWeb.Contract.Responses.ConferenceForHostResponse;

namespace VideoWeb.Controllers;

[Produces("application/json")]
[ApiController]
[Route("conferences")]
public class ConferencesController : ControllerBase
{
    private readonly IVideoApiClient _videoApiClient;
    private readonly ILogger<ConferencesController> _logger;
    private readonly IBookingsApiClient _bookingApiClient;
    private readonly IConferenceService _conferenceService;
    
    public ConferencesController(IVideoApiClient videoApiClient,
        ILogger<ConferencesController> logger,
        IBookingsApiClient bookingApiClient,
        IConferenceService conferenceService)
    {
        _videoApiClient = videoApiClient;
        _logger = logger;
        _bookingApiClient = bookingApiClient;
        _conferenceService = conferenceService;
    }
    
    /// <summary>
    /// Get conferences today for a host
    /// </summary>
    /// <returns>List of conferences, if any</returns>
    [HttpGet("hosts")]
    [ProducesResponseType(typeof(List<ConferenceForHostResponse>), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    [SwaggerOperation(OperationId = "GetConferencesForHost")]
    [Authorize("Judicial")]
    public async Task<ActionResult<List<ConferenceForHostResponse>>> GetConferencesForHostAsync(
        CancellationToken cancellationToken)
    {
        _logger.LogDebug("GetConferencesForHost");

        var username = User.Identity!.Name;
        var hearings =
            await _bookingApiClient.GetConfirmedHearingsByUsernameForTodayV2Async(username, cancellationToken);
        var request = new GetConferencesByHearingIdsRequest { HearingRefIds = hearings.Select(x => x.Id).ToArray() };
        var conferences = await _videoApiClient.GetConferencesByHearingRefIdsAsync(request, cancellationToken);

        if (conferences.Count != hearings.Count)
            _logger.LogError(
                "Number of hearings ({HearingCount}) does not match number of conferences ({ConferenceCount}) for user {Username}",
                hearings.Count, conferences.Count, username);

        var response = hearings
            .Where(h => conferences.Any(c => c.HearingId == h.Id))
            .Select(h => BookingForHostResponseMapper.Map(h, conferences.First(c => c.HearingId == h.Id)))
            .ToList();

        return Ok(response);

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
    public async Task<ActionResult<List<ConferenceForHostResponse>>> GetConferencesForStaffMemberAsync(
        [FromQuery] IEnumerable<string> hearingVenueNames, CancellationToken cancellationToken)
    {
        _logger.LogDebug("GetConferencesForStaffMember");

        var hearingsForToday =
            await _bookingApiClient.GetHearingsForTodayByVenueV2Async(hearingVenueNames, cancellationToken);
        var request = new GetConferencesByHearingIdsRequest
            { HearingRefIds = hearingsForToday.Select(x => x.Id).ToArray() };
        var conferences = await _videoApiClient.GetConferencesByHearingRefIdsAsync(request, cancellationToken);
        var response = hearingsForToday
            .Select(hearing =>
                BookingForHostResponseMapper.Map(hearing, conferences.First(c => hearing.Id == c.HearingId)))
            .ToList();
        return Ok(response);
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
    public async Task<ActionResult<List<ConferenceForIndividualResponse>>> GetConferencesForIndividual(
        CancellationToken cancellationToken)
    {
        _logger.LogDebug("GetConferencesForIndividual");

        var username = User.Identity!.Name;
        if (IsQuickLinkUser())
        {
            var conferencesForIndividual =
                await _videoApiClient.GetConferencesTodayForIndividualByUsernameAsync(username, cancellationToken);
            var conferences = await _conferenceService.GetConferences(conferencesForIndividual
                .Where(x => x.IsWaitingRoomOpen)
                .Select(x => x.Id), cancellationToken);
            return Ok(conferences.Select(ConferenceForIndividualResponseMapper.Map).ToList());
        }
        else
        {
            var hearings =
                await _bookingApiClient.GetConfirmedHearingsByUsernameForTodayV2Async(username, cancellationToken);
            var conferencesForIndividual =
                await _videoApiClient.GetConferencesTodayForIndividualByUsernameAsync(username, cancellationToken);
            var response = hearings.Select(hearing =>
                BookingForIndividualResponseMapper.Map(hearing, conferencesForIndividual.ToList()));
            response = response.Where(c => c.IsWaitingRoomOpen);
            return Ok(response.ToList());
        }
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
    public async Task<ActionResult<List<ConferenceForVhOfficerResponse>>> GetConferencesForVhOfficerAsync(
        [FromQuery] VhoConferenceFilterQuery query, CancellationToken cancellationToken)
    {
        _logger.LogDebug("GetConferencesForVhOfficer");
        const string filterMissingMessage = "Please provide a filter for hearing venue names or allocated CSOs";
        if (query == null)
        {
            ModelState.AddModelError(nameof(query), filterMissingMessage);
            return ValidationProblem(ModelState);
        }

        ICollection<HearingDetailsResponseV2> hearingsForToday;
        if (query.HearingVenueNames.Count > 0)
        {
            hearingsForToday =
                await _bookingApiClient.GetHearingsForTodayByVenueV2Async(query.HearingVenueNames, cancellationToken);
        }
        else if (query.AllocatedCsoIds.Count > 0 || query.IncludeUnallocated.HasValue)
        {
            hearingsForToday = await _bookingApiClient.GetHearingsForTodayByCsosV2Async(
                new HearingsForTodayByAllocationRequestV2()
                {
                    Unallocated = query.IncludeUnallocated,
                    CsoIds = query.AllocatedCsoIds
                }, cancellationToken);
        }
        else
        {
            ModelState.AddModelError(nameof(query), filterMissingMessage);
            return ValidationProblem(ModelState);
        }
        
        if(hearingsForToday.Count == 0)
        {
            return Ok(new List<ConferenceForVhOfficerResponse>());
        }

        var request = new GetConferencesByHearingIdsRequest
            { HearingRefIds = hearingsForToday.Select(e => e.Id).ToArray() };
        var conferences = await _videoApiClient.GetConferenceDetailsByHearingRefIdsAsync(request, cancellationToken);
        var openConferences = conferences.Where(x => x.IsWaitingRoomOpen).ToList();
        var responses = openConferences.Select(x =>
            ConferenceForVhOfficerResponseMapper.Map(x, hearingsForToday.First(h => h.Id == x.HearingId))).ToList();
        responses.Sort(new SortConferenceForVhoOfficerHelper());
        return Ok(responses);

    }


    /// <summary>
    /// Get the details of a conference by id for VH officer
    /// </summary>
    /// <param name="conferenceId">The unique id of the conference</param>
    /// <param name="cancellationToken"></param>
    /// <returns>the details of a conference, if permitted</returns>
    [HttpGet("{conferenceId}/vhofficer")]
    [ProducesResponseType(typeof(ConferenceResponseVho), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    [SwaggerOperation(OperationId = "GetConferenceByIdVHO")]
    [Authorize(AppRoles.VhOfficerRole)]
    public async Task<ActionResult<ConferenceResponseVho>> GetConferenceByIdVhoAsync(Guid conferenceId, CancellationToken cancellationToken)
    {
        if (conferenceId == Guid.Empty)
        {
            _logger.LogWarning("Unable to get conference when id is not provided");
            ModelState.AddModelError(nameof(conferenceId), $"Please provide a valid {nameof(conferenceId)}");
            
            return BadRequest(ModelState);
        }
        
        var conference = await _conferenceService.GetConference(conferenceId, cancellationToken);
        
        if (!conference.IsWaitingRoomOpen)
        {
            _logger.LogInformation(
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
            .Where(x => displayRoles.Contains(x.Role)).ToList();

        return Ok(ConferenceResponseVhoMapper.Map(conference));
    }

    /// <summary>
    /// Get the details of a conference by id
    /// </summary>
    /// <param name="conferenceId">The unique id of the conference</param>
    /// <param name="cancellationToken"></param>
    /// <returns>the details of a conference, if permitted</returns>
    [ServiceFilter(typeof(CheckParticipantCanAccessConferenceAttribute))]
    [HttpGet("{conferenceId}")]
    [ProducesResponseType(typeof(ConferenceResponse), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    [ProducesResponseType((int)HttpStatusCode.NoContent)]
    [SwaggerOperation(OperationId = "GetConferenceById")]
    public async Task<ActionResult<ConferenceResponse>> GetConferenceByIdAsync(Guid conferenceId, CancellationToken cancellationToken)
    {
        _logger.LogDebug("GetConferenceById");
        
        var userProfile = ClaimsPrincipalToUserProfileResponseMapper.Map(User);
        
        if (conferenceId == Guid.Empty)
        {
            _logger.LogWarning("Unable to get conference when id is not provided");
            ModelState.AddModelError(nameof(conferenceId), $"Please provide a valid {nameof(conferenceId)}");
            return BadRequest(ModelState);
        }
        
        var username = userProfile.Username.ToLower().Trim();
        Conference conference;
        try
        {
            conference = await _conferenceService.ForceGetConference(conferenceId, cancellationToken);
            if (conference == null)
            {
                _logger.LogWarning("Conference details with id: {ConferenceId} not found", conferenceId);
                return NoContent();
            }
        }
        catch (VideoApiException e)
        {
            _logger.LogError(e, "Unable to retrieve conference: {ConferenceId}", conferenceId);
            return StatusCode(e.StatusCode, e.Response);
        }
        
        if (!userProfile.Roles.Contains(Role.StaffMember) &&
            (conference.Participants.TrueForAll(x => x.Username.ToLower().Trim() != username) || !conference.IsWaitingRoomOpen))
        {
            _logger.LogInformation(
                "Unauthorised to view conference details {ConferenceId} because user is neither a VH Officer " +
                "nor a participant of the conference, or the conference has been closed for over 30 minutes", conferenceId);
            return Unauthorized();
        }
        
        return Ok(ConferenceResponseMapper.Map(conference));
    }
    
    private bool IsQuickLinkUser()
    {
        var claims = User.Identities!.FirstOrDefault()?.Claims as List<Claim>;
        var isQuicklinkUser = claims?.Find(x =>
            x.Value == Role.QuickLinkObserver.ToString() || x.Value == Role.QuickLinkParticipant.ToString());
        return isQuicklinkUser != null;
    }
}
