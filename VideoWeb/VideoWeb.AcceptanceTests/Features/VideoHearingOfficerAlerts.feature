Feature: Video Hearing Officer Alerts
	As a video hearings officer user
	I would like to login and access the hearing details
	So that I can have an administrate the hearings I am involved in

@VIH-4417
Scenario: Video Hearings Officer receieves blocked media alert
	Given the Video Hearings Officer user has progressed to the Admin Panel page
	When a participant has chosen to block user media
	Then the Video Hearings Officer user should see a blocked user media alert
	When the user selects the alert
	Then the checkbox is no longer enabled
	And the alert should be updated with the details of the user that actioned the alert

@VIH-4419
Scenario: Video Hearings Officer receieves suspended alert
	Given the Video Hearings Officer user has progressed to the Admin Panel page
	When the judge has disconnected from the hearing
	Then the Video Hearings Officer user should see a Suspended alert
	When the user selects the alert
	Then the checkbox is no longer enabled
	And the alert should be updated with the details of the user that actioned the alert

@VIH-1630
Scenario: Video Hearings Officer receieves disconnected alert
	Given the Video Hearings Officer user has progressed to the Admin Panel page
	When a participant has disconnected from the hearing
	Then the Video Hearings Officer user should see a Disconnected alert
	When the user selects the alert
	Then the checkbox is no longer enabled
	And the alert should be updated with the details of the user that actioned the alert

@VIH-1630
Scenario: Video Hearings Officer receieves failed self test alert
	Given the Video Hearings Officer user has progressed to the Admin Panel page
	When a participant has failed the self-test
	Then the Video Hearings Officer user should see a failed self test alert
	When the user selects the alert
	Then the checkbox is no longer enabled
	And the alert should be updated with the details of the user that actioned the alert