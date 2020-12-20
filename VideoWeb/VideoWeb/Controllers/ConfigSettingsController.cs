using System;
using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Common.Configuration;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("config")]
    public class ConfigSettingsController : Controller
    {
        private readonly AzureAdConfiguration _azureAdConfiguration;
        private readonly HearingServicesConfiguration _servicesConfiguration;
        private readonly ILogger<ConfigSettingsController> _logger;

        public ConfigSettingsController(IOptions<AzureAdConfiguration> azureAdConfiguration, ILogger<ConfigSettingsController> logger,
            IOptions<HearingServicesConfiguration> servicesConfiguration)
        {
            _azureAdConfiguration = azureAdConfiguration.Value;
            _logger = logger;
            _servicesConfiguration = servicesConfiguration.Value;
        }

        /// <summary>
        /// GetClientConfigurationSettings the configuration settings for client
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ClientSettingsResponse), (int) HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [SwaggerOperation(OperationId = "GetClientConfigurationSettings")]
        public ActionResult<ClientSettingsResponse> GetClientConfigurationSettings()
        {
            var response = new ClientSettingsResponse();
            try
            {
                response =
                    ClientSettingsResponseMapper.MapAppConfigurationToResponseModel(_azureAdConfiguration,
                        _servicesConfiguration);

                _logger.LogTrace($"Client configuration settings successfully retrieved for ClientId: {response.ClientId}");
                return Ok(response);
            }
            catch (Exception e)
            {
                _logger.LogError(e, $"Unable to get client configuration settings for ClientId: {response.ClientId}");
                return BadRequest(e.Message);
            }
        }
    }
}
