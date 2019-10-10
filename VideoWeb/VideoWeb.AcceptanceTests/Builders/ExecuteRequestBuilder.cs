using System.Net;
using FluentAssertions;
using VideoWeb.AcceptanceTests.Contexts;

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
            GetTheResponse();
            VerifyTheResponse();
        }

        public void SendToVideoApi()
        {
            _context.Response = _context.VideoApiClient().Execute(_context.Request);
            GetTheResponse();
            VerifyTheResponse();
        }

        public void SendToVideoWeb()
        {
            if (_context.RunningVideoWebLocally)
            {
                _context.SetDefaultVideoWebBearerToken();
                _context.Response = _context.VideoWebClient().Execute(_context.Request);
            }
            else
            {
                _context.SetCustomJwTokenForCallback();
                _context.Response = _context.VideoWebEventCallbackClient().Execute(_context.Request);
            }

            GetTheResponse();
            VerifyTheResponse();
        }

        public void SendToVideoApiWithoutVerification()
        {
            _context.Response = _context.VideoApiClient().Execute(_context.Request);
            GetTheResponse();
        }

        public void SendToVideoWebWithoutVerification()
        {
            _context.Response = _context.VideoWebClient().Execute(_context.Request);
            GetTheResponse();
        }

        private void GetTheResponse()
        {
            if (_context.Response.Content != null)
                _context.Json = _context.Response.Content;
        }

        private void VerifyTheResponse()
        {
            _context.Response.StatusCode.Should().Be(_status);
        }
    }
}
