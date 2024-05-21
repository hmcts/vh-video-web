using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Security;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Common
{
    public class CustomClaimsTransformationTests
    {
        private CustomClaimsTransformation _customClaimsTransformation;
        
        [SetUp]
        public void Setup()
        {
            _customClaimsTransformation = new CustomClaimsTransformation();
        }
        
        [TestCase("name", ClaimTypes.Name, "John Doe")]
        public async Task Should_transform_claims(string oldName, string newName, string value)
        {
            // Arrange
            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            var identity = (ClaimsIdentity)claimsPrincipal.Identity;
            var existingClaims = identity.Claims.ToList();
            foreach (var claim in existingClaims)
            {
                identity.RemoveClaim(claim);
            }
            identity.AddClaim(new Claim(oldName, value));
            
            // Act
            var transformedPrincipal = await _customClaimsTransformation.TransformAsync(claimsPrincipal);
            
            // Assert
            var transformedClaim = transformedPrincipal.Claims.FirstOrDefault(c => c.Type == newName);
            transformedClaim.Should().NotBeNull();
            transformedClaim.Value.Should().Be(value);
            var oldClaim = transformedPrincipal.Claims.FirstOrDefault(c => c.Type == oldName);
            oldClaim.Should().BeNull();
        }
    }
}
