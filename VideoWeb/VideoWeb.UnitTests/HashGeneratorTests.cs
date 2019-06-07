using System;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Security.HashGen;

namespace VideoWeb.UnitTests
{
    public class HashGeneratorTests
    {
        private CustomTokenSettings _customTokenSettings;

        [SetUp]
        public void SetUp()
        {
            _customTokenSettings = new CustomTokenSettings
            {
                Secret = "W2gEmBn2H7b2FCMIQl6l9rggbJU1qR7luIeAf1uuaY+ik6TP5rN0NEsPVg0TGkroiel0SoCQT7w3cbk7hFrBtA=="
            };
        }

        [Test]
        public void should_encrypt()
        {
            var hashGenerator = new HashGenerator(_customTokenSettings);
            var id = Guid.NewGuid().ToString("N");
            var computedHash = hashGenerator.GenerateHash(DateTime.UtcNow.AddMinutes(20), id);
            computedHash.Should().NotBeNullOrEmpty();
        }

        [Test]
        public void should_fail_authentication()
        {
            var hashGenerator = new HashGenerator(_customTokenSettings);
            var id = Guid.NewGuid().ToString("N");
            var computedHash = hashGenerator.GenerateHash(DateTime.UtcNow.AddMinutes(20), id);

            var id2 = Guid.NewGuid().ToString("N");
            var reComputedHash = hashGenerator.GenerateHash(DateTime.UtcNow.AddMinutes(-20), id2);
            reComputedHash.Should().NotBe(computedHash);
        }
    }
}