using System;
using System.Net;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("profile")]
    public class ProfilesController : Controller
    {
        private readonly ILogger<ProfilesController> _logger;
        private readonly IMapperFactory _mapperFactory;

        public ProfilesController(
            ILogger<ProfilesController> logger,
            IMapperFactory mapperFactory)
        {
            _logger = logger;
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
    }
}
