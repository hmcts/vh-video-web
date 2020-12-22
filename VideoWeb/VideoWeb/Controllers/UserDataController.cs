using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;
using VideoWeb.Services.User;

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

        public UserDataController(
            IUserApiClient userApiClient,
            ILogger<UserDataController> logger,
            IMapperFactory mapperFactory)
        {
            _userApiClient = userApiClient;
            _logger = logger;
            _mapperFactory = mapperFactory;
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
                var response = await _userApiClient.GetJudgesAsync();
                var courtRoomsAccountResponsesMapper = _mapperFactory.Get<IEnumerable<UserResponse>, IEnumerable<string>, List<CourtRoomsAccountResponse>>();
                var accountList = courtRoomsAccountResponsesMapper.Map(response, query.UserNames);

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
