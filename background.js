chrome.browserAction.setBadgeText({text: "DrT"});

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
	// chrome.tabs.reload();
	chrome.tabs.create({'url': 'http://www.moneyweek.com/shop/premium-services/research-investments/research-investments-portfolio' }, function(tab) {
		  // Tab opened.
	});
    chrome.tabs.executeScript(null, { file: "update.js" } );
});