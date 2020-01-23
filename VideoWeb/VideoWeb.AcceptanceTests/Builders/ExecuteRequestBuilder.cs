using System.Net;
using FluentAssertions;
using VideoWeb.AcceptanceTests.Helpers;

namespace VideoWeb.AcceptanceTests.Builders
{
    public class ExecuteRequestBuilder
    {
        private TestContext _context;
        private HttpStatusCode _status;

        public ExecuteRequestBuilder WithContext(TestContext context)
        {
            _context = context;
            return this;
        }

        public ExecuteRequestBuilder WithExpectedStatusCode(HttpStatusCode status)
        {
            _status = status;
            return this;
        }

        public void SendToBookingsApi()
        {
            _context.Response = _context.BookingsApiClient().Execute(_context.Request);
            VerifyTheResponse();
        }

        public void SendToVideoApi()
        {
            _context.Response = _context.VideoApiClient().Execute(_context.Request);
            VerifyTheResponse();
        }

        public void SendToVideoWeb()
        {
            _context.SetDefaultVideoWebBearerToken();
            _context.Response = _context.VideoWebClient().Execute(_context.Request);
            VerifyTheResponse();
        }

        public void SendToVideoApiWithoutVerification()
        {
            _context.Response = _context.VideoApiClient().Execute(_context.Request);
        }

        public void SendToVideoWebWithoutVerification()
        {
            _context.Response = _context.VideoWebClient().Execute(_context.Request);
        }

        private void VerifyTheResponse()
        {
            _context.Response.StatusCode.Should().Be(_status);
        }
    }
}
