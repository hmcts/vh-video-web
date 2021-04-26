using System;
using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Common.Configuration;
using VideoWeb.Common.Security.HashGen;
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
        private readonly EJudAdConfiguration _ejudAdConfiguration;
        private readonly HearingServicesConfiguration _servicesConfiguration;
        private readonly ILogger<ConfigSettingsController> _logger;
        private readonly IMapperFactory _mapperFactory;
        private readonly KinlyConfiguration _kinlyConfiguration;

        public ConfigSettingsController(IOptions<AzureAdConfiguration> azureAdConfiguration,
            IOptions<EJudAdConfiguration> ejudAdConfiguration,
            IOptions<HearingServicesConfiguration> servicesConfiguration, KinlyConfiguration kinlyConfiguration,
            ILogger<ConfigSettingsController> logger,
            IMapperFactory mapperFactory)
        {
            _azureAdConfiguration = azureAdConfiguration.Value;
            _ejudAdConfiguration = ejudAdConfiguration.Value;
            _servicesConfiguration = servicesConfiguration.Value;
            _logger = logger;
            _mapperFactory = mapperFactory;
            _kinlyConfiguration = kinlyConfiguration;
        }


        /// <summary>
        /// GetClientConfigurationSettings the configuration settings for client
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ClientSettingsResponse), (int) HttpStatusCode.OK)]
        [ProducesResponseType(typeof(string), (int) HttpStatusCode.BadRequest)]
        [SwaggerOperation(OperationId = "GetClientConfigurationSettings")]
        public ActionResult<ClientSettingsResponse> GetClientConfigurationSettings()
        {
            try
            {
                var clientSettingsResponseMapper = _mapperFactory
                    .Get<AzureAdConfiguration, EJudAdConfiguration, HearingServicesConfiguration, KinlyConfiguration, ClientSettingsResponse
                    >();
                var response = clientSettingsResponseMapper.Map(_azureAdConfiguration, _ejudAdConfiguration, _servicesConfiguration,
                    _kinlyConfiguration);
                return Ok(response);
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Unable to retrieve client configuration settings");
                return BadRequest(e.Message);
            }
        }
    }
}
