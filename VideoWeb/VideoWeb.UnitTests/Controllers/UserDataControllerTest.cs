using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using VideoWeb.Contract.Request;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.Services.User;

namespace VideoWeb.UnitTests.Controllers
{
    public class UserDataControllerTest
    {
        private UserDataController _controller;
        private Mock<IUserApiClient> _userApiClientMock;
        private Mock<ILogger<UserDataController>> _mockLogger;

        [SetUp]
        public void Setup()
        {
            _userApiClientMock = new Mock<IUserApiClient>();
            _mockLogger = new Mock<ILogger<UserDataController>>();
            _controller = new UserDataController(_userApiClientMock.Object, _mockLogger.Object);
        }

        [Test]
        public async Task Should_return_list_of_court_rooms_accounts_with_status_ok()
        {
            var accounts = BuildData();
            var usernames = new VhoConferenceFilterQuery { UserNames = new List<string> { "Manual01", "Manual03" } };

            _userApiClientMock.Setup(x => x.GetJudgesAsync()).ReturnsAsync(accounts);

            var result = await _controller.GetCourtRoomsAccounts(usernames);

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
            _userApiClientMock
                .Setup(x => x.GetJudgesAsync())
                .ThrowsAsync(apiException);

            var result = await _controller.GetCourtRoomsAccounts(usernames);
            var typedResult = (ObjectResult)result.Result;
            typedResult.Should().NotBeNull();
            typedResult.StatusCode.Should().Be(apiException.StatusCode);
        }


        private List<UserResponse> BuildData()
        {
            return new List<UserResponse> {
                new UserResponse{First_name="Manual03", Last_name="Court room 01"},
                new UserResponse{First_name="Manual01", Last_name="Court room 03"},
                new UserResponse{First_name="Manual01", Last_name="Court room 02"},
                new UserResponse{First_name="Manual02", Last_name="Court room 01"},
                new UserResponse{First_name="Manual02", Last_name="Court room 02"},
                new UserResponse{First_name="Manual01", Last_name="Court room 01"}
            };
        }
    }
}

