using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Requests.Enums;
using BookingsApi.Contract.V1.Responses;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoWeb.Common;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;

namespace VideoWeb.UnitTests.Services
{
    public class AppRoleServiceTests
    {
        private AppRoleService _sut;
        private Mock<IUserClaimsCache> _cacheMock;
        private Mock<IBookingsApiClient> _bookingsApiClientMock;
        private Mock<ILogger<AppRoleService>> _loggerMock;

        [SetUp]
        public void Setup()
        {
            _cacheMock = new Mock<IUserClaimsCache>();
            _bookingsApiClientMock = new Mock<IBookingsApiClient>();
            _loggerMock = new Mock<ILogger<AppRoleService>>();
            _sut = new AppRoleService(_cacheMock.Object, _bookingsApiClientMock.Object, _loggerMock.Object);
        }

        [TestCase(JusticeUserRole.Vho, AppRoles.VhOfficerRole)]
        [TestCase(JusticeUserRole.CaseAdmin, AppRoles.CaseAdminRole)]
        [TestCase(JusticeUserRole.Judge, AppRoles.JudgeRole)]
        [TestCase(JusticeUserRole.StaffMember, AppRoles.StaffMember)]
        public async Task should_map_justice_user_role_to_app_role_and_set_cache(JusticeUserRole justiceUserRole,
            string expectedAppRole)
        {
            // arrange
            var username = "random@claims.com";
            var justiceUser = InitJusticeUser(new List<JusticeUserRole>(){justiceUserRole}, username);
            _bookingsApiClientMock.Setup(x => x.GetJusticeUserByUsernameAsync(username))
                .ReturnsAsync(justiceUser);

            var userClaims = new List<Claim>
            {
                new(ClaimTypes.GivenName, justiceUser.FirstName),
                new(ClaimTypes.Surname, justiceUser.Lastname),
                new(ClaimTypes.Name, justiceUser.FullName),
                new(ClaimTypes.Role, expectedAppRole)
            };

            _cacheMock.Setup(x => x.GetAsync(username)).ReturnsAsync(userClaims);
            // act
            var claims = await _sut.GetClaimsForUserAsync(username);

            // assert
            claims.Count.Should().Be(4); // name, given name, surname and role
            claims.First(x => x.Type == ClaimTypes.Role).Value.Should().Be(expectedAppRole);
            claims.First(x => x.Type == ClaimTypes.GivenName).Value.Should().Be(justiceUser.FirstName);
            claims.First(x => x.Type == ClaimTypes.Surname).Value.Should().Be(justiceUser.Lastname);
            claims.First(x => x.Type == ClaimTypes.Name).Value.Should().Be(justiceUser.FullName);
        }
        
        [Test]
        public async Task should_map_justice_user_team_lead_to_admin_and_vho_app_role_and_set_cache()
        {
            // arrange
            const JusticeUserRole justiceUserRole = JusticeUserRole.VhTeamLead;
            string[] expectedAppRoles = new[] { AppRoles.VhOfficerRole, AppRoles.Administrator };
            
            var username = "random@claims.com";
            var justiceUser = InitJusticeUser(new List<JusticeUserRole>(){justiceUserRole}, username);
            _bookingsApiClientMock.Setup(x => x.GetJusticeUserByUsernameAsync(username))
                .ReturnsAsync(justiceUser);
            
            var userClaims = new List<Claim>
            {
                new(ClaimTypes.GivenName, justiceUser.FirstName),
                new(ClaimTypes.Surname, justiceUser.Lastname),
                new(ClaimTypes.Name, justiceUser.FullName),
                new(ClaimTypes.Role, AppRoles.Administrator),
                new(ClaimTypes.Role, AppRoles.VhOfficerRole),
            };
            
            _cacheMock.Setup(x => x.GetAsync(username)).ReturnsAsync(userClaims);
            // act
            var claims = await _sut.GetClaimsForUserAsync(username);
            
            // assert
            claims.Count.Should().Be(5); // name, given name, surname, admin and vho role
            claims.Where(x => x.Type == ClaimTypes.Role).Select(x => x.Value).Should().BeEquivalentTo(expectedAppRoles);
            claims.First(x => x.Type == ClaimTypes.GivenName).Value.Should().Be(justiceUser.FirstName);
            claims.First(x => x.Type == ClaimTypes.Surname).Value.Should().Be(justiceUser.Lastname);
            claims.First(x => x.Type == ClaimTypes.Name).Value.Should().Be(justiceUser.FullName);
        }

        [Test]
        public async Task should_return_list_of_claims_without_role_if_justice_user_has_no_justice_role()
        {
            // arrange
            var username = "random@claims.com";
            var justiceUser = InitJusticeUser(new List<JusticeUserRole>(), username);
            _bookingsApiClientMock.Setup(x => x.GetJusticeUserByUsernameAsync(username))
                .ReturnsAsync(justiceUser);

            // act
            var claims = await _sut.GetClaimsForUserAsync(username);

            // assert
            claims.Count.Should().Be(3); // name, given name and surname
            claims.First(x=>x.Type == ClaimTypes.GivenName).Value.Should().Be(justiceUser.FirstName);
            claims.First(x=>x.Type == ClaimTypes.Surname).Value.Should().Be(justiceUser.Lastname);
            claims.First(x=>x.Type == ClaimTypes.Name).Value.Should().Be(justiceUser.FullName);
        }
        
        [Test]
        public async Task should_return_list_of_claims_without_role_if_justice_user_has_unsupported_justice_role()
        {
            // arrange
            var username = "random@claims.com";
            var justiceUser = InitJusticeUser(new List<JusticeUserRole>() {JusticeUserRole.Clerk}, username);
            _bookingsApiClientMock.Setup(x => x.GetJusticeUserByUsernameAsync(username))
                .ReturnsAsync(justiceUser);

            // act
            var claims = await _sut.GetClaimsForUserAsync(username);

            // assert
            claims.Count.Should().Be(3); // name, given name and surname
            claims.First(x=>x.Type == ClaimTypes.GivenName).Value.Should().Be(justiceUser.FirstName);
            claims.First(x=>x.Type == ClaimTypes.Surname).Value.Should().Be(justiceUser.Lastname);
            claims.First(x=>x.Type == ClaimTypes.Name).Value.Should().Be(justiceUser.FullName);
        }

        [Test]
        public async Task should_retrieve_claims_from_cache_if_key_is_present()
        {
            // arrange
            var username = "random@claims.com";
            var existingClaims = new List<Claim>()
            {
                new(ClaimTypes.Role, AppRoles.JudgeRole)
            };
            _cacheMock.Setup(x => x.GetAsync(username)).ReturnsAsync(existingClaims);

            // act
            var claims = await _sut.GetClaimsForUserAsync(username);

            // assert
            claims.Should().BeEquivalentTo(existingClaims);
            _bookingsApiClientMock.Verify(x => x.GetJusticeUserByUsernameAsync(username), Times.Never);
        }

        [Test]
        public async Task should_return_an_empty_list_of_claims_if_no_justice_user_is_found()
        {
            // arrange
            var username = "random@claims.com";
            var apiException = new BookingsApiException<string>("Conflict", (int) HttpStatusCode.NotFound,
                "Conflict", null, null, null);
            _bookingsApiClientMock.Setup(x => x.GetJusticeUserByUsernameAsync(username))
                .ThrowsAsync(apiException);

            // act
            var claims = await _sut.GetClaimsForUserAsync(username);

            // assert
            claims.Should().BeEmpty();
        }

        private static JusticeUserResponse InitJusticeUser(List<JusticeUserRole> justiceUserRoles, string username)
        {
            return new JusticeUserResponse()
            {
                Username = username,
                Deleted = false,
                Id = Guid.NewGuid(),
                UserRoles = justiceUserRoles,
                FirstName = "John",
                Lastname = "Doe",
                FullName = "John Doe"
            };
        }
    }
}
