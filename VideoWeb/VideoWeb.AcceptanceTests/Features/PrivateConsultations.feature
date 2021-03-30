Feature: Private Consultations
  As a Hearing Participant
  I need to join private consultations
  So that I can participate in discussions relevant to my case

@VIH-6988 @Video @Smoketest-Extended
Scenario: Accept a private consultation invite
  Given an individual and their representative are in the waiting room 10 minutes before a hearing
  When the individual starts a private consultation with their representative
  And the representative accepts the private consultation invite from the individual
  Then the individual and their representative will be in the same private consultation room
  And the individual and their representative can both leave the private consultation room

Scenario: Interpreter private consultation invite
  Given an first individual and their interpreter are in the waiting room 10 minutes before a hearing
  And the representative user has progressed to the Waiting Room page for the existing hearing
  When the representative starts a private consultation with their interpreter  
  And the first individual accepts the private consultation invite from the representative
  And the interpreter accepts the private consultation invite from the representative
  Then the first individual and their interpreter will be in the same private consultation room
  And the first individual and their representative can both leave the private consultation room
      
@VIH-6988
Scenario: Decline a private consultation invite
  Given an individual and their representative are in the waiting room 10 minutes before a hearing
  When the individual starts a private consultation with their representative
  And the representative declines the private consultation invite from the individual
  Then the individual will see their representative declined the invitation
  And the individual can leave the private consultation room
  
@VIH-6988
Scenario: Unable to start private consultation without other participants
  Given an individual user has progressed to the Waiting Room page with a hearing in 10 minutes time
  When they attempt to start a private consultation with no other participants
  Then the continue button will be disabled
  And no other participants can be invited to join a private consultation
  
@VIH-6988
Scenario: Accept an invite whilst in another room
  Given the first individual and the first representative are in a private consultation room
  And the second individual user has progressed to the Waiting Room page for the existing hearing
  When the second individual starts a private consultation with the first individual
  And the first individual accepts the private consultation invite from the second individual
  Then the first individual and the second individual will be in the same private consultation room
  And the first individual and the first representative will not be in the same private consultation room
  And the first individual and the second individual can both leave the private consultation room
  And the first representative can leave the private consultation room

@VIH-6988
Scenario: Decline an invite whilst in another room
  Given the first individual and the first representative are in a private consultation room
  And the second individual user has progressed to the Waiting Room page for the existing hearing
  When the second individual starts a private consultation with the first individual
  And the first individual declines the private consultation invite from the second individual
  Then the first individual and the second individual will not be in the same private consultation room
  And the first individual and the first representative will be in the same private consultation room
  And the first individual and the second individual can both leave the private consultation room
  And the first representative can leave the private consultation room
  
@VIH-6521
Scenario: Participant can join an unlocked private consultation
  Given the first individual and the first representative are in a private consultation room
  And the second individual user has progressed to the Waiting Room page for the existing hearing
  When the second individual joins the meeting room containing the first individual
  Then the first individual and the second individual will be in the same private consultation room
  And the first individual and the second individual can both leave the private consultation room
  And the first representative can leave the private consultation room

@VIH-6521
Scenario: Participant unable to join a locked private consultation
  Given the first individual and the first representative are in a locked private consultation room
  When the second individual user has progressed to the Waiting Room page for the existing hearing
  Then the second individual will not be able to join the meeting room containing the first individual
  And the first individual and the first representative can both leave the private consultation room
