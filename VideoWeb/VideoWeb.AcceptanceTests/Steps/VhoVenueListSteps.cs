using System.Collections.Generic;
using AcceptanceTests.Common.Driver.Browser;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Test.Helpers;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public class VhoVenueListSteps : ISteps
    {
        private readonly Dictionary<string, UserBrowser> _browsers;
        private readonly TestContext _c;

        public VhoVenueListSteps(Dictionary<string, UserBrowser> browsers, TestContext testContext)
        {
            _browsers = browsers;
            _c = testContext;
        }
        
        public void ProgressToNextPage()
        {
            SelectVenues(_c.Test.Conference.Hearing_venue_name);
            ConfirmVenue();
        }
        
        [When(@"the VHO selects the venue (.*)")]
        [When(@"the VHO selects the venues (.*)")]
        public void SelectVenues(string venues)
        {
            _browsers[_c.CurrentUser.Key].Driver.WaitUntilVisible(VhoVenueAllocationPage.VenuesDropdown).Displayed.Should().BeTrue();
            foreach (var venue in ConverterHelpers.ConvertStringIntoArray(venues))
            {
                _browsers[_c.CurrentUser.Key].ClickCheckbox(VhoVenueAllocationPage.VenueCheckbox(venue));
            }
        }
        
        [When(@"the VHO confirms their allocation selection")]
        public void ConfirmVenue()
        {
            _browsers[_c.CurrentUser.Key].Click(VhoVenueAllocationPage.VenueConfirmButton);
        }

        [When(@"the VHO selects all the venues")]
        public void SelectAllVenuesAndProceed()
        {
            const string venues = "Select All";
            SelectVenues(venues);
            ConfirmVenue();
        }
    }
}
