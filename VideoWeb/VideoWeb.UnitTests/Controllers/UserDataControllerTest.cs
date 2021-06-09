using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using VideoWeb.Contract.Request;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.Mappings;
using UserApi.Client;
using UserApi.Contract.Responses;
using VideoApi.Client;
using VideoApi.Contract.Responses;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers
{
    public class UserDataControllerTest
    {
        private AutoMock _mocker;
        private UserDataController _sut;
        private VhoConferenceFilterQuery _query;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<IEnumerable<ConferenceForAdminResponse>, List<CourtRoomsAccountResponse>>()).Returns(_mocker.Create<CourtRoomsAccountResponseMapper>());
            _sut = _mocker.Create<UserDataController>();
            _query = new VhoConferenceFilterQuery { HearingVenueNames = new List<string> { "Venue Name 01", "Venue Name 02" } };
        }

        [Test]
        public async Task Should_return_list_of_court_rooms_accounts_with_status_ok()
        {
            var conferences = ConferenceForAdminResponseBuilder.BuildData();

            _mocker.Mock<IVideoApiClient>().Setup(x => x.GetConferencesTodayForAdminByHearingVenueNameAsync(_query.HearingVenueNames)).ReturnsAsync(conferences);

            var result = await _sut.GetCourtRoomsAccounts(_query);

            var typedResult = (OkObjectResult)result.Result;
            typedResult.Should().NotBeNull();
            var courtRoomsAccounts = typedResult.Value as List<CourtRoomsAccountResponse>;
            courtRoomsAccounts.Should().NotBeNull();
            courtRoomsAccounts.Count.Should().Be(2);
            courtRoomsAccounts[0].LastNames.Count.Should().Be(3);
            courtRoomsAccounts[1].LastNames.Count.Should().Be(1);

            courtRoomsAccounts[0].FirstName.Should().Be("FirstName1");
            courtRoomsAccounts[1].FirstName.Should().Be("FirstName4");

            courtRoomsAccounts[0].LastNames[0].Should().Be("LastName1");
            courtRoomsAccounts[0].LastNames[1].Should().Be("LastName2");
            courtRoomsAccounts[0].LastNames[2].Should().Be("LastName3");

            courtRoomsAccounts[1].LastNames[0].Should().Be("LastName4");

        }

        [Test]
        public async Task Should_return_error_when_unable_to_retrieve_court_rooms_accounts()
        {

            var apiException = new UserApiException("Court rooms accounts not found", (int)HttpStatusCode.BadRequest,
                "Error", null, null);
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferencesTodayForAdminByHearingVenueNameAsync(_query.HearingVenueNames))
                .ThrowsAsync(apiException);

            var result = await _sut.GetCourtRoomsAccounts(_query);
            var typedResult = (ObjectResult)result.Result;
            typedResult.Should().NotBeNull();
            typedResult.StatusCode.Should().Be(apiException.StatusCode);
        }
    }
}

