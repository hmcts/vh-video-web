using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Common.Configuration;
using VideoWeb.Contract.Responses;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("config")]
    public class ConfigSettingsController : Controller
    {
        private readonly AzureAdConfiguration _azureAdConfiguration;

        public ConfigSettingsController(IOptions<AzureAdConfiguration> azureAdConfiguration)
        {
            _azureAdConfiguration = azureAdConfiguration.Value;
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
            var clientSettings = new ClientSettingsResponse
            {
                ClientId = _azureAdConfiguration.ClientId,
                TenantId = _azureAdConfiguration.TenantId,
                RedirectUri = _azureAdConfiguration.RedirectUri,
                PostLogoutRedirectUri = _azureAdConfiguration.PostLogoutRedirectUri
            };

            return Ok(clientSettings);
        }
    }
}