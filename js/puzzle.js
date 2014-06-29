
function generateKey(pwd, iv) {
	
	var nbLetter = 3;
	var sizeKey = Math.ceil(pwd.length / nbLetter);
	var sizePasswordLeft = pwd.length - ((sizeKey - 1) * nbLetter)
	var sizeNbBlock = sizeKey;
	sizeKey = sizeKey * 128; /* Size SHA512 Hex */
	var reversePwd = reverseString(pwd);
	
	//var firstIntermediateKey = "";
	var secondIntermediateKey = "";
	//var firstFinalKey = "";
	var secondFinalKey = "";
	
	/* First round of hash generation  */
	for(i = 0; i < sizeNbBlock; i++) {

		//var tempPass = "";
		var tempPassReverse = "";
		if(i == sizeNbBlock - 1) {
			for(y = 0; y < i * nbLetter + sizePasswordLeft; y++) {
				//tempPass = tempPass + pwd.charAt(y);
				tempPassReverse = tempPassReverse + reversePwd.charAt(y);
			}  
		}else {
			for(y = 0; y < i * nbLetter + nbLetter; y++) {
				//tempPass = tempPass + pwd.charAt(y);
				tempPassReverse = tempPassReverse + reversePwd.charAt(y);
			}  
		}

		//var shaObj = new jsSHA(tempPass, 'TEXT');
		var shaObjReverse = new jsSHA(tempPassReverse, 'TEXT');

		//firstIntermediateKey = firstIntermediateKey + shaObj.getHash("SHA-512", "HEX");
		secondIntermediateKey = secondIntermediateKey + shaObjReverse.getHash("SHA-512", "HEX");

	}
	
	/* Second round of hash generation  */
	for(i = 0; i < sizeNbBlock - 1; i++) {
		
		//var tempKey = "";
		var tempKeyReverse = "";

		for(y = 0; y < (sizeNbBlock - i) * 128; y++) {
			//tempKey = tempKey + firstIntermediateKey.charAt(y + i * 128);
			tempKeyReverse = tempKeyReverse + secondIntermediateKey.charAt(y + i * 128);
		}
		
		//var shaObj = new jsSHA(tempKey, 'TEXT');
		var shaObjReverse = new jsSHA(tempKeyReverse, 'TEXT');

		//firstFinalKey = firstFinalKey + shaObj.getHash("SHA-512", "HEX");
		secondFinalKey = secondFinalKey + shaObjReverse.getHash("SHA-512", "HEX");
	
	}

    //var lastHash = "";
    var lastHashReverse = "";
	for(i = 0; i < sizeNbBlock; i++) {
        if(i != sizeNbBlock - 2) {
            for(y = 0; y < 128; y++) {
                //lastHash = lastHash + firstIntermediateKey.charAt(y + i * 128);
                lastHashReverse = lastHashReverse + secondIntermediateKey.charAt(y + i * 128);
            }
        }
	}
    //var shaObj = new jsSHA(lastHash, 'TEXT');
    var shaObjReverse = new jsSHA(lastHashReverse, 'TEXT');

    //firstFinalKey = firstFinalKey + shaObj.getHash("SHA-512", "HEX");
    secondFinalKey = secondFinalKey + shaObjReverse.getHash("SHA-512", "HEX");

    /* Emulation of the shift byte */
    secondFinalKey = secondFinalKey + secondFinalKey.charAt(0) + secondFinalKey.charAt(1);
    secondFinalKey = secondFinalKey + secondFinalKey.charAt(2) + secondFinalKey.charAt(3);
    secondFinalKey = secondFinalKey + secondFinalKey.charAt(4) + secondFinalKey.charAt(5);

    /* Convert HEX into int array */
    var key = [];

    for(y = 0; y < 2; y++) {

        for(i = 0; i < secondFinalKey.length - 6; i = i + 4) {

            var temp = secondFinalKey.charAt(i + (y * 2)) + secondFinalKey.charAt(i + (y * 2) + 1) + secondFinalKey.charAt(i + (y * 2) + 2) + secondFinalKey.charAt(i + (y * 2) + 3); // + secondFinalKey.charAt(i + (y * 2) + 4) + secondFinalKey.charAt(i + (y * 2) + 5) + secondFinalKey.charAt(i + (y * 2) + 6) + secondFinalKey.charAt(i + (y * 2) + 7);
            key.push(parseInt(temp, 16));

        }

    }

    /* IV Generation */
    var ivSha = "";
    var ivKey = [];
    var shaFirst = new jsSHA(iv, 'TEXT');
    ivSha += shaFirst.getHash("SHA-512", "HEX");
	for(i = 0; i < sizeNbBlock; i++) {
		var sha = new jsSHA(ivSha, 'TEXT');
        ivSha +=  sha.getHash("SHA-512", "HEX");
    }

    /* Emulation of the shift byte */
    ivSha = ivSha + ivSha.charAt(0) + ivSha.charAt(1);
    ivSha = ivSha + ivSha.charAt(2) + ivSha.charAt(3);
    ivSha = ivSha + ivSha.charAt(4) + ivSha.charAt(5);

    for(y = 0; y < 2; y++) {

        for(i = 0; i < ivSha.length - 6; i = i + 4) {

            var temp = ivSha.charAt(i + (y * 2)) + ivSha.charAt(i + (y * 2) + 1) + ivSha.charAt(i + (y * 2) + 2) + ivSha.charAt(i + (y * 2) + 3); // + ivSha.charAt(i + (y * 2) + 4) + ivSha.charAt(i + (y * 2) + 5) + ivSha.charAt(i + (y * 2) + 6) + ivSha.charAt(i + (y * 2) + 7);
            ivKey.push(parseInt(temp, 16));

        }

    }

    for(i = 0; i < key.length; i++) {

        //key[i] = ((key[i] * ivKey[i % ivKey.length]) % key[i]) + ivKey[i % ivKey.length];
        key[i] = key[i] + ivKey[i % ivKey.length];
    }

    return key;

}

function generateMap(size, key) {

    var keyPosition = 0;

    var mapEncrypt = [];
    var mapDecrypt = [];

    for(i = 0; i < size; i++) {

        var finalPosition = (i * key[keyPosition % key.length] + key[(keyPosition + 1) % key.length]) % size;
        var direction = key[keyPosition % key.length] % 2;
        keyPosition = keyPosition + 2;

        if(mapDecrypt[finalPosition] == null) {
            mapEncrypt[i] = finalPosition;
            mapDecrypt[finalPosition] = i;
        }
        else {

            if(direction == 1) {

                while(mapDecrypt[finalPosition] != null) {
                    finalPosition++;
                    if(finalPosition >= size) finalPosition = 0;
                }
                mapEncrypt[i] = finalPosition;
                mapDecrypt[finalPosition] = i;

            }
            else {

                while(mapDecrypt[finalPosition] != null) {
                    finalPosition--;
                    if(finalPosition < 0) finalPosition = size - 1;
                }
                mapEncrypt[i] = finalPosition;
                mapDecrypt[finalPosition] = i;

            }

        }

    }

    return {"encrypt": mapEncrypt, "decrypt": mapDecrypt};

}

function reverseString(s){
    return s.split("").reverse().join("");
}

