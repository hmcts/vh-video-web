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
            var conferences = ConferenceResponseBuilder.BuildData();

            _mocker.Mock<IVideoApiClient>().Setup(x => x.GetConferencesTodayForAdminByHearingVenueNameAsync(_query.HearingVenueNames)).ReturnsAsync(conferences);

            var result = await _sut.GetCourtRoomsAccounts(_query);

            var typedResult = (OkObjectResult)result.Result;
            typedResult.Should().NotBeNull();
            var judgeList = typedResult.Value as List<CourtRoomsAccountResponse>;
            judgeList.Should().NotBeNull();
            judgeList.Count.Should().Be(2);
            judgeList[0].CourtRooms.Count.Should().Be(3);
            judgeList[1].CourtRooms.Count.Should().Be(1);

            judgeList[0].Venue.Should().Be("FirstName1");
            judgeList[1].Venue.Should().Be("FirstName4");

            judgeList[0].CourtRooms[0].Should().Be("LastName1");
            judgeList[0].CourtRooms[1].Should().Be("LastName2");
            judgeList[0].CourtRooms[2].Should().Be("LastName3");

            judgeList[1].CourtRooms[0].Should().Be("LastName4");

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

