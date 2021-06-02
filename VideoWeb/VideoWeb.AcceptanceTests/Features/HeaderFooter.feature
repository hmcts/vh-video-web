Feature: Header and Footer
	In order to access common external pages across all pages
	As a registered user
	I want to be able to see and access external pages from the header and footer

@VIH-4090
Scenario: Judge beta banner
	Given the Judge user has progressed to the Judge Hearing List page
	Then the banner should not be displayed

@VIH-4090
Scenario: Participant beta banner
	Given the Participant user has progressed to the Hearing List page
	Then the banner should be displayed
	When the user clicks the feedback link
	And switches to the feedback tab
	Then the user is on the Feedback page 

@VIH-4701
Scenario: Judge privacy policy page
	Given the Judge user has progressed to the Judge Hearing List page
	When the user clicks the Privacy policy link
	And switches to the privacy tab
	Then the user is on the Privacy Policy page 

@VIH-4701
Scenario: Participant privacy page
	Given the Participant user has progressed to the Hearing List page
	When the user clicks the Privacy policy link
	And switches to the privacy tab
	Then the user is on the Privacy Policy page 

@VIH-5023
Scenario: Judge accessibility statement
	Given the Judge user has progressed to the Judge Hearing List page
	When the user clicks the Accessibility link
	Then the user is on the Accessibility page 

@VIH-5023	 @Smoketest-Extended
Scenario: Participant accessibility statement
	Given the Participant user has progressed to the Hearing List page
	When the user clicks the Accessibility link
	Then the user is on the Accessibility page 

@VIH-4090
Scenario: Judge open government licence
	Given the Judge user has progressed to the Judge Hearing List page
	When the user clicks the Open Government Licence link
	Then the user is on the Open Government Licence page 

@VIH-4090	
Scenario: Participant open government licence
	Given the Participant user has progressed to the Hearing List page
	When the user clicks the Open Government Licence link
	Then the user is on the Open Government Licence page 
