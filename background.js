chrome.runtime.onInstalled.addEventListener( ()=> {
    chrome.storage.sync.get( ["geminiApiKey"], (result)=>{
        if(!result.geminiApiKey) {
            chrome.tabs.open
        }
    })
})