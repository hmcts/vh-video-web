using System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using BookingsApi.Client;
using BookingsApi.Contract.Responses;
using Microsoft.AspNetCore.Authorization;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;
using UserApi.Client;
using VideoApi.Client;
using VideoApi.Contract.Responses;
using VideoWeb.Extensions;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [Route("api/accounts")]
    [ApiController]
    [Authorize(AppRoles.VhOfficerRole)]
    public class UserDataController : ControllerBase
    {
        private readonly ILogger<UserDataController> _logger;
        private readonly IMapperFactory _mapperFactory;
        private readonly IVideoApiClient _videoApiClient;
        private readonly IBookingsApiClient _bookingApiClient;

        public UserDataController(
            ILogger<UserDataController> logger,
            IMapperFactory mapperFactory,
            IVideoApiClient videoApiClient, IBookingsApiClient bookingApiClient)
        {
            _logger = logger;
            _mapperFactory = mapperFactory;
            _videoApiClient = videoApiClient;
            _bookingApiClient = bookingApiClient;
        }

        /// <summary>
        /// Get Court rooms accounts (judges)
        /// </summary>
        [HttpGet("courtrooms", Name = "GetCourtRoomAccounts")]
        [ProducesResponseType(typeof(IList<CourtRoomsAccountResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<ActionResult<IList<CourtRoomsAccountResponse>>> GetCourtRoomsAccounts([FromQuery] VhoConferenceFilterQuery query)
        {
            try
            {
                var conferences =
                    await _videoApiClient.GetConferencesTodayForAdminByHearingVenueNameAsync(query.HearingVenueNames);
                var allocatedHearings =
                    await _bookingApiClient.GetAllocationsForHearingsAsync(conferences.Select(e => e.HearingRefId));
                var conferenceForVhOfficerResponseMapper = _mapperFactory.Get<ConferenceForAdminResponse, AllocatedCsoResponse, ConferenceForVhOfficerResponse>();
     
                var responses = conferences
                    .Select(x => conferenceForVhOfficerResponseMapper.Map(x, allocatedHearings?.FirstOrDefault(conference => conference.HearingId == x.HearingRefId)))
                    .ApplyCsoFilter(query)
                    .ToList();

                var courtRoomsAccountResponsesMapper = _mapperFactory
                    .Get<IEnumerable<ConferenceForVhOfficerResponse>, List<CourtRoomsAccountResponse>>();
                var accountList = courtRoomsAccountResponsesMapper.Map(responses);

                return Ok(accountList);
            }
            catch (UserApiException e)
            {
                _logger.LogError(e, "Unable to get list of court rooms accounts");
                return StatusCode(e.StatusCode, e.Response);
            }
        }

        /// <summary>
        ///Get CSOS
        /// </summary>
        [HttpGet("csos", Name = "GetCSOs")]
        [ProducesResponseType(typeof(IList<JusticeUserResponse>), (int)HttpStatusCode.OK)]
        public async Task<ActionResult<IList<JusticeUserResponse>>> GetJusticeUsers() =>Ok(await _bookingApiClient.GetJusticeUserListAsync(String.Empty, null));
    }
}
