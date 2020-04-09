using System;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Security.HashGen;

namespace VideoWeb.UnitTests
{
    public class HashGeneratorTests
    {
        private KinlyConfiguration _kinlyConfiguration;

        [SetUp]
        public void SetUp()
        {
            _kinlyConfiguration = new KinlyConfiguration
            {
                CallbackSecret = "W2gEmBn2H7b2FCMIQl6l9rggbJU1qR7luIeAf1uuaY+ik6TP5rN0NEsPVg0TGkroiel0SoCQT7w3cbk7hFrBtA=="
            };
        }

        [Test]
        public void Should_encrypt()
        {
            var hashGenerator = new HashGenerator(_kinlyConfiguration);
            var id = Guid.NewGuid().ToString();
            var computedHash = hashGenerator.GenerateHash(GetExpiryOn(), id);
            computedHash.Should().NotBeNullOrEmpty();
        }

        [Test]
        public void Should_fail_authentication()
        {
            var hashGenerator = new HashGenerator(_kinlyConfiguration);
            var id = Guid.NewGuid().ToString();
            var computedHash = hashGenerator.GenerateHash(GetExpiryOn(), id);

            var id2 = Guid.NewGuid().ToString();
            var reComputedHash = hashGenerator.GenerateHash(GetExpiryOn(), id2);
            reComputedHash.Should().NotBe(computedHash);
        }

        private static string GetExpiryOn()
        {
            return DateTime.UtcNow.AddMinutes(20).ToUniversalTime().ToString("dd.MM.yyyy-H:mmZ");
        }
    }
}
