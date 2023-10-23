using System;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Responses;
using VideoWeb.Contract.Request;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.Mappings;
using VideoApi.Client;
using VideoApi.Contract.Requests;
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
                .AddTypedParameters<ParticipantForUserResponseMapper>()
                .Build();
            
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ConferenceForAdminResponse, AllocatedCsoResponse, ConferenceForVhOfficerResponse>()).Returns(_mocker.Create<ConferenceForVhOfficerResponseMapper>(parameters));
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<IEnumerable<ConferenceForVhOfficerResponse>, List<CourtRoomsAccountResponse>>()).Returns(_mocker.Create<CourtRoomsAccountResponseMapper>());
            _sut = _mocker.Create<UserDataController>();
            _query = new VhoConferenceFilterQuery { HearingVenueNames = new List<string> { "Venue Name 01", "Venue Name 02" } };
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetAllocationsForHearingsByVenueAsync(It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync(new List<AllocatedCsoResponse>{Mock.Of<AllocatedCsoResponse>()});

        }

        [Test]
        public async Task Should_return_list_of_court_rooms_accounts_with_status_ok()
        {
            var conferences = ConferenceForAdminResponseBuilder.BuildData();

            _mocker.Mock<IVideoApiClient>().Setup(x => x.GetConferencesForAdminByHearingRefIdAsync(It.IsAny<GetConferencesByHearingIdsRequest>())).ReturnsAsync(conferences);

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
        
        [TestCase(false)]
        [TestCase(true)]
        public async Task Should_return_list_of_court_rooms_accounts_with_status_ok_when_querying_by_cso(bool includeUnallocated)
        {
            // Arrange
            var conferences = ConferenceForAdminResponseBuilder.BuildData();

            _mocker.Mock<IVideoApiClient>().Setup(x => x.GetConferencesForAdminByHearingRefIdAsync(It.IsAny<GetConferencesByHearingIdsRequest>())).ReturnsAsync(conferences);
            
            var allocatedCsoResponses = conferences.Select(conference => new AllocatedCsoResponse { HearingId = conference.HearingRefId}).ToList();
            var allocatedCsoIds = new List<Guid> { Guid.NewGuid(), Guid.NewGuid() };
            // Allocate to a cso that is not in our list
            allocatedCsoResponses[0].Cso = new JusticeUserResponse { FullName = $"TestUserFor{allocatedCsoResponses[0].HearingId}", Id = Guid.NewGuid() }; 
            int i = 1;
            // Allocate to csos in our list
            foreach (var csoId in allocatedCsoIds)
            {
                allocatedCsoResponses[i].Cso = new JusticeUserResponse { FullName = $"TestUserFor{allocatedCsoResponses[i].HearingId}", Id = csoId };
                i++;
            }
            
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetAllocationsForHearingsByVenueAsync(It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync(allocatedCsoResponses);
            
            // Act
            var result = await _sut.GetCourtRoomsAccounts(new VhoConferenceFilterQuery
            {
                AllocatedCsoIds = allocatedCsoIds,
                IncludeUnallocated = includeUnallocated
            });
            
            // Assert
            var typedResult = (OkObjectResult)result.Result;
            typedResult.Should().NotBeNull();
            var courtRoomsAccounts = typedResult.Value as List<CourtRoomsAccountResponse>;
            courtRoomsAccounts.Should().NotBeNull();
            if (!includeUnallocated)
            {
                courtRoomsAccounts.Count.Should().Be(1);
                courtRoomsAccounts[0].LastNames.Count.Should().Be(2);

                courtRoomsAccounts[0].FirstName.Should().Be("FirstName1");

                courtRoomsAccounts[0].LastNames[0].Should().Be("LastName2");
                courtRoomsAccounts[0].LastNames[1].Should().Be("LastName3");
            }
            else
            {
                courtRoomsAccounts.Count.Should().Be(2);
                courtRoomsAccounts[0].LastNames.Count.Should().Be(2);
                courtRoomsAccounts[1].LastNames.Count.Should().Be(1);

                courtRoomsAccounts[0].FirstName.Should().Be("FirstName1");
                courtRoomsAccounts[1].FirstName.Should().Be("FirstName4");

                courtRoomsAccounts[0].LastNames[0].Should().Be("LastName2");
                courtRoomsAccounts[0].LastNames[1].Should().Be("LastName3");
                courtRoomsAccounts[1].LastNames[0].Should().Be("LastName4");
            }
        }

        [Test]
        public async Task Should_return_list_of_court_room_accounts_with_status_ok_when_querying_by_cso_on_unallocated_hearings_only()
        {
            // Arrange
            var conferences = ConferenceForAdminResponseBuilder.BuildData();
            
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetAllocationsForHearingsByVenueAsync(It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync(new List<AllocatedCsoResponse>{Mock.Of<AllocatedCsoResponse>()});
            _mocker.Mock<IVideoApiClient>().Setup(x => x.GetConferencesForAdminByHearingRefIdAsync(It.IsAny<GetConferencesByHearingIdsRequest>())).ReturnsAsync(conferences);
            
            var allocatedCsoResponses = 
                conferences.Select(conference => new AllocatedCsoResponse { HearingId = conference.HearingRefId, Cso = new JusticeUserResponse{FullName = $"TestUserFor{conference.HearingRefId}"}}).ToList();
            var unallocatedHearing = allocatedCsoResponses.First();
            unallocatedHearing.Cso = null;
            
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetAllocationsForHearingsByVenueAsync(It.IsAny<IEnumerable<string>>())).ReturnsAsync(allocatedCsoResponses);
            
            // Act
            var result = await _sut.GetCourtRoomsAccounts(new VhoConferenceFilterQuery
            {
                AllocatedCsoIds = new List<Guid>(),
                IncludeUnallocated = true
            });
            
            // Assert
            var typedResult = (OkObjectResult)result.Result;
            typedResult.Should().NotBeNull();
            var courtRoomsAccounts = typedResult.Value as List<CourtRoomsAccountResponse>;
            courtRoomsAccounts.Should().NotBeNull();

            courtRoomsAccounts.Count.Should().Be(1);
            courtRoomsAccounts[0].FirstName.Should().Be("FirstName1");
            courtRoomsAccounts[0].LastNames[0].Should().Be("LastName1");
        }

        [Test]
        public async Task Should_empty_list_if_no_hearings_found_for_venues()
        {
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetAllocationsForHearingsByVenueAsync(It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync(new List<AllocatedCsoResponse>());
            var result = await _sut.GetCourtRoomsAccounts(_query);
            var courtRoomsAccountResponses = result.Value as List<CourtRoomsAccountResponse>;
            courtRoomsAccountResponses.Should().BeEmpty();
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
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetJusticeUserListAsync(string.Empty, null)).ReturnsAsync(csos);
            var result = await _sut.GetJusticeUsers();
            var objectResult = result.Result as OkObjectResult;
            objectResult.Should().NotBeNull();
            objectResult?.StatusCode.Should().Be(200);
            objectResult?.Value.Should().BeEquivalentTo(csos);
        }     
    }
}

