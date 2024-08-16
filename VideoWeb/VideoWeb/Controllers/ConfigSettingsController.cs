using System;
using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Common.Configuration;
using VideoWeb.Common.Security;
using VideoWeb.Common.Security.HashGen;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;

namespace VideoWeb.Controllers;

[Produces("application/json")]
[ApiController]
[Route("config")]
public class ConfigSettingsController(
    IOptions<AzureAdConfiguration> azureAdConfiguration,
    IOptions<EJudAdConfiguration> ejudAdConfiguration,
    IOptions<HearingServicesConfiguration> servicesConfiguration,
    IOptions<Dom1AdConfiguration> dom1AdConfiguration,
    ISupplierLocator supplierLocator,
    ILogger<ConfigSettingsController> logger)
    : BaseNoCacheController
{
    private readonly AzureAdConfiguration _azureAdConfiguration = azureAdConfiguration.Value;
    private readonly EJudAdConfiguration _ejudAdConfiguration = ejudAdConfiguration.Value;
    private readonly Dom1AdConfiguration _dom1AdConfiguration = dom1AdConfiguration.Value;
    private readonly HearingServicesConfiguration _servicesConfiguration = servicesConfiguration.Value;
    private readonly SupplierConfiguration _supplierConfiguration = supplierLocator.GetSupplierConfiguration().Value;
    
    
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
            var supplierName = supplierLocator.GetSupplierName();
            var clientSettings = ClientSettingsResponseMapper.Map(_azureAdConfiguration, _ejudAdConfiguration, _dom1AdConfiguration, _servicesConfiguration, _supplierConfiguration, supplierName);
            return Ok(clientSettings);
        }
        catch (Exception e)
        {
            logger.LogError(e, "Unable to retrieve client configuration settings");
            return BadRequest(e.Message);
        }
    }
}
