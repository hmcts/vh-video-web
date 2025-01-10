using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Common;
using VideoWeb.Common.Configuration;
using VideoWeb.Common.Enums;
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
    IOptions<DynatraceConfiguration> dynatraceConfiguration,
    ISupplierPlatformServiceFactory supplierPlatformServiceFactory,
    ILogger<ConfigSettingsController> logger)
    : BaseNoCacheController
{
    private readonly AzureAdConfiguration _azureAdConfiguration = azureAdConfiguration.Value;
    private readonly EJudAdConfiguration _ejudAdConfiguration = ejudAdConfiguration.Value;
    private readonly Dom1AdConfiguration _dom1AdConfiguration = dom1AdConfiguration.Value;
    private readonly HearingServicesConfiguration _servicesConfiguration = servicesConfiguration.Value;
    private readonly DynatraceConfiguration _dynatraceConfiguration = dynatraceConfiguration.Value;

    /// <summary>
    /// GetClientConfigurationSettings the configuration settings for client
    /// </summary>
    /// <returns></returns>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ClientSettingsResponse), (int)HttpStatusCode.OK)]
    [ProducesResponseType(typeof(string), (int)HttpStatusCode.BadRequest)]
    [SwaggerOperation(OperationId = "GetClientConfigurationSettings")]
    public ActionResult<ClientSettingsResponse> GetClientConfigurationSettings()
    {
        try
        {
            var suppliers = new List<Supplier>
            {
                Supplier.Vodafone
            };
            var supplierConfigurations = suppliers
                .Select(supplierPlatformServiceFactory.Create)
                .Select(platformService => platformService.GetSupplierConfiguration())
                .ToList();
            var clientSettings = ClientSettingsResponseMapper.Map(_azureAdConfiguration, _ejudAdConfiguration, _dom1AdConfiguration, _servicesConfiguration, supplierConfigurations, _dynatraceConfiguration);
            return Ok(clientSettings);
        }
        catch (Exception e)
        {
            logger.LogError(e, "Unable to retrieve client configuration settings");
            return BadRequest(e.Message);
        }
    }
}
