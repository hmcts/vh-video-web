using System;
using System.Threading;
using FluentAssertions;
using OpenQA.Selenium;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Users;

namespace VideoWeb.AcceptanceTests.Assertions
{
    public class VideoIsPlaying
    {
        private const int MaxRetries = 5;
        private readonly UserBrowser _browser;

        public VideoIsPlaying(UserBrowser browser)
        {
            _browser = browser;
        }

        public void Feed(By element)
        {
            _browser.Driver.WaitUntilVisible(element);

            var playing = false;

            for (var i = 1; i <= MaxRetries; i++)
            {
                var currentTime = Convert.ToDouble(_browser.Driver.WaitUntilVisible(element)
                    .GetAttribute("currentTime"));
                if (currentTime > 0)
                {
                    playing = true;
                    break;
                }

                Thread.Sleep(TimeSpan.FromSeconds(1));
            }

            playing.Should().BeTrue("video is playing");
        }
    }
}
