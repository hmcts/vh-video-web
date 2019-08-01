using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

namespace VideoWeb.Common.Security
{
    public class VideoCallbackTokenHandler : DelegatingHandler
    {
        private readonly ICustomJwtTokenProvider _customJwtTokenProvider;

        public VideoCallbackTokenHandler(ICustomJwtTokenProvider customJwtTokenProvider)
        {
            _customJwtTokenProvider = customJwtTokenProvider;
        }
        
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            var token = GetCallbackToken();
            request.Headers.Add("Authorization", $"Bearer {token}");
            return await base.SendAsync(request, cancellationToken);
        }
        
        private string GetCallbackToken()
        {
            return _customJwtTokenProvider.GenerateTokenForCallbackEndpoint("VhVideoApi", 2);
        }
    }
}