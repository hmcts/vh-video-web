using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Autofac;
using Autofac.Extras.Moq;
using BookingsApi.Client;
using BookingsApi.Contract.Responses;
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Services;

namespace VideoWeb.UnitTests.Services
{
    public class AppRoleServiceTests
    {
        private AutoMock _mocker;
        private AppRoleService _sut;
        private MemoryCache _cache;

        [SetUp]
        public void Setup()
        {
            _cache = new MemoryCache(new MemoryCacheOptions());
            _mocker = AutoMock.GetLoose(builder => builder.RegisterInstance<IMemoryCache>(_cache));
            _sut = _mocker.Create<AppRoleService>();
        }

        [TestCase(AppRoleService.JusticeUserRole.VhTeamLead, AppRoles.VhOfficerRole)]
        [TestCase(AppRoleService.JusticeUserRole.Vho, AppRoles.VhOfficerRole)]
        [TestCase(AppRoleService.JusticeUserRole.CaseAdmin, AppRoles.CaseAdminRole)]
        [TestCase(AppRoleService.JusticeUserRole.Judge, AppRoles.JudgeRole)]
        [TestCase(AppRoleService.JusticeUserRole.StaffMember, AppRoles.StaffMember)]
        public async Task should_map_justice_user_role_to_app_role_and_set_cache(
            AppRoleService.JusticeUserRole justiceUserRole, string expectedAppRole)
        {
            // arrange
            var username = "random@claims.com";
            var uniqueId = Guid.NewGuid().ToString();
            var justiceUser = new JusticeUserResponse()
            {
                UserRoleId = (int) justiceUserRole,
                Username = username,
                Deleted = false,
                Id = Guid.NewGuid(),
                UserRoleName = justiceUserRole.ToString()
            };
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetJusticeUserByUsernameAsync(username))
                .ReturnsAsync(justiceUser);

            // act
            var claims = await _sut.GetClaimsForUserAsync(uniqueId, username);

            // assert
            claims.Count.Should().Be(1);
            claims[0].Value.Should().Be(expectedAppRole);
            _cache.Get(uniqueId).Should().Be(claims);
        }

        [Test]
        public async Task should_retrieve_claims_from_cache_if_key_is_present()
        {
            // arrange
            var username = "random@claims.com";
            var uniqueId = Guid.NewGuid().ToString();
            var existingClaims = new List<Claim>()
            {
                new(ClaimTypes.Role, AppRoles.JudgeRole)
            };
            _cache.Set(uniqueId, existingClaims);

            // act
            var claims = await _sut.GetClaimsForUserAsync(uniqueId, username);

            // assert
            claims.Should().BeEquivalentTo(existingClaims);
            _mocker.Mock<IBookingsApiClient>().Verify(x => x.GetJusticeUserByUsernameAsync(username), Times.Never);
        }

        [Test]
        public async Task should_return_an_empty_list_of_claims_if_no_justice_user_is_found()
        {
            // arrange
            var username = "random@claims.com";
            var uniqueId = Guid.NewGuid().ToString();
            _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetJusticeUserByUsernameAsync(username))
                .ReturnsAsync((JusticeUserResponse) null);
        
            // act
            var claims = await _sut.GetClaimsForUserAsync(uniqueId, username);

            // assert
            claims.Should().BeEmpty();
        }
    
    }
}
