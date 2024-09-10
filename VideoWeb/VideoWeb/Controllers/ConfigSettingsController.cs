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
using VideoWeb.Common.Security;
using VideoWeb.Common.Security.HashGen;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;

namespace VideoWeb.Controllers;

[Produces("application/json")]
[ApiController]
[Route("config")]
public class ConfigSettingsController : BaseNoCacheController
{
    private readonly AzureAdConfiguration _azureAdConfiguration;
    private readonly EJudAdConfiguration _ejudAdConfiguration;
    private readonly Dom1AdConfiguration _dom1AdConfiguration;
    private readonly HearingServicesConfiguration _servicesConfiguration;
    private readonly ISupplierPlatformServiceFactory _supplierPlatformServiceFactory;
    private readonly ILogger<ConfigSettingsController> _logger;
    private readonly IFeatureToggles _featureToggles;

    public ConfigSettingsController(IOptions<AzureAdConfiguration> azureAdConfiguration,
        IOptions<EJudAdConfiguration> ejudAdConfiguration,
        IOptions<HearingServicesConfiguration> servicesConfiguration,
        IOptions<Dom1AdConfiguration> dom1AdConfiguration,
        ISupplierPlatformServiceFactory supplierPlatformServiceFactory,
        ILogger<ConfigSettingsController> logger,
        IFeatureToggles featureToggles)
    {
        _azureAdConfiguration = azureAdConfiguration.Value;
        _ejudAdConfiguration = ejudAdConfiguration.Value;
        _servicesConfiguration = servicesConfiguration.Value;
        _dom1AdConfiguration = dom1AdConfiguration.Value;
        _supplierPlatformServiceFactory = supplierPlatformServiceFactory;
        _logger = logger;
        _featureToggles = featureToggles;
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
            var suppliers = new List<Supplier>
            {
                Supplier.Kinly
            };
            if (_featureToggles.Vodafone())
                suppliers.Add(Supplier.Vodafone);
            var supplierConfigurations = suppliers
                .Select(_supplierPlatformServiceFactory.Create)
                .Select(platformService => platformService.GetSupplierConfiguration())
                .ToList();
            var clientSettings = ClientSettingsResponseMapper.Map(_azureAdConfiguration, _ejudAdConfiguration, _dom1AdConfiguration, _servicesConfiguration, supplierConfigurations);
            return Ok(clientSettings);
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Unable to retrieve client configuration settings");
            return BadRequest(e.Message);
        }
    }
}
