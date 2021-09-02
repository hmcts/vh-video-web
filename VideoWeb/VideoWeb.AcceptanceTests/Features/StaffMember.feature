Feature: StaffMember
	As a: Judge, Judicial Office Holder (panel member/winger), Participant
  I want to: See the the Staff Member in the Waiting Room hearing list
  So that: I can know who is in the hearing and what their role is

Background:
	#Given I have a hearing in 20 minutes time with staffmember

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

@Smoketest-Extended
Scenario: Judge waiting room with StaffMember
	Given I have a hearing in 20 minutes time with judge
	And I add a staffmember to the hearing
	When the judge user has progressed to the Judge Waiting Room page for the existing hearing
  Then the judge can see the list of staff members
