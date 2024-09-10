using System;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using VideoWeb.Common.Enums;
using VideoWeb.Common.Security.HashGen;
using VideoWeb.Common.Security.Tokens.Base;
using VideoWeb.Common.Security.Tokens.Kinly;
using VideoWeb.Common.Security.Tokens.Vodafone;

namespace VideoWeb.Common
{
    public interface ISupplierPlatformServiceFactory
    {
        ISupplierPlatformService Create(Supplier supplier);
    }
    
    public class SupplierPlatformServiceFactory : ISupplierPlatformServiceFactory
    {
        private readonly IServiceProvider _serviceProvider;
        
        public SupplierPlatformServiceFactory(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }
        
        public ISupplierPlatformService Create(Supplier supplier)
        {
            var jwtTokenProvider = GetJwtTokenProvider(supplier);
            var supplierConfiguration = GetSupplierConfiguration(supplier);
            
            return new SupplierPlatformService(jwtTokenProvider, supplierConfiguration);
        }

        private IJwtTokenProvider GetJwtTokenProvider(Supplier supplier) =>
            supplier switch
            {
                Supplier.Kinly => _serviceProvider.GetService<IKinlyJwtTokenProvider>(),
                Supplier.Vodafone => _serviceProvider.GetService<IVodafoneJwtTokenProvider>(),
                _ => throw new InvalidOperationException($"Unsupported supplier {supplier}")
            };

        private SupplierConfiguration GetSupplierConfiguration(Supplier supplier) =>
            supplier switch
            {
                Supplier.Kinly => _serviceProvider.GetRequiredService<IOptions<KinlyConfiguration>>().Value,
                Supplier.Vodafone => _serviceProvider.GetRequiredService<IOptions<VodafoneConfiguration>>().Value,
                _ => throw new InvalidOperationException($"Unsupported supplier {supplier}")
            };
    }
}
