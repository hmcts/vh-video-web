using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Security.HashGen;
using VideoWeb.Mappings;

namespace VideoWeb.UnitTests.Mappings
{
    public class SupplierConfigurationResponseMapperTests
    {
        [Test]
        public void Should_map()
        {
            // Arrange
            var config = new VodafoneConfiguration
            {
                JoinByPhoneFromDate = "2021-01-01",
                TurnServer = "TurnServer",
                TurnServerUser = "TurnServerUser",
                TurnServerCredential = "TurnServerCredential"
            };

            // Act
            var result = config.Map();
            
            // Assert
            result.JoinByPhoneFromDate.Should().Be(config.JoinByPhoneFromDate);
            result.TurnServer.Should().Be(config.TurnServer);
            result.TurnServerUser.Should().Be(config.TurnServerUser);
            result.TurnServerCredential.Should().Be(config.TurnServerCredential);
            result.Supplier.Should().Be(config.Supplier);
        }
    }
}
