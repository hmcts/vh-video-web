using System;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using BookingsApi.Client;
using BookingsApi.Contract.Responses;
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
            
            var parameters = new ParameterBuilder(_mocker)
                // .AddTypedParameters<ParticipantResponseMapper>()
                // .AddTypedParameters<EndpointsResponseMapper>()
                // .AddTypedParameters<ParticipantForHostResponseMapper>()
                // .AddTypedParameters<ParticipantResponseForVhoMapper>()
                .AddTypedParameters<ParticipantForUserResponseMapper>()
                // .AddTypedParameters<ConferenceForHostResponseMapper>()
                .Build();
            
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ConferenceForAdminResponse, ConferenceForVhOfficerResponse>()).Returns(_mocker.Create<ConferenceForVhOfficerResponseMapper>(parameters));
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<IEnumerable<ConferenceForVhOfficerResponse>, List<CourtRoomsAccountResponse>>()).Returns(_mocker.Create<CourtRoomsAccountResponseMapper>());
            _sut = _mocker.Create<UserDataController>();
            _query = new VhoConferenceFilterQuery { HearingVenueNames = new List<string> { "Venue Name 01", "Venue Name 02" } };
        }

        [Test]
        public async Task Should_return_list_of_court_rooms_accounts_with_status_ok()
        {
            var conferences = ConferenceForAdminResponseBuilder.BuildData();

            _mocker.Mock<IVideoApiClient>().Setup(x => x.GetConferencesTodayForAdminByHearingVenueNameAsync(_query.HearingVenueNames)).ReturnsAsync(conferences);
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetAllocationsForHearingsAsync(It.IsAny<IEnumerable<Guid>>())).ReturnsAsync(new List<AllocatedCsoResponse>());

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

        [Test]
        public async Task GetVenuesByCso_should_return_list_of_venue_names()
        {
            var csos = new List<JusticeUserResponse>
            {
                Mock.Of<JusticeUserResponse>(),
                Mock.Of<JusticeUserResponse>(),
                Mock.Of<JusticeUserResponse>(),
            };
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetJusticeUserListAsync(null, false)).ReturnsAsync(csos);
            var result = await _sut.GetJusticeUsers();
            var objectResult = result.Result as OkObjectResult;
            objectResult.Should().NotBeNull();
            objectResult?.StatusCode.Should().Be(200);
            objectResult?.Value.Should().BeEquivalentTo(csos);
        }     
    }
}

