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
using VideoWeb.Services.User;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers
{
    public class UserDataControllerTest
    {
        private AutoMock _mocker;
        private UserDataController _sut;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<IEnumerable<UserResponse>, IEnumerable<string>, List<CourtRoomsAccountResponse>>()).Returns(_mocker.Create<CourtRoomsAccountResponseMapper>());
            _sut = _mocker.Create<UserDataController>();
        }

        [Test]
        public async Task Should_return_list_of_court_rooms_accounts_with_status_ok()
        {
            var accounts = UserResponseBuilder.BuildData();
            var usernames = new VhoConferenceFilterQuery { UserNames = new List<string> { "Manual01", "Manual03" } };

            _mocker.Mock<IUserApiClient>().Setup(x => x.GetJudgesAsync()).ReturnsAsync(accounts);

            var result = await _sut.GetCourtRoomsAccounts(usernames);

            var typedResult = (OkObjectResult)result.Result;
            typedResult.Should().NotBeNull();
            var judgeList = typedResult.Value as List<CourtRoomsAccountResponse>;
            judgeList.Should().NotBeNull();
            judgeList.Count.Should().Be(2);
            judgeList[0].CourtRooms.Count.Should().Be(3);
            judgeList[1].CourtRooms.Count.Should().Be(1);

            judgeList[0].Venue.Should().Be("Manual01");
            judgeList[1].Venue.Should().Be("Manual03");

            judgeList[0].CourtRooms[0].Should().Be("Court room 01");
            judgeList[0].CourtRooms[1].Should().Be("Court room 02");
            judgeList[0].CourtRooms[2].Should().Be("Court room 03");

            judgeList[1].CourtRooms[0].Should().Be("Court room 01");

        }

        [Test]
        public async Task Should_return_error_when_unable_to_retrieve_court_rooms_accounts()
        {
            var usernames = new VhoConferenceFilterQuery { UserNames = new List<string> { "Manual01", "Manual03" } };

            var apiException = new UserApiException("Court rooms accounts not found", (int)HttpStatusCode.BadRequest,
                "Error", null, null);
            _mocker.Mock<IUserApiClient>()
                .Setup(x => x.GetJudgesAsync())
                .ThrowsAsync(apiException);

            var result = await _sut.GetCourtRoomsAccounts(usernames);
            var typedResult = (ObjectResult)result.Result;
            typedResult.Should().NotBeNull();
            typedResult.StatusCode.Should().Be(apiException.StatusCode);
        }
    }
}

