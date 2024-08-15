using System;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using VideoWeb.Common.Security.HashGen;
using VideoWeb.Common.Security.Tokens.Base;
using VideoWeb.Common.Security.Tokens.Kinly;
using VideoWeb.Common.Security.Tokens.Vodafone;

namespace VideoWeb.Common.Security;

public interface ISupplierLocator
{
    IJwtTokenProvider GetTokenProvider();
    IOptions<SupplierConfiguration> GetSupplierConfiguration();
    public string GetSupplierName();
}

public class SupplierLocator : ISupplierLocator
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IOptions<KinlyConfiguration> _kinlyConfigOptions;
    private readonly IOptions<VodafoneConfiguration> _vodafoneConfigOptions;
    private readonly IFeatureToggles _featureToggles;

    public SupplierLocator(IServiceProvider serviceProvider,
        IFeatureToggles featureToggles,
        IOptions<KinlyConfiguration> kinlyConfigOptions,
        IOptions<VodafoneConfiguration> vodafoneConfigOptions)
    {
        _serviceProvider = serviceProvider;
        _featureToggles = featureToggles;
        _kinlyConfigOptions = kinlyConfigOptions;
        _vodafoneConfigOptions = vodafoneConfigOptions;
    }
    
    public IJwtTokenProvider GetTokenProvider() => _featureToggles.Vodafone()
        ? _serviceProvider.GetService<IVodafoneJwtTokenProvider>()
        : _serviceProvider.GetService<IKinlyJwtTokenProvider>();
    
    public IOptions<SupplierConfiguration> GetSupplierConfiguration() =>
        _featureToggles.Vodafone() ? _vodafoneConfigOptions : _kinlyConfigOptions;
    
    public string GetSupplierName() => _featureToggles.Vodafone() ? "vodafone" : "kinly";
}
