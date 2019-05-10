Feature: Video Hearing Officer Alerts
	As a video hearings officer user
	I would like to login and access the hearing details
	So that I can have an administrate the hearings I am involved in

@VIH-4417
Scenario: Video Hearings Officer receieves blocked media alert
	Given the Video Hearings Officer user has progressed to the Admin Panel page
	When a participant has chosen to block user media
	Then the Video Hearings Officer user should see an alert
