using System;
using System.IO;
using System.Net;
using System.Text;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Contract.Responses;

namespace VideoWeb.IntegrationTests.Api
{
    public class TokenControllerTests : ControllerTestsBase
    {
        [Test]
        public void should_get_token_when_requested_with_correct_participantid()
        {
            var responseMessage = SendGetRequestAsync($"/participants/{Guid.NewGuid()}/token").Result;

            Stream receiveStream = responseMessage.Content.ReadAsStreamAsync().Result;
            StreamReader readStream = new StreamReader(receiveStream, Encoding.UTF8);
            var json = readStream.ReadToEnd();
            var tokenResponse = ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<TokenResponse>(json);

            responseMessage.StatusCode.Should().Be(HttpStatusCode.OK);
            tokenResponse.Should().NotBeNull();
            tokenResponse.ExpiresOn.Should().BeAfter(DateTime.UtcNow);
            tokenResponse.Token.Should().NotBeEmpty();
        }

        [Test]
        public void should_return_bad_request_when_requested_with_incorrect_participantid()
        {
            var responseMessage = SendGetRequestAsync($"/participants/{Guid.Empty}/token").Result;
            responseMessage.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }
    }
}