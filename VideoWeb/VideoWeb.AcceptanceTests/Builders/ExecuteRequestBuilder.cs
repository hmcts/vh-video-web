using System.Net;
using FluentAssertions;
using VideoWeb.AcceptanceTests.Contexts;

namespace VideoWeb.AcceptanceTests.Builders
{
    public class ExecuteRequestBuilder
    {
        private TestContext _context;
        private HttpStatusCode _status = HttpStatusCode.OK;

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
        }

        public void SendToVideoApi()
        {
            _context.Response = _context.VideoApiClient().Execute(_context.Request);
            GetTheResponse();
        }

        public void SendAndVerifyTheResponseIs(HttpStatusCode status)
        {
            SendToVideoApi();
            GetTheResponse();
            _context.Response.StatusCode.Should().Be(status);
        }

        private void GetTheResponse()
        {
            if (_context.Response.Content != null)
                _context.Json = _context.Response.Content;
        }
    }
}
