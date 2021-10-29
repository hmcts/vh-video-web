Feature: StaffMember
	As a: Judge, Judicial Office Holder (panel member/winger), Participant
  I want to: See the the Staff Member in the Waiting Room hearing list
  So that: I can know who is in the hearing and what their role is

@Smoketest-Extended
Scenario: Participant waiting room with StaffMember
	Given I have a hearing in 20 minutes time
	And I add a staffmember to the hearing
	When the first Individual user has progressed to the Waiting Room page for the existing hearing
  Then the participant can see the list of staff members

@Smoketest-Extended
Scenario: Judicial Office Holder waiting room with StaffMember
	Given I have a hearing in 20 minutes time with panel member
	And I add a staffmember to the hearing
	When the panel member user has progressed to the Judge Waiting Room page for the existing hearing
  Then the joh can see the list of staff members

#@VIH-8266
@HearingTest @Smoketest-Extended
Scenario: Staff Member starts hearing with Judge in Waiting Room 
  Given I have a hearing with a Judge and I include a Staff Member
	And the first Individual user has progressed to the Waiting Room page for the existing hearing
	And the second Individual user has progressed to the Waiting Room page for the existing hearing
	And the Judge user has progressed to the Judge Waiting Room page for the existing hearing
	And the Staff Member user has progressed to the Staff Member Waiting Room page for the existing hearing
	When the Staff Member starts the hearing
	And the user is on the Countdown page
	And the countdown finishes
	Then the Staff Member can see the participants
	And the first Individual can see the other participants
	And the second Individual can see the other participants
  And in the Judge's browser
  And the user is on the Waiting Room page
  And in the Staff Member's browser
  And the Staff Member closes the hearing
	And the user is on the Waiting Room page
	And the hearing status changed to Closed
	And in the first Individual's browser
	And the participants waiting room displays the closed status

#@VIH-8266
@HearingTest @Smoketest-Extended
Scenario: Staff Member starts hearing with judge not connected
  Given I have a hearing with a Judge and I include a Staff Member
	And the first Individual user has progressed to the Waiting Room page for the existing hearing
	And the second Individual user has progressed to the Waiting Room page for the existing hearing
	And the Staff Member user has progressed to the Staff Member Waiting Room page for the existing hearing
	When the Staff Member starts the hearing
	And the user is on the Countdown page
	And the countdown finishes
	Then the Staff Member can see the participants
	And the first Individual can see the other participants
	And the second Individual can see the other participants
	And the Judge user has progressed to the Judge Waiting Room page for the existing hearing
  And in the Judge's browser
  And the user is on the Waiting Room page
  And in the Staff Member's browser
  And the Staff Member closes the hearing
	And the user is on the Waiting Room page
	And the hearing status changed to Closed
	And in the first Individual's browser
	And the participants waiting room displays the closed status

#@VIH-8266
@HearingTest @Smoketest-Extended
Scenario: Judge starts the hearing with Staff Member in Waiting Room
  Given I have a hearing with a Judge and I include a Staff Member
	And the first Individual user has progressed to the Waiting Room page for the existing hearing
	And the second Individual user has progressed to the Waiting Room page for the existing hearing
	And the Staff Member user has progressed to the Staff Member Waiting Room page for the existing hearing
	And the Judge user has progressed to the Judge Waiting Room page for the existing hearing
	When the Judge starts the hearing
	And the user is on the Countdown page
	And the countdown finishes
	Then the Judge can see the participants
	And the first Individual can see the other participants
	And the second Individual can see the other participants
  And in the Staff Member's browser
  And the user is on the Waiting Room page
  And in the Judge's browser
  And the Judge closes the hearing
	And the user is on the Waiting Room page
	And the hearing status changed to Closed
	And in the first Individual's browser
	And the participants waiting room displays the closed status

#@VIH-8266
@HearingTest @Smoketest-Extended
Scenario: Judge starts hearing with Staff Member not connected
  Given I have a hearing with a Judge and I include a Staff Member
	And the first Individual user has progressed to the Waiting Room page for the existing hearing
	And the second Individual user has progressed to the Waiting Room page for the existing hearing
	And the Judge user has progressed to the Judge Waiting Room page for the existing hearing
	When the Judge starts the hearing
	And the user is on the Countdown page
	And the countdown finishes
	Then the Judge can see the participants
	And the first Individual can see the other participants
	And the second Individual can see the other participants
	And the Staff Member user has progressed to the Staff Member Waiting Room page for the existing hearing
  And in the Staff Member's browser
  And the user is on the Waiting Room page
  And in the Judge's browser
  And the Judge closes the hearing
	And the user is on the Waiting Room page
	And the hearing status changed to Closed
	And in the first Individual's browser
	And the participants waiting room displays the closed status
