using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Helpers;

namespace VideoWeb.UnitTests
{
    public class AppVersionTests
    {
        [Test]
        public void should_get_same_instance_of_app_versiin()
        {
            var instance1 = AppVersion.Instance();
            var instance2 = AppVersion.Instance();

            instance1.Should().Be(instance2);
        }
    }
}
