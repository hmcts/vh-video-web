using System.Collections.Generic;
using System.Linq;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Test.Helpers;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.Services.TestApi;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public class VenueListSteps : ISteps
    {
        private readonly Dictionary<User, UserBrowser> _browsers;
        private readonly TestContext _c;

        public VenueListSteps(Dictionary<User, UserBrowser> browsers, TestContext testContext)
        {
            _browsers = browsers;
            _c = testContext;
        }
        
        public void ProgressToNextPage()
        {
            SelectVenues(_c.Test.Conference.Participants.First(x => x.User_role == UserRole.Judge).First_name);
            ConfirmVenue();
        }
        
        [When(@"the VHO selects the courtroom (.*)")]
        [When(@"the VHO selects the courtrooms (.*)")]
        [When(@"the VHO selects the hearings for a Judge named (.*)")]
        [When(@"the VHO selects the hearings for Judges named (.*)")]
        public void SelectVenues(string judgeNames)
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(VhoVenueAllocationPage.VenuesDropdown).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Click(VhoVenueAllocationPage.VenuesTextBox);

            foreach (var venue in ConverterHelpers.ConvertStringIntoArray(judgeNames))
            {
                _browsers[_c.CurrentUser].Driver.WaitUntilVisible(VhoVenueAllocationPage.VenuesTextBox).SendKeys(venue);
                _browsers[_c.CurrentUser].ClickCheckbox(VhoVenueAllocationPage.VenueCheckbox(venue));
            }
        }

        [When(@"the VHO confirms their allocation selection")]
        public void ConfirmVenue()
        {
            _browsers[_c.CurrentUser].Click(VhoVenueAllocationPage.VenueConfirmButton);
        }

        [When(@"the VHO selects all the venues")]
        public void SelectAllVenuesAndProceed()
        {
            var venues = _c.Test.Users.Where(user => user.User_type == UserType.Judge).Aggregate("", (current, user) => current + user.First_name + ",");
            SelectVenues(venues);
            ConfirmVenue();
        }
    }
}
