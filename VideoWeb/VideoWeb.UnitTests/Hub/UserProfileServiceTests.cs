using System;
using FluentAssertions;
using Moq;
using NUnit.Framework;
using System.Net;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using VideoWeb.Common.Models;
using VideoApi.Contract.Consts;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Responses;
using VideoWeb.Common;
using VideoWeb.Common.Caching;
using System.Collections.Generic;
using System.Security.Claims;
using ParticipantSummaryResponse = VideoApi.Contract.Responses.ParticipantSummaryResponse;

namespace VideoWeb.UnitTests.Hub
{
    public class UserProfileServiceTests
    {
        private Mock<IUserProfileCache> _userCacheMock;
        private UserProfileService _userProfileService;

        [SetUp]
        public void Setup()
        {
            _userCacheMock = new Mock<IUserProfileCache>();
            _userProfileService = new UserProfileService(_userCacheMock.Object);
        }

        [Test]
        public void Should_return_obfuscated_username()
        {
            var userProfile = new UserProfile { Roles = new List<Role> { Role.VideoHearingsOfficer }, UserName = "vhOfficer.User@hmcts.net", FirstName = "Manual", LastName = "User" };
            var obfuscatedUsername = "v********.U***@h****.n**";
            var result = _userProfileService.GetObfuscatedUsername(userProfile.UserName);
            result.Should().Be(obfuscatedUsername);
        }

        [Test]
        public void Should_return_quick_link_obfuscated_username()
        {
            var quickLinkParticipantUserName = $"{Guid.Empty}@{QuickLinkParticipantConst.Domain}";
            var userProfile = new UserProfile { Roles = new List<Role> { Role.VideoHearingsOfficer }, UserName = quickLinkParticipantUserName, FirstName = "Manual", LastName = "User" };
            var obfuscatedUsername = "0*******-0***-0***-0***-0***********@@q****-l***-p**********.c**";
            var result = _userProfileService.GetObfuscatedUsername(userProfile.UserName);
            result.Should().Be(obfuscatedUsername);
        }

        [Test]
        public async Task Should_return_profile_by_username()
        {
            var username = "judge@hmcts.net";
            var role = Role.Judge.ToString();
            var profile = Builder<UserProfile>.CreateNew()
                .With(x => x.UserName = username)
                .With(x => x.Roles = new List<Role> { Role.VideoHearingsOfficer })
                .Build();

            _userCacheMock.Setup(x => x.GetOrAddAsync(username, null)).ReturnsAsync(It.IsAny<UserProfile>());

            var emptyResult = await _userProfileService.GetUserAsync("doesNot@Exist.com");
            emptyResult.Should().BeNull();
        }

        [Test]
        public async Task Should_return_quick_link_participant_profile_by_username()
        {
            var quickLinkParticipantUserName = $"{Guid.NewGuid()}@{QuickLinkParticipantConst.Domain}";
            var profile = Builder<ParticipantSummaryResponse>.CreateNew()
                .With(x => x.Username = quickLinkParticipantUserName)
                .With(x => x.Id = Guid.Empty)
                .With(x => x.UserRole = UserRole.QuickLinkParticipant)
                .Build();

            var userProfile = new UserProfile { UserName = quickLinkParticipantUserName, 
                Roles = new List<Role> { Role.QuickLinkParticipant }, DisplayName = profile.DisplayName };

            _userCacheMock.Setup(x => x.GetAsync(quickLinkParticipantUserName)).ReturnsAsync(userProfile);
            var result = await _userProfileService.GetUserAsync(quickLinkParticipantUserName);

            result.Roles.Should().Contain(Role.QuickLinkParticipant);

            result.UserName.Should().Be(quickLinkParticipantUserName);
            result.DisplayName.Should().Be(profile.DisplayName);
        }

        [TestCase("VHO", Role.VideoHearingsOfficer)]
        [TestCase("Citizen", Role.Individual)]
        [TestCase("ProfessionalUser", Role.Representative)]
        [TestCase("StaffMember", Role.StaffMember)]
        [TestCase("QuickLinkObserver", Role.QuickLinkObserver)]
        [TestCase("QuickLinkParticipant", Role.QuickLinkParticipant)]
        [TestCase("JudicialOfficeHolder", Role.JudicialOfficeHolder)]
        [TestCase("Judge", Role.Judge)]
        public async Task Should_cache_profile_by_username(string appRole, Role userRole)
        {
            var username = "VHO@hmcts.net";
            var role = Role.Judge.ToString();
            var profile = Builder<UserProfile>.CreateNew()
                .With(x => x.UserName = username)
                .With(x => x.Roles = new List<Role> { userRole })
                .Build();

            var identity = new ClaimsIdentity(new List<Claim> { 
                new Claim(ClaimTypes.Name, username),
                new Claim(ClaimTypes.Role, appRole),
                new Claim(ClaimTypes.GivenName, profile.FirstName),
                new Claim(ClaimTypes.Surname, profile.LastName),
                new Claim(ClaimTypes.Surname, profile.LastName),
                new Claim(ClaimTypes.Email, username),
                new Claim(ClaimTypes.NameIdentifier, username)}, "Basic" );

            var principal = new ClaimsPrincipal(identity);

            var userProfile = await _userProfileService.CacheUserProfileAsync(principal);
            userProfile.Should().BeNull();
        }

        [Test]
        public async Task Should_cache_profile_when_given_name_and_surname_claims_dont_exist()
        {
            var username = "Judge@hmcts.net";
            var appRole = "Judge";

            var identity = new ClaimsIdentity(new List<Claim> { 
                new(ClaimTypes.Name, username),
                new(ClaimTypes.Role, appRole),
                new(ClaimTypes.Email, username),
                new(ClaimTypes.NameIdentifier, username)}, "Basic" );

            var principal = new ClaimsPrincipal(identity);

            var userProfile = await _userProfileService.CacheUserProfileAsync(principal);
            userProfile.Should().BeNull();
        }
    }
}
