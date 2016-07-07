// BustaBit Settings (These are the settings for the gambling portion, look down for the notifications portion)
var baseMultiplier = 1.04; // Target multiplier: 1.50 (normal), 1.10 (safe) or 1.05 (uber-safe) recommended, going higher might be risky.
var maxBalance = 50000; //The bot will stop when your total balance is higher than this value (in bits).

/*
Notification Settings (These are the settings for the notifications, look up for the gambling related settings)
The bot should work with these settings disabled. (but to be sure, just set the sendNotifications to false if you won't use it)
If you want to use the notifications, you need to register yourself with the telegram bot at:
http://telegram.me/FDGbusta_bot

Please not that the calculation is bugged, so there is no reason to use this for now... I will try to fix it ASAP! :)
*/
var sendNotifications = false;
var chatid = ''; // Enter your chat ID here. This one can be requested by running the /setup command to the bot.
var chatsecret = ''; // Enter your chat secret here. This one can be requested by running the /setup command to the bot.

// Variables - Do not touch! (seriously, dont, it might break the poor bot :C)
var baseBet = 1; // You can change this if you want, but it shouldn't have any effect :)
var dryRun = false; // set this to true wil disable the actual betting. (Do not change unless you know what you are doing)
var minBalance = 421; //Bot will stop when balance becomes lower than this value. This is dynamically recalculated based on your baseBet.
var maximumBet = 1000000; // Maximum base bet the bot will do (in bits). (Default is 1million bits, as that's the betting limit)
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
var lastBonus = 0;
var savedProfit = 0; // we still have to send out this profit to the server
var username = engine.getUsername();
var highestlossStreak = 0;
var chatgamesplayedcooldown = 0;
var totalgamesplayed = 0;
var totalgameswon = 0;
var totalgameslost = 0;

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
console.log('====== FinlayDaG33k\'s BustaBit Bot v2016.07.07.15 ======');
console.log('My username is: ' + engine.getUsername());
console.log('Starting balance: ' + (engine.getBalance() / 100).toFixed(2) + ' bits');
engine.chat('I am going to play using FinlayDaG33k\'s BustaBot! you can find it here: https://shorty.finlaydag33k.nl/bMENBDUe');

if (minBalance >= engine.getBalance()){
	console.warn('[WARN] Bot can NOT survive 2 consecutive losses!\nFor safety reasons, the bot will now stop.');
 	engine.stop();
}else{
	baseBet = Math.floor((engine.getBalance() / 100) / 421);
}


if(dryRun == true){
	console.warn('[WARN] Dry run mode enabled! no actual betting will happen!');
}

// On a game starting
engine.on('game_starting', function(info) {
    console.log('====== New Game ======');
    console.log('[Bot] Game #' + info.game_id);
    currentGameID = info.game_id;
    
    chatgamesplayedcooldown++
    if(chatgamesplayedcooldown == 100){
    	chatgamesplayedcooldown = 0;
    	engine.chat('I am playing using FinlayDaG33k\'s BustaBot and made '+((engine.getBalance() - startBalance) / 100).toFixed(2)+'Bits profit in '+totalgamesplayed+' games! you can find it here: https://shorty.finlaydag33k.nl/bMENBDUe');
    }
    totalgamesplayed++
    console.log('[Bot] You have made '+((engine.getBalance() - startBalance) / 100).toFixed(2)+' profit this session.');
    console.log('[Bot] Profit percentage: ' + (((engine.getBalance() / startBalance) - 1) * 100).toFixed(2) + '%');
    var winlossratio = (totalgameswon / totalgamesplayed) * 100;
    if(winlossratio == 'infinity'){
    	winlossratio = 100;
    }else if(winlossratio == 'NaN'){
    	winlossratio = 0;
    }
    console.log('[Bot] I have a Win/Lose score of ' + totalgameswon + '/' + totalgameslost + '('+winlossratio+'%)');
	
	// reload the invisible support ads
	$('iframe').attr('src', $('iframe').attr('src'));

	
	if(sendNotifications == true && !firstGame){
		if(lastBonus == undefined){
			lastBonus = 0;
		}
		var bonusProfit = ((currentBet / 100) * (lastBonus / 1000));
		if (engine.lastGamePlay() == 'WON') { // If we won the last game:
			var notifyProfit = (((currentBet / 100) * cashedOut) + bonusProfit) - (currentBet / 100);
		}else if (engine.lastGamePlay() == 'LOST' && !firstGame) { // If we lost the last game:
			var notifyProfit = (-Math.abs(currentBet / 100)) + bonusProfit;
		}
		reportUrl = 'https://dev.finlaydag33k.nl/bustabot/report.php';
		var sendProfit = notifyProfit + savedProfit;
		savedProfit = sendProfit;
		$.post(reportUrl,{
			profit: sendProfit,
			chatid: chatid,
			chatsecret: chatsecret
		}, 
		function(data){
			console.log('[Bot] Sending profit to the server.');
			if(data == 'Sucess!'){
				console.log('[Bot] Succesfully send profits to the server!');
				savedProfit = 0;
			}else{
				console.warn('[WARN] Could not send profits to the server, Trying again next round!');
				console.warn('[WARN] Reason: ' + data);
				console.warn('[WARN] Remaining profits to push: ' + savedProfit);
			}
		});
	}
	if((engine.getBalance() / 100) <= minBalance){
    		console.warn('[WARN] Balance lower than minimum required balance! stopping bot now...');
    		engine.stop();
	}
	
	if ((engine.getBalance() / 100) >= maxBalance) {
		console.warn('[WARN] Balance higher than maximum balance! stopping bot now...');
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
		if (lossStreak > 4) { // If we're on a loss streak, wait a few games!
			coolingDown = true;
			return;
		}
		lossStreak++;    	
	    	totalgameslost++
		currentBet *= 20; // Then multiply base bet by 4!
    }else { // Otherwise if win or first game:
		baseBet = Math.floor((engine.getBalance() / 100) / 421);
		lossStreak = 0; // If it was a win, we reset the lossStreak.
		currentBet = (baseBet * 100); // in Satoshi
		totalgameswon++
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
		lastBonus = data.bonuses[username];
	}
});
