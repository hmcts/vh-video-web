using System;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using VideoWeb.Common.Enums;
using VideoWeb.Common.Security.HashGen;
using VideoWeb.Common.Security.Tokens.Base;
using VideoWeb.Common.Security.Tokens.Vodafone;

namespace VideoWeb.Common
{
    public interface ISupplierPlatformServiceFactory
    {
        ISupplierPlatformService Create(Supplier supplier);
    }
    
    public class SupplierPlatformServiceFactory(IServiceProvider serviceProvider) : ISupplierPlatformServiceFactory
    {
        public ISupplierPlatformService Create(Supplier supplier)
        {
            var jwtTokenProvider = GetJwtTokenProvider(supplier);
            var supplierConfiguration = GetSupplierConfiguration(supplier);
            
            return new SupplierPlatformService(jwtTokenProvider, supplierConfiguration);
        }

        private IJwtTokenProvider GetJwtTokenProvider(Supplier supplier) =>
            supplier switch
            {
                Supplier.Vodafone => serviceProvider.GetService<IVodafoneJwtTokenProvider>(),
                _ => throw new InvalidOperationException($"Unsupported supplier {supplier}")
            };

        private VodafoneConfiguration GetSupplierConfiguration(Supplier supplier) =>
            supplier switch
            {
                Supplier.Vodafone => serviceProvider.GetRequiredService<IOptions<VodafoneConfiguration>>().Value,
                _ => throw new InvalidOperationException($"Unsupported supplier {supplier}")
            };
    }
}
