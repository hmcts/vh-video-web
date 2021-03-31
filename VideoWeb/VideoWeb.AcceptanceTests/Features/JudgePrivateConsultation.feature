Feature: Judge Private Consultation
  As a Judge
  I want to be able to enter a private consultation room with other Judicial Officer Holders
  So that we can discuss judicial matters separate to the main hearing room
  
@VIH-6523 @Video
Scenario: Judge Can Enter The Consultation Room
  Given the Judge user is on the Waiting Room page
  When they enter the private consultation room
  Then they will be transferred to the private consultation room
  And they can leave the private consultation room

@VIH-6524 @Video
Scenario: Panel Member Can Enter The Consultation Room
  Given I have a hearing with a Panel Member
  And the Panel Member user has progressed to the Waiting Room page for the existing hearing
  When they enter the private consultation room
  Then they will be transferred to the private consultation room
  And they can leave the private consultation room

@VIH-6524 @Video
Scenario: Winger Can Enter The Consultation Room
  Given I have a CACD hearing with a Winger
  And the Winger user has progressed to the Waiting Room page for the existing hearing
  When they enter the private consultation room
  Then they will be transferred to the private consultation room
  And they can leave the private consultation room
  
@VIH-6523 @Video
Scenario: Judge Can Mute/Unmute In The Consultation Room
  Given the Judge user has entered the private consultation room
  When they mute their microphone
  Then their microphone will be muted
  And they can unmute their microphone
  And they can leave the private consultation room

@VIH-6523 @Video
Scenario: Judge Can Hide/View Their Self View In The Consultation Room
  Given the Judge user has entered the private consultation room
  When they hide their self view
  Then their self view will be hidden
  And they can view their self view
  And they can leave the private consultation room

@VIH-6524 @Video
Scenario: Panel Member Can Mute/Unmute In The Consultation Room
  Given a Panel Member has entered the private consultation room
  When they mute their microphone
  Then their microphone will be muted
  And they can unmute their microphone
  And they can leave the private consultation room

@VIH-6524 @Video
Scenario: Panel Member Can View/Hide Their Self View In The Consultation Room
  Given a Panel Member has entered the private consultation room
  When they show their self view
  Then their self view will be displayed
  And they can hide their self view
  And they can leave the private consultation room

@VIH-6524 @Video
Scenario: Winger Can Mute/Unmute In The Consultation Room
  Given a Winger has entered the private consultation room
  When they mute their microphone
  Then their microphone will be muted
  And they can unmute their microphone
  And they can leave the private consultation room

@VIH-6524 @Video
Scenario: Winger Can View/Hide Their Self View In The Consultation Room
  Given a Winger has entered the private consultation room
  When they show their self view
  Then their self view will be displayed
  And they can hide their self view
  And they can leave the private consultation room
  
@VIH-6523 @Video
Scenario: Private Consultation Room Remains Open When Others In Room
  Given a Panel Member has entered the private consultation room
  And the Judge user has also entered the private consultation room
  When the Judge user leaves the private consultation
  Then the Panel Member user remains in the private consultation room
  And they can leave the private consultation room

@VIH-6524 @Video
Scenario: Panel Member Transferred To Hearing When Hearing Starts
  Given a Panel Member has entered the private consultation room
  And the Judge user has progressed to the Waiting Room page for the existing hearing
  When the Judge starts the hearing
  Then the Panel Member is transferred to the Hearing Room
  And the Judge can close the hearing

@VIH-6524 @Video
Scenario: Winger Transferred To Hearing When Hearing Starts
  Given a Winger has entered the private consultation room
  And the Judge user has progressed to the Waiting Room page for the existing hearing
  When the Judge starts the hearing
  Then the Winger is transferred to the Hearing Room
  And the Judge can close the hearing

@VIH-6842 @Video
Scenario: Judge Can See Panel Member In Consultation
  Given a Panel Member has entered the private consultation room
  When the Judge user has progressed to the Waiting Room page for the existing hearing
  Then the participant status for Panel Member is displayed as In Consultation
  And the number of people in the consultation room is 1
  And the Panel Member can leave the private consultation room
  
@VIH-6842 @Video
Scenario: Judge Can See Winger In Consultation
  Given a Winger has entered the private consultation room
  When the Judge user has progressed to the Waiting Room page for the existing hearing
  Then the participant status for Winger is displayed as In Consultation
  And the number of people in the consultation room is 1
  And the Winger can leave the private consultation room

@VIH-6842 @Video
Scenario: Panel Member Can See Judge In Consultation
  Given a Panel Member is in the waiting room
  And the Judge user has progressed to the Waiting Room page for the existing hearing
  When they enter the private consultation room
  Then the Panel Member will see the status for Judge is displayed as In Consultation
  And the number of people in the consultation room is 1
  And the Judge can leave the private consultation room

@VIH-6842 @Video
Scenario: Winger Can See Judge In Consultation
  Given a Winger is in the waiting room
  And the Judge user has progressed to the Waiting Room page for the existing hearing
  When they enter the private consultation room
  Then the Winger will see the status for Judge is displayed as In Consultation
  And the number of people in the consultation room is 1
  And the Judge can leave the private consultation room

@VIH-6857 @Video
Scenario: Participant accepts invitation from Judge
  Given the Judge user has entered the private consultation room
  And the Individual user has progressed to the Waiting Room page for the existing hearing
  When the Judge invites the Individual to the private consultation room
  And Individual accepts the private consultation from Judge  
  Then the Individual and the Judge will be in the same private consultation room
  And the Individual and the Judge can both leave the private consultation room
  
