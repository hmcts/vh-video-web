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
        private readonly IMapperFactory _mapperFactory;

        public ConfigSettingsController(IOptions<AzureAdConfiguration> azureAdConfiguration,
            IOptions<HearingServicesConfiguration> servicesConfiguration, ILogger<ConfigSettingsController> logger,
            IMapperFactory mapperFactory)
        {
            _azureAdConfiguration = azureAdConfiguration.Value;
            _servicesConfiguration = servicesConfiguration.Value;
            _logger = logger;
            _mapperFactory = mapperFactory;
        }

        /// <summary>
        /// GetClientConfigurationSettings the configuration settings for client
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ClientSettingsResponse), (int) HttpStatusCode.OK)]
        [ProducesResponseType(typeof(ClientSettingsResponse), (int) HttpStatusCode.BadRequest)]
        [SwaggerOperation(OperationId = "GetClientConfigurationSettings")]
        public ActionResult<ClientSettingsResponse> GetClientConfigurationSettings()
        {
            var response = new ClientSettingsResponse();
            try
            {
                var clientSettingsResponseMapper = _mapperFactory.Get<AzureAdConfiguration, HearingServicesConfiguration, ClientSettingsResponse>();
                response = clientSettingsResponseMapper.Map(_azureAdConfiguration, _servicesConfiguration);
                return Ok(response);
            }
            catch (Exception e)
            {
                _logger.LogError(e.Message, $"Unable to retrieve client configuration settings for ClientId: {response.ClientId}");
                return BadRequest(e.Message);
            }
        }
    }
}
