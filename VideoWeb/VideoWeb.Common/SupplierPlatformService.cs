using VideoWeb.Common.Security.HashGen;
using VideoWeb.Common.Security.Tokens.Base;

namespace VideoWeb.Common
{
    public interface ISupplierPlatformService
    {
        IJwtTokenProvider GetTokenProvider();
        SupplierConfiguration GetSupplierConfiguration();
    }

    public class SupplierPlatformService(IJwtTokenProvider jwtTokenProvider, SupplierConfiguration supplierConfiguration) : ISupplierPlatformService
    {
        public IJwtTokenProvider GetTokenProvider() => jwtTokenProvider;
        
        public SupplierConfiguration GetSupplierConfiguration() => supplierConfiguration;
    }
}
