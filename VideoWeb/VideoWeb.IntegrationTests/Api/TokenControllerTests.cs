using System;
using System.IO;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Helpers;
using VideoWeb.Contract.Responses;

namespace VideoWeb.IntegrationTests.Api
{
    public class TokenControllerTests : ControllerTestsBase
    {
        [Test]
        public async Task Should_get_token_when_requested_with_correct_participant_id()
        {
            var responseMessage = await SendGetRequestAsync($"/participants/{Guid.NewGuid()}/selftesttoken");

            var receiveStream = await responseMessage.Content.ReadAsStreamAsync();
            var readStream = new StreamReader(receiveStream, Encoding.UTF8);
            var json = readStream.ReadToEnd();
            var tokenResponse = ApiRequestHelper.Deserialise<TokenResponse>(json);

            responseMessage.StatusCode.Should().Be(HttpStatusCode.OK);
            tokenResponse.Should().NotBeNull();
            tokenResponse.Token.Should().NotBeEmpty();
        }

        [Test]
        public async Task Should_return_bad_request_when_requested_with_incorrect_participant_id()
        {
            var responseMessage = await SendGetRequestAsync($"/participants/{Guid.Empty}/selftesttoken");
            responseMessage.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }
    }
}
