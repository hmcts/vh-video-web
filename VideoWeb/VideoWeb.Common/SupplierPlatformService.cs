using VideoWeb.Common.Security.HashGen;
using VideoWeb.Common.Security.Tokens.Base;

namespace VideoWeb.Common
{
    public interface ISupplierPlatformService
    {
        IJwtTokenProvider GetTokenProvider();
        SupplierConfiguration GetSupplierConfiguration();
    }

    public class SupplierPlatformService : ISupplierPlatformService
    {
        private readonly IJwtTokenProvider _jwtTokenProvider;
        private readonly SupplierConfiguration _supplierConfiguration;
        
        public SupplierPlatformService(IJwtTokenProvider jwtTokenProvider, SupplierConfiguration supplierConfiguration)
        {
            _jwtTokenProvider = jwtTokenProvider;
            _supplierConfiguration = supplierConfiguration;
        }
        
        public IJwtTokenProvider GetTokenProvider() => _jwtTokenProvider;
        
        public SupplierConfiguration GetSupplierConfiguration() => _supplierConfiguration;
    }
}
