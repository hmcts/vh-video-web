using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Responses;
using Microsoft.AspNetCore.Authorization;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;
using VideoApi.Client;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;
using VideoWeb.Extensions;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [Route("api/accounts")]
    [ApiController]
    [Authorize(AppRoles.VhOfficerRole)]
    public class UserDataController(
        ILogger<UserDataController> logger,
        IMapperFactory mapperFactory,
        IVideoApiClient videoApiClient,
        IBookingsApiClient bookingApiClient)
        : ControllerBase
    {
        /// <summary>
        /// Get Court rooms accounts (judges)
        /// </summary>
        [HttpGet("courtrooms", Name = "GetCourtRoomAccounts")]
        [ProducesResponseType(typeof(IList<CourtRoomsAccountResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<ActionResult<IList<CourtRoomsAccountResponse>>> GetCourtRoomsAccounts([FromQuery] VhoConferenceFilterQuery query)
        {
            var allocatedHearings = await bookingApiClient.GetAllocationsForHearingsByVenueAsync(query.HearingVenueNames);
            if (allocatedHearings == null || !allocatedHearings.Any())
                return new List<CourtRoomsAccountResponse>();
            var request = new GetConferencesByHearingIdsRequest { HearingRefIds = allocatedHearings.Select(x => x.HearingId).ToArray() };
            var conferences = await videoApiClient.GetConferencesForAdminByHearingRefIdAsync(request);
            var conferenceForVhOfficerResponseMapper = mapperFactory.Get<ConferenceForAdminResponse, AllocatedCsoResponse, ConferenceForVhOfficerResponse>();
    
            if(conferences.Count != allocatedHearings.Count)
                logger.LogError(@"Allocated hearings count {HearingCount} does not match conferences count {ConferenceCount}", allocatedHearings.Count, conferences.Count);
            if (conferences.Any(c => c.Participants.TrueForAll(p => p.UserRole != UserRole.Judge)))
                logger.LogError("Conferences exist without a judge )");
            
            var responses = conferences
                .Where(c => c.Participants.Exists(p => p.UserRole != UserRole.Judge) && allocatedHearings.Any(x => x.HearingId == c.HearingRefId))
                .Select(x => conferenceForVhOfficerResponseMapper.Map(x, allocatedHearings.FirstOrDefault(conference => conference.HearingId == x.HearingRefId)))
                .ApplyCsoFilter(query)
                .ToList();

            var courtRoomsAccountResponsesMapper = mapperFactory
                .Get<IEnumerable<ConferenceForVhOfficerResponse>, List<CourtRoomsAccountResponse>>();
            var accountList = courtRoomsAccountResponsesMapper.Map(responses);

            return Ok(accountList);
        }

        /// <summary>
        ///Get CSOS
        /// </summary>
        [HttpGet("csos", Name = "GetCSOs")]
        [ProducesResponseType(typeof(IList<JusticeUserResponse>), (int)HttpStatusCode.OK)]
        public async Task<ActionResult<IList<JusticeUserResponse>>> GetJusticeUsers() =>Ok(await bookingApiClient.GetJusticeUserListAsync(string.Empty, null));
    }
}
