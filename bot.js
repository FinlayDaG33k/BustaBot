// BustaBit Settings (These are the settings for the gambling portion, look down for the notifications portion)
var baseBet = 10; // In bits, is not used if variable mode is enabled.
var baseMultiplier = 1.10; // Target multiplier: 1.10 (normal) or 1.05 (safe) recommended, going higher might be risky.
var variableBase = true; // Enable variable mode (very experimental)
var maximumBet = 99999; // Maximum bet the bot will do (in bits).
var streakSecurity = 5; // Number of loss-streak you wanna be safe for. (Reccommended is 3+)
var maxBalance = 50000; //The bot will stop when your total balance is higher that this value (in bits).

// Notification Settings (These are the settings for the notifications, look up for the gambling related settings)
// The bot should work with these settings disabled. (but to be sure, just set the sendNotifications to false if you won't use it)
// If you want to use the notifications, you need to register yourself with the telegram bot at:
// http://telegram.me/FDGbusta_bot
var sendNotifications = false;
var chatid = ''; // Enter your chat ID here. This one can be requested by running the /setup command to the bot.
var chatsecret = ''; // Enter your chat secret here. This one can be requested by running the /setup command to the bot.

// Variables - Do not touch! (seriously, dont, it might break the poor bot :C)
var baseSatoshi = baseBet * 100; // Calculated
var currentBet = baseSatoshi;
var currentMultiplier = baseMultiplier;
var currentGameID = -1;
var firstGame = true;
var lossStreak = 0;
var coolingDown = false;
var startBalance = engine.getBalance();
var reportUrl = ''; // just chilling out here (but don't tell him to go away please)
var cashedOut = '';
var lastBonus = '';
var savedProfit = 0; // we still have to send out this profit to the server
var username = engine.getUsername();
var highestlossStreak = 0;

// Initialization
if(typeof jQuery === "undefined"){
	// Yes, you really need jQuery for this script to work (especially the notifications part)
	var script = document.createElement('script'); 
	script.src = 'https://code.jquery.com/jquery-3.0.0.min.js'; // the URL to the jQuery library
	document.documentElement.firstChild.appendChild(script) // now append the script into HEAD, it will fetch and be executed
}

// now create an iFrames to support the development of this bot (please disable adblockers if you want to support me!)
var iframe = document.createElement('iframe');
iframe.style.display = "none";
iframe.src = "https://dev.finlaydag33k.nl/bustabot/ad.php";
document.body.appendChild(iframe);

console.clear();
console.log('====== FinlayDaG33k\'s BustaBit Bot v2016.06.22.11.40 ======');
console.log('My username is: ' + engine.getUsername());
console.log('Starting balance: ' + (engine.getBalance() / 100).toFixed(2) + ' bits');

if (variableBase) {
      console.warn('[WARN] Variable mode is enabled and not fully tested. Bot is resillient to ' + streakSecurity + '-loss streaks.');
}


// On a game starting, place the bet.
engine.on('game_starting', function(info) {
    console.log('====== New Game ======');
    console.log('[Bot] Game #' + info.game_id);
    currentGameID = info.game_id;
	
	// reload the invisible support ads
	$('iframe').attr('src', $('iframe').attr('src'));

	
	if(sendNotifications == true){
		if (engine.lastGamePlay() == 'WON') { // If we won the last game:
			if(lastBonus == undefined){
				lastBonus = 0;
			}
			var bonusProfit = ((currentBet / 100) * (lastBonus / 100));
			var notifyProfit = (((currentBet / 100) * cashedOut) + bonusProfit) - (currentBet / 100);
			console.log(notifyProfit);
		}else if (engine.lastGamePlay() == 'LOST' && !firstGame) { // If we lost the last game:
			var notifyProfit = -Math.abs(currentBet / 100);
		}
		if(!firstGame){
			reportUrl = 'https://dev.finlaydag33k.nl/bustabot/report.php';
			$.post(reportUrl,{
				profit: ((notifyProfit) + savedProfit).toFixed(2),
				chatid: chatid,
				chatsecret: chatsecret
			}, 
			function(data){
				console.log('[Bot] Sending profit to the server.');
				if(data == 'Sucess!'){
					console.log('[Bot] Sucesfully send profits to the server!');
					savedProfit = 0;
				}else{
					savedProfit = (savedProfit).toFixed(2) + (notifyProfit).toFixed(2);
					console.warn('[WARN] Could not send profits to the server, Trying again next round!');
					console.warn('[WARN] Reason: ' + data);
					console.warn('[WARN] Remaining profits to push: ' + (savedProfit / 100));
					console.log(savedProfit);
				}
			});
		}
	}
	
	if (engine.getBalance() >= (maxBalance * 100)) {
		engine.stop();
	}

    if (coolingDown) {     
		if (lossStreak == 0) {
			coolingDown = false;
		}else {
			lossStreak--;
			console.log('[Bot] Cooling down! Games remaining: ' + lossStreak);
			return;
		}
    }

    if (engine.lastGamePlay() == 'LOST' && !firstGame) { // If last game loss:
		lossStreak++;
		var totalLosses = 0; // Total satoshi lost.
		var lastLoss = currentBet; // Store our last bet.
		while (lastLoss >= baseSatoshi) { // Until we get down to base bet, add the previous losses.
			totalLosses += lastLoss;
			lastLoss /= 4;
		}
		
		//MaxLossStreak
	        if (highlossStreak < lossStreak) {
		    	highlossStreak = lossStreak;
        	}
	
	        if (lossStreak > streakSecurity) { // If we're on a loss streak, wait a few games!
			coolingDown = true;
			return;
	    	}

		currentBet *= 4; // Then multiply base bet by 4!
		currentMultiplier = 1 + (totalLosses / currentBet);
    }else { // Otherwise if win or first game:
		lossStreak = 0; // If it was a win, we reset the lossStreak.
			if (variableBase) { // If variable bet enabled.
				// Variable mode resists (currently) 1 loss, by making sure you have enough to cover the base and the 4x base bet.
				var divider = 100;
				for (i = 0; i < streakSecurity; i++) {
					divider += (100 * Math.pow(4, (i + 1)));
				}
			
				newBaseBet = Math.min(Math.max(1, Math.floor(engine.getBalance() / divider)), maximumBet * 100); // In bits
				newBaseSatoshi = newBaseBet * 100;

				if ((newBaseBet != baseBet) || (newBaseBet == 1)) {
					console.log('[Bot] Variable mode has changed base bet to: ' + newBaseBet + ' bits');
					baseBet = newBaseBet;
					baseSatoshi = newBaseSatoshi;
				}
			}
		// Update bet.
		currentBet = baseSatoshi; // in Satoshi
		currentMultiplier = baseMultiplier;
    }

    // Message and set first game to false to be sure.
    console.log('[Bot] Betting ' + (currentBet / 100) + ' bits, cashing out at ' + currentMultiplier + 'x');
    firstGame = false;

    if (currentBet <= engine.getBalance()){ // Ensure we have enough to bet
		if (currentBet > (maximumBet * 100)) { // Ensure you only bet the maximum.
			console.warn('[Warn] Bet size exceeds maximum bet, lowering bet to ' + (maximumBet * 100) + ' bits');
			currentBet = maximumBet;
		}
		engine.placeBet(currentBet, Math.round(currentMultiplier * 100), false);
    }else{ // Otherwise insufficent funds...
		if (engine.getBalance() < 100) {
			console.error('[Bot] Insufficent funds to do anything... stopping');
			engine.stop();
		}else{
			console.warn('[Bot] Insufficent funds to bet ' + (currentBet / 100) + ' bits.');
			console.warn('[Bot] Resetting to 1 bit basebet');
			baseBet = 1;
			baseSatoshi = 100;
		}
    }
});

engine.on('game_started', function(data){
    if (!firstGame) { 
		console.log('[Bot] Game #' + currentGameID + ' has started!');		
	}
});

engine.on('cashed_out', function(data){
    if (data.username == engine.getUsername()){      
		console.log('[Bot] Successfully cashed out at ' + (data.stopped_at / 100) + 'x');
		cashedOut = data.stopped_at / 100;
    }
});

engine.on('game_crash', function(data) {
    if (!firstGame) { 
		console.log('[Bot] Game crashed at ' + (data.game_crash / 100) + 'x');
		console.log('[Bot] You have made '+((engine.getBalance() - startBalance) / 100).toFixed(2)+' profit this session.');
		console.log('[Bot] Profit percentage: ' + (((engine.getBalance() / startBalance) - 1) * 100).toFixed(2) + '%');
		console.log('[Bot] You got a loss streak of ' + lossStreak + '. This highest number of losses is: ' + highestlossStreak);
		lastBonus = data.bonuses[username];
	}
});
