@VIH-4350
Feature: Error Pages
	As a registered video hearings user
	I would expect information error messages when things go wrong
	So that I know how to resolve the issue

Scenario: Page not found error
	Given a new browser is open for a Participant
	When they attempt to login with valid credentials
	Then the user is on the Hearing List page
	When the user attempts to navigate to a nonexistent page
	Then the user is on the Not Found page
	And the Not Found error page displays text of how to rectify the problem
	And contact us details are available

@VIH-5235
Scenario: Unauthorised error page
	Given a new browser is open for a Case admin
	When they attempt to login with valid credentials
	Then the user is on the Unauthorised page
	And the Unauthorised error page displays text of how to rectify the problem

@VIH-4677 @VIH-5219 @UnsupportedBrowser
Scenario: Unsupported browser error page
	Given a new browser is open for a Participant
	When the user attempts to access the page on their unsupported browser
	Then the user is on the Unsupported Browser error page with text of how to rectify the problem

@VIH-4617 @UnsupportedDeviceMobile @MobileOnly 
Scenario: Unsupported device error page - Mobile
	Given a new browser is open for a Participant
	When the user attempts to access the page on their unsupported device
  Then the user is on the Unsupported Device error page with text of how to rectify the problem

@VIH-4617 @UnsupportedDeviceTablet @TabletOnly @NotIOS 
Scenario: Unsupported device error page - Tablet
	Given a new browser is open for a Participant
	When the user attempts to access the page on their unsupported device
  Then the user is on the Unsupported Device error page with text of how to rectify the problem
