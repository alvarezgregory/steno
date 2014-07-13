var dictionary = {};
var map = {};
var password = {};
var initVector = {};
var dictionaryNames = ["adjectives", "adverbs", "nouns", "verbs", "pronouns", "prepo"];

function processText(encrypt, force) {

    var nodeError = document.getElementById("error");
    nodeError.innerHTML = "";

    if(Object.keys(dictionary).length != dictionaryNames.length) {
        nodeError.innerHTML = "Internal error : missing dictionaries";
        return;
    }
    if(document.getElementById("textAera").value == "") {
        nodeError.innerHTML = "No message to encrypt/decrypt.";
        return;
    }
    if(document.getElementById("pwd").value == "") {
        nodeError.innerHTML = "Need a password !";
        return;
    }
    if(document.getElementById("pwd").value.length < 9) {
        nodeError.innerHTML = "Password too short, minimum 9 characters.";
        return;
    }

    var text = document.getElementById("textAera").value;
    text = text.replace(/(?:\r\n|\r|\n)/g, ' ');

    var iv = "";
    if(encrypt) iv = generateIv(text.split(" ").length);
    else {
        iv = text.split(".")[0];
        text = text.replace(iv + ".", "");
    }

    var array = text.split(" ");

    var result = true;

    /* Check if words isn't in dictionary */
    if(!force) {
        for(var i = 0; i < array.length; i++) {

            var word = removePonctuation(array[i]);
            if(!getDicoName(word)) {
                result = false;

                nodeError.innerHTML = nodeError.innerHTML + word + " ";
                /* underline word */
            }

        }
    }

    if(result) {

        document.getElementById("textAera").value = "";
        if(encrypt) document.getElementById("textAera").value += iv + " ";

        for(var i = 0; i < array.length; i++) {

            if(array[i] == "") continue;

            if(isPunctuation(array[i])) {
                document.getElementById("textAera").value += array[i] + " ";
                continue;
            }

            var punctuationBegining = "";
            var punctuationEnd = "";

            if(isPunctuation(array[i].charAt(0))) punctuationBegining = array[i].charAt(0);
            if(isPunctuation(array[i].charAt(array[i].length - 1))) punctuationEnd = array[i].charAt(array[i].length - 1);

            array[i] = removePonctuation(array[i]);

            var dicoName = getDicoName(array[i].toLowerCase());
            var word = "";
            if(dicoName) word = changeWord(array[i], dicoName, encrypt, iv);
            else word = array[i].toLowerCase();

            document.getElementById("textAera").value += punctuationBegining + word + punctuationEnd + " ";

        }

    }
    else {
        nodeError.innerHTML = "These words are not in the dictionary: " + nodeError.innerHTML + ".";
        nodeError.innerHTML += "<br />They will not be encrypted, do you want to proceed anyway ?"
        $(".boutongroup").hide();
        $(".boutongroupsure").show();
    }

}

function getDicoName(word) {

    for (var key in dictionary) {
        if(dictionary[key]["lookup"][word]) return key;
    } 

    return null;

}

function generateIv(size) {

    var nbWords = Math.floor((Math.random() * (0.20 * size)) + 1);

    var iv = "";
    var size = 0;

    while(size < nbWords) {
        for (var key in dictionary) {
            if (dictionary.hasOwnProperty(key)) {
                var ts = Math.round((new Date()).getTime()); 
                var p = (Math.floor((Math.random() * dictionary[key]["position"].length) + 1) * ts) %  dictionary[key]["position"].length;

                if(iv != "") iv += " "; 

                iv += dictionary[key]["position"][p];
                size++;
                if(size > nbWords) break;
            }
        }
    }
    iv += ".";

    return iv;

}

function isPunctuation(word) {

    var p = [".", ",", "?", ";", ":", "(", ")", "{", "}", "-", "_", "!"];

    if(p.indexOf(word) > -1) return true;
    else return false

}

function changeWord(word, dicoName, encrypt, iv) {

    if(map[dicoName] == null || password[dicoName] != document.getElementById("pwd").value || initVector[dicoName] != iv) {
        password[dicoName] = document.getElementById("pwd").value;
        initVector[dicoName] = iv;
        var ivNext = removePonctuation(iv);
        ivNext = ivNext.replace(/ /g, "");
        ivNext = ivNext.toLowerCase();
        ivNext += dicoName;
        map[dicoName] = generateMap(dictionary[dicoName]["position"].length, generateKey(password[dicoName], ivNext)); 
    }

    var position = dictionary[dicoName]["lookup"][removePonctuation(word)] - 1;
    var w = "";

    if(encrypt) w = dictionary[dicoName]["position"][map[dicoName]["encrypt"][position]];
    else w = dictionary[dicoName]["position"][map[dicoName]["decrypt"][position]];

    return w;
}

function encrypt() {

    processText(true, false);

}

function decrypt() {

    processText(false, true);

}

function encryptSure() {

    processText(true, true);

    var nodeError = document.getElementById("error");
    nodeError.innerHTML = "";
    
    $(".boutongroup").show();
    $(".boutongroupsure").hide();

}

function decryptSure() {

    var nodeError = document.getElementById("error");
    nodeError.innerHTML = "";
    
    $(".boutongroup").show();
    $(".boutongroupsure").hide();

}

function removePonctuation(text) {

    var txt = text.replace(/\./g, "");
    txt = txt.replace(",", "");
    txt = txt.replace("?", "");
    txt = txt.replace(";", "");
    txt = txt.replace(":", "");
    txt = txt.replace("(", "");
    txt = txt.replace(")", "");
    txt = txt.replace("{", "");
    txt = txt.replace("}", "");
    //txt = txt.replace("-", "");
    txt = txt.replace("_", "");
    txt = txt.replace("!", "");

    txt = txt.toLowerCase();

    return txt;
}

function loadDicionary() {

    var name = "";
    for ( var i = 0; i < dictionaryNames.length; i++ ) {
        if(dictionary[dictionaryNames[i]]) continue;
        else {
            name = dictionaryNames[i];
            break;
        }
    }

    if(name === "") return;

    $.get("dico/english/" + name + ".txt", function( txt ) {
        var dict = {};
        var text = txt.replace(/(?:\r\n|\r|\n)/g, '\r\n');
        var words = text.split( "\r\n" );
        var pos = [];        

        var y = 1; 
        for ( var i = 0; i < words.length; i++ ) {
            if(!getDicoName(words[i].toLowerCase()) && !dict[words[i].toLowerCase()]) {
                dict[ words[i].toLowerCase() ] = y;
                pos[y - 1] = words[i].toLowerCase();
                y++;
            }
        }

        dictionary[name] = {"lookup": dict, "position": pos};

        loadDicionary();

    });

}

loadDicionary();
