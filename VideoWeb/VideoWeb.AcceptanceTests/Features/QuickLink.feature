@ChromeOnly @WindowsOnly @ignore

#
#  This test cannot check the clipboard contents after a paste, an alternative will be looked at pasting elsewhere
#  You can't access the testing device clipboard using .netcore 3, and the other option of accessing via the browser does not work in automation
#  Maybe find a way to paste elsewhere & check pasted value?
#

Feature: QuickLink
	Click on a Quicklink

Scenario: VHO Copies a Hearing Link to Clipboard
	Given the Video Hearings Officer user has progressed to the VHO Hearing List page
  When the Video Hearings Officer clicks <copylink>
  #Then the <copylink> is in the clipboard
  Examples:
  | copylink          |
  | Hearing ID        |
  | QuickLink Details |
  | Phone Details     |
