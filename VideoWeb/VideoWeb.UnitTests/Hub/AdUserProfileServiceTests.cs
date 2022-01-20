using System;
using FluentAssertions;
using Moq;
using NUnit.Framework;
using System.Net;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using VideoWeb.Common.Models;
using VideoWeb.Common.SignalR;
using UserApi.Client;
using UserApi.Contract.Responses;
using VideoApi.Client;
using VideoApi.Contract.Consts;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Responses;

namespace VideoWeb.UnitTests.Hub
{
    public class AdUserProfileServiceTests
    {
        private Mock<IUserApiClient> _userApiClientMock;
        private AdUserProfileService _adUserProfileService;
        private Mock<IVideoApiClient> _videoApiClient;

        [SetUp]
        public void Setup()
        {
            _userApiClientMock = new Mock<IUserApiClient>();
            _videoApiClient = new Mock<IVideoApiClient>();
            _adUserProfileService = new AdUserProfileService(_userApiClientMock.Object, _videoApiClient.Object);
            
        }

        [Test]
        public async Task Should_return_obfuscated_username()
        {
            var userProfile = new UserProfile { UserRole = "VhOfficer", UserName = "vhOfficer.User@hmcts.net", FirstName = "Manual", LastName = "User"};
            _userApiClientMock.Setup(x => x.GetUserByAdUserNameAsync(It.IsAny<string>())).ReturnsAsync(userProfile);

            var obfuscatedUsername = "M***** U***";
            var result = await _adUserProfileService.GetObfuscatedUsernameAsync(userProfile.UserName);
            result.Should().Be(obfuscatedUsername);
        }
        
        [Test]
        public async Task Should_return_quick_link_obfuscated_username()
        {
            var quickLinkParticipantUserName = $"{Guid.Empty}@{QuickLinkParticipantConst.Domain}";
            var userProfile = new UserProfile { UserRole = "VhOfficer", UserName = quickLinkParticipantUserName, FirstName = "Manual", LastName = "User"};
            var obfuscatedUsername = "0*******-0***-0***-0***-0***********@@q****-l***-p**********.c**";
            var result = await _adUserProfileService.GetObfuscatedUsernameAsync(userProfile.UserName);
            result.Should().Be(obfuscatedUsername);
        }

        [Test]
        public async Task Should_return_empty_string_if_user_profile_incorrect()
        {
            var userProfile = new UserProfile { UserRole = "VhOfficer", UserName = "vhOfficer.User@hmcts.net", FirstName = "Manual", LastName = "User" };
            var apiException = new UserApiException("User does not exist", (int)HttpStatusCode.NotFound,
                "Invalid User Id", null, null);
            _userApiClientMock.Setup(x => x.GetUserByAdUserNameAsync(It.IsAny<string>())).ThrowsAsync(apiException);

            var obfuscatedUsername = string.Empty;
            var result = await _adUserProfileService.GetObfuscatedUsernameAsync(userProfile.UserName);
            result.Should().Be(obfuscatedUsername);
        }

        [Test]
        public async Task Should_return_profile_by_username()
        {
            var username = "judge@hmcts.net";
            var role = Role.Judge.ToString();
            var profile =  Builder<UserProfile>.CreateNew()
                .With(x => x.UserName = username)
                .With(x => x.UserRole = role)
                .Build();
            _userApiClientMock.Setup(x => 
                    x.GetUserByAdUserNameAsync(It.Is<string>(x => x == username)))
                .ReturnsAsync(profile);

            var result = await _adUserProfileService.GetUserAsync(username);
            result.Should().BeEquivalentTo(profile);
            
            var emptyResult = await _adUserProfileService.GetUserAsync("doesNot@Exist.com");
            emptyResult.Should().BeNull();
        }
        
        [Test]
        public async Task Should_return_quick_link_participant_profile_by_username()
        {
            var quickLinkParticipantUserName = $"{Guid.NewGuid()}@{QuickLinkParticipantConst.Domain}";
            var profile =  Builder<ParticipantSummaryResponse>.CreateNew()
                .With(x => x.Username = quickLinkParticipantUserName)
                .With(x => x.Id = Guid.Empty)
                .With(x => x.UserRole = UserRole.QuickLinkParticipant)
                .Build();
            _videoApiClient.Setup(x => 
                    x.GetQuickLinkParticipantByUserNameAsync(It.Is<string>(x => x == quickLinkParticipantUserName)))
                .ReturnsAsync(profile);

            var result = await _adUserProfileService.GetUserAsync(quickLinkParticipantUserName);

            result.UserRole.Should().Be(profile.UserRole.ToString());
            result.UserName.Should().Be(quickLinkParticipantUserName);
            result.DisplayName.Should().Be(profile.DisplayName);
        }
    }
}
