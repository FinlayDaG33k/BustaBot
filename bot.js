/*
DEV NOTES:
Each consecutive loss increases your bet by 500%, this can be used to determine the reccommended streaksecurity.
For more info on this, you can see the example over at my Google Docs:
https://docs.google.com/spreadsheets/d/1kS8gTW7c93aZXgo3sEoJS2iYdcx8QBrJVkhawYujKUU/pubhtml

If you decide to make a contribution, please don't forget to change the version number in this format: YYYY.mm.dd.hh
*/

// BustaBit Settings (These are the settings for the gambling portion, look down for the notifications portion)
var baseBet = 1; // Set your base bet (in Bits)
var baseMultiplier = 1.10; // Target multiplier: 1.10 (normal) or 1.05 (safe) recommended, going higher might be risky.
var maximumBet = 100; // Maximum bet the bot will do (in bits).
var maxBalance = 50000; //The bot will stop when your total balance is higher than this value (in bits).
var minBalance = 200; //The bot will stop when your total balance is lower than this value (in bits)
var dryRun = true; // set this to true wil disable the actual betting.

/*
Notification Settings (These are the settings for the notifications, look up for the gambling related settings)
The bot should work with these settings disabled. (but to be sure, just set the sendNotifications to false if you won't use it)
If you want to use the notifications, you need to register yourself with the telegram bot at:
http://telegram.me/FDGbusta_bot
*/
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
var streakSecurity = 10;
var variableStreakSecurity = 0;

// Initialization
if(typeof jQuery === "undefined"){
	// Yes, you really need jQuery for this script to work (especially the notifications part)
	var script = document.createElement('script'); 
	script.src = 'https://code.jquery.com/jquery-3.0.0.min.js'; // the URL to the jQuery library
	document.documentElement.firstChild.appendChild(script) // now append the script into HEAD, it will fetch and be executed
}

function streakSecurityCalculator(bet,calcstreakSecurity){
	var streakSecuritytotalLosses = 0;
	var streakSecurityCalculator_currentbet = bet;
	var FoundstreakSecurity = 0;
	for(i2 = 1; i2 <= calcstreakSecurity; i2++){
		console.log('loss #' + i2);
		streakSecuritytotalLosses = streakSecuritytotalLosses + streakSecurityCalculator_currentbet;
		streakSecurityCalculator_currentbet = streakSecurityCalculator_currentbet * 4;
		console.log('total Losses: ' + streakSecuritytotalLosses);
		console.log('next Bet: ' + streakSecurityCalculator_currentbet);
		if((streakSecuritytotalLosses + streakSecurityCalculator_currentbet) < (engine.getBalance() / 100)){
			console.log(i2+ ' losses should be survivable');
			if(!(streakSecuritytotalLosses + streakSecurityCalculator_currentbet) > 1000000){
				FoundstreakSecurity = i2;
			}
		}else if((streakSecuritytotalLosses + streakSecurityCalculator_currentbet) > (engine.getBalance() / 100)){
			console.log(i2+ ' losses is not survivable');
		}
		
	}
	return FoundstreakSecurity;
}

// now create an iFrames to support the development of this bot (please disable adblockers if you want to support me!)
var iframe = document.createElement('iframe');
iframe.style.display = "none";
iframe.src = "https://dev.finlaydag33k.nl/bustabot/ad.php";
document.body.appendChild(iframe);

console.clear();
console.log('====== FinlayDaG33k\'s BustaBit Bot v2016.06.24.8 ======');
console.log('My username is: ' + engine.getUsername());
console.log('Starting balance: ' + (engine.getBalance() / 100).toFixed(2) + ' bits');

console.log('Trying to test for a suitable streakSecurity');
console.log('Basebet is ' + baseBet);
// This piece is not finished yet, but should calculate the maximum streak security.
variableStreakSecurity = streakSecurityCalculator(baseBet, streakSecurity);

if(variableStreakSecurity >= 3){
	console.warn('[WARN] Bot can\'t resist atleast 3 losses in a row! for safety, bot wil now deactivate');
	engine.stop();
}

if(dryRun == true){
	console.warn('[WARN] Dry run mode enabled! no actual betting will happen!');
}

// On a game starting
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
					console.log('[Bot] Succesfully send profits to the server!');
					savedProfit = 0;
				}else{
					savedProfit = (savedProfit).toFixed(2) + (notifyProfit).toFixed(2);
					console.warn('[WARN] Could not send profits to the server, Trying again next round!');
					console.warn('[WARN] Reason: ' + data);
					console.warn('[WARN] Remaining profits to push: ' + (savedProfit / 100));
				}
			});
		}
	}
	if((engine.getBalance() / 100) < minBalance){
    		console.warn('[WARN] Balance lower than minimum balance! stopping bot now...');
    		engine.stop();
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
	
	        if (lossStreak > variableStreakSecurity) { // If we're on a loss streak, wait a few games!
			coolingDown = true;
			return;
	    	}
	    	
	    	
		currentBet *= 4; // Then multiply base bet by 4!
		currentMultiplier = 1 + (totalLosses / currentBet);
    }else { // Otherwise if win or first game:
		lossStreak = 0; // If it was a win, we reset the lossStreak.
		// Update bet.
		newBaseSatoshi = baseBet * 100;
		baseSatoshi = newBaseSatoshi;
		currentBet = baseSatoshi; // in Satoshi
		currentMultiplier = baseMultiplier;
    }
    
        //calculate the biggest losstreak and then show it
    if (highestlossStreak <= lossStreak) {
    	highestlossStreak = lossStreak;
    }
    console.log('[Bot] You got a loss streak of ' + lossStreak + '. This highest number of losses is: ' + highestlossStreak);

    // Message and set first game to false to be sure.
    console.log('[Bot] Betting ' + (currentBet / 100) + ' bits, cashing out at ' + currentMultiplier + 'x');
    firstGame = false;
   

    if (currentBet <= engine.getBalance()){ // Ensure we have enough to bet
		if (currentBet > (maximumBet * 100)) { // Ensure you only bet the maximum.
			console.warn('[Warn] Bet size exceeds maximum bet, lowering bet to ' + (maximumBet * 100) + ' bits');
			currentBet = maximumBet;
		}
		if(dryRun == false){
			engine.placeBet(currentBet, Math.round(currentMultiplier * 100), false);
		}
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
		lastBonus = data.bonuses[username];
	}
});
