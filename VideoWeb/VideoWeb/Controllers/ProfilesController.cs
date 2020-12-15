using System;
using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Common.Caching;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;
using VideoWeb.Services.User;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("profile")]
    public class ProfilesController : Controller
    {
        private readonly IUserApiClient _userApiClient;
        private readonly IUserCache _userCache;
        private readonly ILogger<ProfilesController> _logger;
        private readonly IMapTo<UserProfileResponse, ClaimsPrincipal> _claimsPrincipalToUserProfileResponseMapper;
        private readonly IMapTo<UserProfileResponse, UserProfile> _userProfileToUserProfileResponseMapper;

        public ProfilesController(
            IUserApiClient userApiClient,
            ILogger<ProfilesController> logger,
            IUserCache userCache,
            IMapTo<UserProfileResponse, ClaimsPrincipal> claimsPrincipalToUserProfileResponseMapper,
            IMapTo<UserProfileResponse, UserProfile> userProfileToUserProfileResponseMapper)
        {
            _userApiClient = userApiClient;
            _logger = logger;
            _userCache = userCache;
            _claimsPrincipalToUserProfileResponseMapper = claimsPrincipalToUserProfileResponseMapper;
            _userProfileToUserProfileResponseMapper = userProfileToUserProfileResponseMapper;
        }

        /// <summary>
        /// Get profile for logged in user
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [SwaggerOperation(OperationId = "GetUserProfile")]
        [ProducesResponseType(typeof(UserProfileResponse), (int) HttpStatusCode.OK)]
        public IActionResult GetUserProfile()
        {
            try
            {
                var response = _claimsPrincipalToUserProfileResponseMapper.Map(User);
                return Ok(response);
            }
            catch (Exception e)
            {
                const string message = "User does not have permission";
                _logger.LogError(e, message);
                return Unauthorized(message);
            }
        }

        /// <summary>
        /// Get profile for username
        /// </summary>
        /// <param name="username"></param>
        /// <returns></returns>
        [HttpGet("query")]
        [SwaggerOperation(OperationId = "GetProfileByUsername")]
        [ProducesResponseType(typeof(UserProfileResponse), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> GetProfileByUsernameAsync([FromQuery]string username)
        {
            var usernameClean = username.ToLower().Trim();
            try
            {
                var userProfile = await _userCache.GetOrAddAsync
                (
                    usernameClean, key => _userApiClient.GetUserByAdUserNameAsync(usernameClean)
                );
                var response = _userProfileToUserProfileResponseMapper.Map(userProfile);
                return Ok(response);
            }
            catch (UserApiException e)
            {
                _logger.LogError(e, "Unable to get user profile");
                return StatusCode(e.StatusCode, e.Response);
            }
        }
    }
}
