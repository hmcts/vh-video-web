using System;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Helpers;
using VideoWeb.Services.Bookings;
using VideoWeb.Services.User;
using VideoWeb.Services.Video;
using HealthCheckResponse = VideoWeb.Contract.Responses.HealthCheckResponse;
using HealthCheck = VideoWeb.Contract.Responses.HealthCheck;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [Route("HealthCheck")]
    [AllowAnonymous]
    [ApiController]
    public class HealthCheckController : ControllerBase
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly IUserApiClient _userApiClient;
        private readonly ILogger<HealthCheckController> _logger;
        private readonly IBookingsApiClient _bookingsApiClient;

        public HealthCheckController(IVideoApiClient videoApiClient, IUserApiClient userApiClient, 
            ILogger<HealthCheckController> logger, IBookingsApiClient bookingsApiClient)
        {
            _videoApiClient = videoApiClient;
            _userApiClient = userApiClient;
            _logger = logger;
            _bookingsApiClient = bookingsApiClient;
        }

        /// <summary>
        /// Check Service Health
        /// </summary>
        /// <returns>Error if fails, otherwise OK status</returns>
        [HttpGet("health")]
        [SwaggerOperation(OperationId = "CheckServiceHealth")]
        [ProducesResponseType(typeof(HealthCheckResponse), (int) HttpStatusCode.OK)]
        [ProducesResponseType(typeof(HealthCheckResponse), (int) HttpStatusCode.InternalServerError)]
        public async Task<IActionResult> HealthAsync()
        {
            var response = new HealthCheckResponse
            {
                BookingsApiHealth = {Successful = true},
                UserApiHealth = {Successful = true},
                VideoApiHealth = {Successful = true},
                AppVersion = AppVersion.Instance()
            };
            try
            {
                await _userApiClient.GetJudgesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unable to retrieve judges");
                if (!(ex is UserApiException))
                {
                    response.UserApiHealth.Successful = false;
                    response.UserApiHealth.ErrorMessage = ex.Message;
                    response.UserApiHealth.Data = ex.Data;
                }
            }

            try
            {
                await _bookingsApiClient.GetCaseTypesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unable to retrieve case types");
                if (!(ex is BookingsApiException))
                {
                    response.BookingsApiHealth.Successful = false;
                    response.BookingsApiHealth.ErrorMessage = ex.Message;
                    response.BookingsApiHealth.Data = ex.Data;
                }
            }

            try
            {
                await _videoApiClient.GetExpiredOpenConferencesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unable to retrieve expired open conferences");
                response.VideoApiHealth = HandleVideoApiCallException(ex);
            }
            
            if (!response.UserApiHealth.Successful || !response.BookingsApiHealth.Successful ||
                !response.VideoApiHealth.Successful)
            {
                return StatusCode((int) HttpStatusCode.InternalServerError, response);
            }
           
            _logger.LogTrace("Healthcheck successful.");
            return Ok(response);
        }

        private static HealthCheck HandleVideoApiCallException(Exception ex)
        {
            var isApiException = ex is VideoApiException;
            var healthCheck = new HealthCheck {Successful = true};
            if (isApiException && ((VideoApiException)ex).StatusCode != (int)HttpStatusCode.InternalServerError)
            {
                return healthCheck;
            }

            healthCheck.Successful = false;
            healthCheck.ErrorMessage = ex.Message;
            healthCheck.Data = ex.Data;

            return healthCheck;
        }
    }
}
