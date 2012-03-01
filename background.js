chrome.browserAction.setBadgeText({text: "DrT"});

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
	chrome.tabs.reload();
    chrome.tabs.executeScript(null, { file: "update.js" } );
});
