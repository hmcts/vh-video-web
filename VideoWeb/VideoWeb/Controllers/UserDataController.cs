using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;
using UserApi.Client;
using UserApi.Contract.Responses;
using VideoApi.Client;
using VideoApi.Contract.Responses;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [Route("api/accounts")]
    [ApiController]
    [Authorize(AppRoles.VhOfficerRole)]
    public class UserDataController : ControllerBase
    {
        private readonly IUserApiClient _userApiClient;
        private readonly ILogger<UserDataController> _logger;
        private readonly IMapperFactory _mapperFactory;
        private readonly IVideoApiClient _videoApiClient;


        public UserDataController(
            IUserApiClient userApiClient,
            ILogger<UserDataController> logger,
            IMapperFactory mapperFactory,
            IVideoApiClient videoApiClient)
        {
            _userApiClient = userApiClient;
            _logger = logger;
            _mapperFactory = mapperFactory;
            _videoApiClient = videoApiClient;
        }

        /// <summary>
        /// Get Court rooms accounts (judges)
        /// </summary>
        [HttpGet("courtrooms", Name = "GetCourtRoomAccounts")]
        [ProducesResponseType(typeof(IList<CourtRoomsAccountResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<ActionResult<IList<CourtRoomsAccountResponse>>> GetCourtRoomsAccounts([FromQuery]VhoConferenceFilterQuery query)
        {
            try
            {
                var conferences = await _videoApiClient.GetConferencesTodayForAdminByHearingVenueNameAsync(query.HearingVenueNames);
                var courtRoomsAccountResponsesMapper = _mapperFactory.Get<IEnumerable<ConferenceForAdminResponse>, List<CourtRoomsAccountResponse>>();
                var accountList = courtRoomsAccountResponsesMapper.Map(conferences);

                return Ok(accountList);
            }
            catch (UserApiException e)
            {
                _logger.LogError(e, "Unable to get list of court rooms accounts");
                return StatusCode(e.StatusCode, e.Response);
            }
        }
    }
}
