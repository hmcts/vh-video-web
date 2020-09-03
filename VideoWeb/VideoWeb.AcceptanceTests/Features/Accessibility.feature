Feature: Accessibility
	In order to ensure video web is accessible to all users
	As a service
	I want to check each page for potential accessibility issues

@Accessibility @NotEdge @NotEdgeChromium @NotFirefox @NotIE @NotSafari
Scenario Outline: Hearing List page accessibility
	Given the <Role> user has progressed to the Hearing List page
	Then the page should be accessible
	Examples: 
	| Role        |
	| Judge       |
	| Participant |

@Accessibility @NotEdge @NotEdgeChromium @NotFirefox @NotIE @NotSafari
Scenario: Introduction page accessibility
	Given the Participant user has progressed to the Introduction page
	Then the page should be accessible 

@Accessibility @NotEdge @NotEdgeChromium @NotFirefox @NotIE @NotSafari
Scenario: Equipment Check page accessibility
	Given the Participant user has progressed to the Equipment Check page
	Then the page should be accessible 

@Accessibility @NotEdge @NotEdgeChromium @NotFirefox @NotIE @NotSafari
Scenario: Switch on your camera and microphone page accessibility
	Given the Participant user has progressed to the Switch on your camera and microphone page
	Then the page should be accessible 

@Accessibility @NotEdge @NotEdgeChromium @NotFirefox @NotIE @NotSafari
Scenario Outline: Practice video hearing page accessibility
	Given the <Role> user has progressed to the Practice video hearing page
  And the practice video hearing video has started
	Then the page should be accessible 
	Examples: 
	| Role                     |
	| Judge Self Test          |
	| Representative Self Test |
	| Individual               |

@Accessibility @NotEdge @NotEdgeChromium @NotFirefox @NotIE @NotSafari
Scenario: Camera Working page accessibility
	Given the Participant user has progressed to the Camera Working page
	Then the page should be accessible 

@Accessibility @NotEdge @NotEdgeChromium @NotFirefox @NotIE @NotSafari
Scenario: Microphone Working page accessibility
	Given the Participant user has progressed to the Microphone Working page
	Then the page should be accessible 

@Accessibility @NotEdge @NotEdgeChromium @NotFirefox @NotIE @NotSafari
Scenario: See and Hear Video page accessibility
	Given the Participant user has progressed to the See and Hear Video page
	Then the page should be accessible 

@Accessibility @NotEdge @NotEdgeChromium @NotFirefox @NotIE @NotSafari
Scenario: Rules page accessibility
	Given the Participant user has progressed to the Rules page
	Then the page should be accessible 

@Accessibility @NotEdge @NotEdgeChromium @NotFirefox @NotIE @NotSafari
Scenario: Declaration page accessibility
	Given the Participant user has progressed to the Declaration page
	Then the page should be accessible 

@Accessibility @NotEdge @NotEdgeChromium @NotFirefox @NotIE @NotSafari
Scenario Outline: Waiting Room page accessibility
    Given the <Role> user has progressed to the Waiting Room page
    When the waiting room page has loaded for the <Role>
    Then the page should be accessible 
    Examples: 
    | Role        |
    | Judge       |
    | Participant |

@Accessibility @NotEdge @NotEdgeChromium @NotFirefox @NotIE @NotSafari
Scenario: Help page accessibility
	Given the Participant user has progressed to the Microphone Working page
	When the user selects the No radiobutton
	And the user clicks the Continue button
	Then the user is on the Help page
	And the page should be accessible 

@Accessibility @HearingTest @NotEdge @NotEdgeChromium @NotFirefox @NotIE @NotSafari
Scenario: Hearing Room page accessibility
	Given the the first Individual user has progressed to the Waiting Room page
	And the Judge user has progressed to the Waiting Room page for the existing hearing
	Then the participant status for the first Individual's is displayed as Connected
	When the Judge starts the hearing
  And the countdown finishes
	Then the page should be accessible apart from a missing header
	When in the first Individual's browser
	Then the page should be accessible apart from a missing header
  When in the Judge's browser
  And the Judge clicks close
	Then the user is on the Hearing List page

# Ignoring this test until we can upgrade to Angular 9. See VIH-6032 for more details
@Ignore @Accessibility @NotEdge @NotEdgeChromium @NotFirefox @NotIE @NotSafari
Scenario: Venue List page accessibility
	Given the Video Hearings Officer user has progressed to the VHO Venue List page
	Then the page should be accessible 

@Accessibility @NotEdge @NotEdgeChromium @NotFirefox @NotIE @NotSafari
Scenario: VHO Command Centre Hearing Tab page accessibility
	Given the Video Hearings Officer user has progressed to the VHO Hearing List page
  And the VHO selects the Hearings tab
	Then the page should be accessible 

@Accessibility @NotEdge @NotEdgeChromium @NotFirefox @NotIE @NotSafari
Scenario: VHO Command Centre Messages Tab page accessibility
	Given the Video Hearings Officer user has progressed to the VHO Hearing List page
  And the VHO selects the Messages tab
	Then the page should be accessible 
