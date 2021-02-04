using System;
using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using UserApi.Client;
using UserApi.Contract.Responses;
using VideoWeb.Common.Caching;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;

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
        private readonly IMapperFactory _mapperFactory;

        public ProfilesController(
            IUserApiClient userApiClient,
            ILogger<ProfilesController> logger,
            IUserCache userCache,
            IMapperFactory mapperFactory)
        {
            _userApiClient = userApiClient;
            _logger = logger;
            _userCache = userCache;
            _mapperFactory = mapperFactory;
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
                var claimsPrincipalToUserProfileResponseMapper = _mapperFactory.Get<ClaimsPrincipal, UserProfileResponse>();
                var response = claimsPrincipalToUserProfileResponseMapper.Map(User);
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
                var userProfileToUserProfileResponseMapper = _mapperFactory.Get<UserProfile, UserProfileResponse>();
                var response = userProfileToUserProfileResponseMapper.Map(userProfile);
                
                return Ok(response);
            }
            catch (UserApiException e)
            {
                _logger.LogError(e, $"Unable to get user profile for username: {username}");
                return StatusCode(e.StatusCode, e.Response);
            }
        }
    }
}
