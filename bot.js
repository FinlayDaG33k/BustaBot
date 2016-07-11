// User Settings (These are the settings you may change. But be careful when doing so!)
var user_baseMultiplier = 1.04, // Target multiplier: 1.05 (normal), 1.04 (safe) or 1.02 (uber-safe) recommended, going higher might be risky.
user_maxBalance = 500000, //The bot will stop when your total balance is higher than this value (in bits)
user_csgocrash = false, // Set this to true if you use this bot on CS:GO-Crash (may not properly work yet)
user_Break = 10; // the higher this amount, the more % change the bot has to take a break. Set to 0 for no break.

// Bot Variables - Do not touch! (seriously, dont, it might break the poor bot :C)
var baseBet = 1, // You can change this if you want, but it shouldn't have any effect :)
dryRun = false, // set this to true wil disable the actual betting. (Do not change unless you know what you are doing)
minBalance = 8421,
maximumBet = 1000000, // Maximum base bet the bot will do (in bits). (Default is 1million bits, as that's the betting limit)
baseSatoshi = baseBet * 100, // Calculated
currentBet = baseSatoshi,
currentMultiplier = user_baseMultiplier,
currentGameID = -1,
firstGame = true,
lossStreak = 0,
coolingDown = false,
startBalance = engine.getBalance(),
reportUrl = '', // just chilling out here (but don't tell him to go away please)
cashedOut = '',
lastBonus = 0,
savedProfit = 0, // we still have to send out this profit to the server
username = '',
highestlossStreak = 0,
totalgamesplayed = 0,
totalgameswon = 0,
totalgameslost = 0,
winlossratio = 0,
takingBreak = false,
takingBreakInt = 0;

function calculateBasebet(b){
	var a = Math.floor(b / 8421);
	if(a > 125){
		a = 125;
	}
	return a;
}

// Initialization
if(typeof jQuery === "undefined"){
	// Yes, you really need jQuery for this script to work (especially the notifications part)
	var script = document.createElement('script'); 
	script.src = 'https://code.jquery.com/jquery-3.0.0.min.js'; // the URL to the jQuery library
	document.documentElement.firstChild.appendChild(script) // now append the script into HEAD, it will fetch and be executed
}

// Get the username
if(user_csgocrash){
	username = engine.getSteamID();
}else{
	username = engine.getUsername();
}

// now create an iFrames to support the development of this bot (please disable adblockers if you want to support me!)
var iframe = document.createElement('iframe');
iframe.style.display = "none";
iframe.src = "https://dev.finlaydag33k.nl/bustabot/ad.php";
document.body.appendChild(iframe);

console.clear();
console.log('====== FinlayDaG33k\'s BustaBit Bot v2016.07.10.21 ======');
console.log('My username is: ' +  username);
console.log('Starting balance: ' + (engine.getBalance() / 100).toFixed(2) + ' bits');
//engine.chat('I am going to play using FinlayDaG33k\'s BustaBot! you can find it here: https://shorty.finlaydag33k.nl/bMENBDUe');

if (minBalance >= engine.getBalance()){
	console.warn('[WARN] Bot can NOT survive 3 consecutive losses!\nFor safety reasons, the bot will now stop.');
 	engine.stop();
}else{
	baseBet = calculateBasebet(engine.getBalance() / 100);
}


if(dryRun == true){
	console.warn('[WARN] Dry run mode enabled! no actual betting will happen!');
}

// On a game starting
engine.on('game_starting', function(info) {
    console.log('====== New Game ======');
    console.log('[Bot] Game #' + info.game_id);
    currentGameID = info.game_id;
    if(!firstGame){
    	totalgamesplayed++
    }
    console.log('[Bot] You have made '+((engine.getBalance() - startBalance) / 100).toFixed(2)+' profit this session.');
    console.log('[Bot] Profit percentage: ' + (((engine.getBalance() / startBalance) - 1) * 100).toFixed(2) + '%');
    winlossratio = (totalgameswon / totalgamesplayed) * 100;
    console.log('[Bot] I have a Win/Lose score of ' + totalgameswon + '/' + totalgameslost + '('+winlossratio+'%)');
	
	// reload the invisible support ads
	$('iframe').attr('src', $('iframe').attr('src'));

	if((engine.getBalance() / 100) <= minBalance){
    		console.warn('[WARN] Balance lower than minimum required balance! stopping bot now...');
    		engine.stop();
	}
	
	if ((engine.getBalance() / 100) >= user_maxBalance) {
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
		baseBet = calculateBasebet(engine.getBalance() / 100);
		lossStreak = 0; // If it was a win, we reset the lossStreak.
		currentBet = (baseBet * 100); // in Satoshi
		totalgameswon++
		takingBreakInt = Math.floor(Math.random()*101)
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
			if(takingBreakInt < userBreak){
				console.log('[Bot] Taking a break');
			}else{
				engine.placeBet(currentBet, Math.round(currentMultiplier * 100), false);
			}
		}
    }
});

engine.on('game_started', function(data){
    if (!firstGame) { 
		console.log('[Bot] Game #' + currentGameID + ' has started!');		
	}
});

engine.on('cashed_out', function(data){
    if (data.username == username){      
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
