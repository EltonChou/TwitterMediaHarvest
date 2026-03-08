Feature: Extension loads in Chrome

  Scenario: Service worker registers successfully
    Given the Chrome extension is loaded
    Then the extension ID should be a valid Chrome extension identifier

  Scenario: Popup loads without JavaScript errors
    Given the Chrome extension is loaded
    When I open the extension popup
    Then there should be no JavaScript errors on the page
    And the React root element should be present
