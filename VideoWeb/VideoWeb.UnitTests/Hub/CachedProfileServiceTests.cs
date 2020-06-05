using System;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using FluentAssertions;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.SignalR;
using VideoWeb.Services.User;

namespace VideoWeb.UnitTests.Hub
{
    public class CachedProfileServiceTests
    {
        private AdUserProfileService _adUserProfileService;
        private Mock<IUserApiClient> _userApiClientMock;
        private DictionaryUserCache _userCache;
        private CachedProfileService _cachedProfileService;
        
        private readonly string _username = "test@aa.com";
        private UserProfile _profile;

        [SetUp]
        public void Setup()
        {
            _profile = InitProfile(_username);
            _userApiClientMock = new Mock<IUserApiClient>();
            _userCache = new DictionaryUserCache();
            _adUserProfileService = new AdUserProfileService(_userApiClientMock.Object);
            _cachedProfileService = new CachedProfileService(_adUserProfileService, _userCache);
        }

        [Test]
        public async Task should_call_ad_obfuscate()
        {
            _userApiClientMock.Setup(x => x.GetUserByAdUserNameAsync(_username)).ReturnsAsync(_profile);
            var result = await _cachedProfileService.GetObfuscatedUsernameAsync(_username);
            var split = result.Split(' ');
            split[0].Should().StartWith(_profile.First_name[0].ToString());
            split[0].Should().EndWith("*");
            split[1].Should().StartWith(_profile.Last_name[0].ToString());
            split[1].Should().EndWith("*");
        }

        [Test]
        public async Task should_call_service_if_cache_does_not_contain_user()
        {
            var username = "test@aa.com";
            await _cachedProfileService.GetUserAsync(username);
            _userApiClientMock.Verify(
                x => x.GetUserByAdUserNameAsync(It.Is<string>(u =>
                    u.Equals(username, StringComparison.InvariantCultureIgnoreCase))), Times.Once);
        }
        
        [Test]
        public async Task should_not_call_service_if_cache_contains_user()
        {
            var username = "test@aa.com";
            var profile = Builder<UserProfile>.CreateNew()
                .With(x => x.User_name = username).Build();
            
            Task<UserProfile> FakeApiCall(string s)
            {
                return Task.FromResult(profile);
            }

            await _userCache.GetOrAddAsync(username, FakeApiCall);
            await _cachedProfileService.GetUserAsync(username);
            _userApiClientMock.Verify(
                x => x.GetUserByAdUserNameAsync(It.Is<string>(u =>
                    u.Equals(username, StringComparison.InvariantCultureIgnoreCase))), Times.Never);
        }

        private UserProfile InitProfile(string username)
        {
           return Builder<UserProfile>.CreateNew()
                .With(x => x.User_name = username).Build();
        }
    }
}
