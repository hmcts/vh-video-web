using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
        private readonly IMapperFactory _mapperFactory;

        public ConfigSettingsController(IOptions<AzureAdConfiguration> azureAdConfiguration,
            IOptions<HearingServicesConfiguration> servicesConfiguration,
            IMapperFactory mapperFactory)
        {
            _azureAdConfiguration = azureAdConfiguration.Value;
            _servicesConfiguration = servicesConfiguration.Value;
            _mapperFactory = mapperFactory;
        }

        /// <summary>
        /// GetClientConfigurationSettings the configuration settings for client
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ClientSettingsResponse), (int) HttpStatusCode.OK)]
        [SwaggerOperation(OperationId = "GetClientConfigurationSettings")]
        public ActionResult<ClientSettingsResponse> GetClientConfigurationSettings()
        {
            var clientSettingsResponseMapper = _mapperFactory.Get<AzureAdConfiguration, HearingServicesConfiguration, ClientSettingsResponse>();
            var response = clientSettingsResponseMapper.Map(_azureAdConfiguration, _servicesConfiguration);
            return Ok(response);
        }
    }
}
