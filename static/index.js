// Behind the scenes code for the index.html page
var reftext = document.getElementById('reftext');
var formcontainer = document.getElementById('formcontainer');
var recordingsList = document.getElementById('recordingsList');
var ttsList = document.getElementById('ttsList');
var textOptionList = document.getElementById('text-select');
var recordButton = document.getElementById('recordbutton');
var spinner = document.getElementById('spinner');

var lastgettstext;
var objectUrlMain;
var wordaudiourls = new Array;

var globalspeakscore = document.getElementById('globalspeakscore');
var accuracyscore = document.getElementById('accuracyscore');
var fluencyscore = document.getElementById('fluencyscore');
var completenessscore = document.getElementById('completenessscore');
var pronscore = document.getElementById('pronscore');
var wordsomitted = document.getElementById('wordsomitted');
var wordsinserted = document.getElementById('wordsinserted');
var omittedwords = "";
var insertedwords = "";

var wordrow = document.getElementById('wordrow');
var phonemerow = document.getElementById('phonemerow');
var scorerow = document.getElementById('scorerow');

var phthreshold1 = 80;
var phthreshold2 = 60;
var phthreshold3 = 40;
var phthreshold4 = 20;

var AudioContext = window.AudioContext || window.webkitAudioContext;;
var audioContent;
var start = false;
var stop = false;
var permission = false;
var reftextval;
var gumStream;      //stream from getUserMedia()
var rec;            //Recorder.js object
var audioStream ;   //MediaStreamAudioSourceNode we'll be recording
var blobpronun;
var offsetsarr;
var tflag = true;
var wordlist;

var t0 = 0;
var t1;
var at;


var hbutton = document.getElementById('buttonhear');
var sbutton = document.getElementById('buttonsubmittext');
var inputtext = document.getElementById('inputformtext');
var speechToTextEvalText = "We love to go on a cruise.";
var enteredText;
var readText;
var globallistenscore = document.getElementById('globallistenscore');
var listencomparison = document.getElementById('listenComparison');


window.onload = async () => {
    if(tflag){
        tflag = gettoken();
        tflag = false;
    }

    let ttsResponse = await fetch('/gettonguetwisters', { method: 'POST'});
    let ttsData = await ttsResponse.json();
    ttsData.forEach(element => {
        const previewText = element.substring(0, 20) + '...';
        textOptionList.innerHTML += `<option value="${element}">${previewText}</option>`;
    });

    if (localStorage.getItem('reftext')) {
        textOptionList.value = localStorage.getItem('reftext');
        localStorage.removeItem('reftext');
    }

    textOptionList.dispatchEvent(new Event('change'));
};

textOptionList.onchange = () => {
    reftextval = textOptionList.value;
    reftext.value = reftextval;
    reftext.innerText = reftextval;
}

function gettoken(){
    var request = new XMLHttpRequest();
    request.open('POST', '/gettoken', true);

    // Callback function for when request completes
    request.onload = () => {
        // Extract JSON data from request
        const data = JSON.parse(request.responseText);
        at = data.at;
    }

    //send request
    request.send();
    return false;
}

function playword(k){
    var audio = document.getElementById('ttsaudio');
    audio.playbackRate = 0.5;
    audio.currentTime = (offsetsarr[k]/1000) + 0;

    var stopafter = 10000;

    if(k != offsetsarr.length -1){
        stopafter = (offsetsarr[k+1]/1000) + 0.01;
    }

    audio.play();

    var pausing_function = function(){
        if(this.currentTime >= stopafter) {
            this.pause();
            this.currentTime = 0;
            stopafter = 10000;
            // remove the event listener after you paused the playback
            this.removeEventListener("timeupdate",pausing_function);
            audio.playbackRate = 0.9;
        }
    };

    audio.addEventListener("timeupdate", pausing_function);
}

function playwordind(word){
    var audio = document.getElementById('ttsaudio');
    audio.playbackRate = 0.5;

    for(var i=0; i<wordaudiourls.length;i++){
        if(wordaudiourls[i].word==word){
            audio.src = wordaudiourls[i].objectUrl;
            audio.playbackRate = 0.7;
            audio.play();
            break;
        }
    }

    var ending_function = function() {
        audio.src=objectUrlMain;
        audio.playbackRate = 0.9;
        audio.autoplay = false;
        audio.removeEventListener("ended",ending_function);
    };

    audio.addEventListener("ended", ending_function);
}

reftext.onclick = function() {handleWordClick()};

function handleWordClick(){
    const activeTextarea = document.activeElement;
    var k=activeTextarea.selectionStart;

    reftextval = reftext.value;
    wordlist = reftextval.split(" ");

    var c = 0;
    var i = 0;
    for (i = 0; i < wordlist.length; i++) {
        c += wordlist[i].length;
        if(c >= k){
            playwordind(wordlist[i]);
            //playword(i);
            break;
        }
        c += 1;
      }

}

var soundAllowed = function (stream) {
    permission = true;
    audioContent = new AudioContext();
    gumStream = stream;
    audioStream = audioContent.createMediaStreamSource( stream );
    rec = new Recorder(audioStream,{numChannels:1})

//start the recording process
rec.record()
}

var soundNotAllowed = function (error) {
    h.innerHTML = "You must allow your microphone.";
    console.log(error);
}

function getttsforword(word){
    var request = new XMLHttpRequest();
    request.open('POST', '/getttsforword', true);
    request.responseType = "blob";

    // Callback function for when request completes
    request.onload = () => {
        var blobpronun = request.response;
        var objectUrl = URL.createObjectURL(blobpronun);
        wordaudiourls.push({word,objectUrl});
    }
    const dat = new FormData();
    dat.append("word", word);

    //send request
    request.send(dat);
}

//function for handling main button clicks
recordButton.onclick = () =>{
    if (reftext.value.length == 0){
        alert("Reference Text cannot be empty!");
    }
    else{
        if (stop) {
            localStorage.setItem('reftext', reftext.value);
            window.location.reload();
        }
        else if (start) {

            start = false;
            stop = true;
            
            recordButton.innerHTML = '<span><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">  <path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg></span>Retry';
            
            recordButton.className = "bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded";
            rec.stop();
            document.getElementById('results').style.display = "block";

            //stop microphone access
            gumStream.getAudioTracks()[0].stop();

            //create the wav blob and pass it on to createDownloadLink
            rec.exportWAV(createDownloadLink);
            spinner.style.display = "block";
        }
        else {
            if (!permission) {
                navigator.mediaDevices.getUserMedia({audio:true})
                    .then(soundAllowed)
                    .catch(soundNotAllowed);
            }

            start = true;
            reftext.readonly = true;
            reftext.disabled = true;

            reftextval = reftext.value;

            recordButton.innerHTML = 'Done recording';
            recordButton.className = "bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded";
        }
    }
};


function fillDetails(words){
    for (var wi in words){
        var w = words[wi];
        var countp = 0;

        if(w.ErrorType == "Omission"){
            omittedwords += w.Word;
            omittedwords += ', ';

            var tdda = document.createElement('td');
            tdda.innerText = '-';
            phonemerow.appendChild(tdda);

            var tddb = document.createElement('td');
            tddb.innerText = '-';
            scorerow.appendChild(tddb);

            var tdw = document.createElement('td');
            tdw.innerText = w.Word;
            tdw.style.backgroundColor = "orange";
            wordrow.appendChild(tdw);
        }
        else if(w.ErrorType == "Insertion"){
                insertedwords += w.Word;
                insertedwords += ', ';
        }
        else if(w.ErrorType == "None" || w.ErrorType == "Mispronunciation"){
            for (var phonei in w.Phonemes){
                var p =w.Phonemes[phonei]
                var tdp = document.createElement('td');
                tdp.innerText = p.Phoneme;
                if(p.AccuracyScore >= phthreshold1){
                    tdp.style.backgroundColor = "green";
                }
                else if(p.AccuracyScore >= phthreshold2){
                    tdp.style.backgroundColor = "lightgreen";
                }
                else if(p.AccuracyScore >= phthreshold3){
                    tdp.style.backgroundColor = "yellow";
                }
                else{
                    tdp.style.backgroundColor = "red";
                }
                phonemerow.appendChild(tdp);

                var tds = document.createElement('td');
                tds.innerText = p.AccuracyScore;
                scorerow.appendChild(tds);
                countp = Number(phonei)+1;
            }
            var tdw = document.createElement('td');
            tdw.innerText = w.Word;
            var x = document.createElement("SUP");
            var t = document.createTextNode(w.AccuracyScore);
            x.appendChild(t);
            tdw.appendChild(x);
            tdw.colSpan = countp;
            if(w.ErrorType == "None"){
                tdw.style.backgroundColor = "lightgreen";
            }
            else{
                tdw.style.backgroundColor = "red";
            }
            wordrow.appendChild(tdw);
        }
    }
}

function findAverage(arr) { 
  let sum = 0; 
  for (let i = 0; i < arr.length; i++) { 
    sum += arr[i]; 
  } 
  return sum / arr.length; 
} 

function fillData(data){
    document.getElementById("summarytable").style.display = "flex";
    globalspeakscore.innerText = findAverage([data.AccuracyScore, data.FluencyScore, data.CompletenessScore, parseInt(data.PronScore, 10)]).toFixed(2);
    accuracyscore.innerText = data.AccuracyScore;
    fluencyscore.innerText = data.FluencyScore;
    completenessscore.innerText = data.CompletenessScore;
    pronscore.innerText = parseInt(data.PronScore, 10);

    fillDetails(data.Words);
    wordsomitted.innerText = omittedwords;
    if(insertedwords != ""){
        wordsinserted.innerText = insertedwords;
    }
}

function createDownloadLink(blob) {
    var url = URL.createObjectURL(blob);
    var au = document.createElement('audio');
    var li = document.createElement('p');
    var link = document.createElement('a');

    //name of .wav file to use during upload and download (without extendion)
    var filename = new Date().toISOString();

    //add controls to the <audio> element
    au.controls = true;
    au.src = url;

    //add the new audio element to li
    li.appendChild(au);

    //add the li element to the ol
    recordingsList.appendChild(li);

    var request = new XMLHttpRequest();
    request.open('POST', '/ackaud', true);

    // Callback function for when request completes
    request.onload = () => {
        // Extract JSON data from request

        const data = JSON.parse(request.responseText);

        if(data.RecognitionStatus == "Success") {
            fillData(data.NBest[0]);
            document.getElementById("metrics").style.display = "block";
            document.getElementById("globalSpeakScore").style.display = "block";
            spinner.style.display = "none";
        }
        else{
            alert("Did not catch audio properly! Please try again.");
            console.log("Server returned: Error");
            console.log(data.RecognitionStatus);
            spinner.style.display = "none";
        }
    }
    // Add data to send with request
    const data = new FormData();
    data.append("audio_data",blob, filename);
    data.append("reftext",reftextval);

    //send request
    request.send(data);

    return false;
}

// Listening evaluation code
//function for onclick of Listen to the text button
hbutton.onclick = function () {
  reftextval = speechToTextEvalText;
  inputtext.value = "";

  if(reftextval != lastgettstext){
      document.getElementById("ttsloader").style.display = "block";

      var request = new XMLHttpRequest();
      request.open('POST', '/gettts', true);
      request.responseType = "blob";

      // Callback function for when request completes
      request.onload = () => {
          var blobpronun = request.response;
          var offsets = request.getResponseHeader("offsets");
          offsetsarr = offsets.substring(1,offsets.length - 1).replace(/ /g, "").split(',').map(Number);;

          objectUrlMain = URL.createObjectURL(blobpronun);

          var au = document.createElement('audio');
          var li = document.createElement('p');

          //add controls to the <audio> element
          au.controls = true;
          au.autoplay = true;
          au.id = "ttsaudio"
          au.src = objectUrlMain;

          //add the new audio element to li
          li.appendChild(au);

          //add the li element to the ol

          if(ttsList.hasChildNodes()){
              ttsList.lastChild.remove();
          }

          ttsList.appendChild(li);

          document.getElementById("ttsloader").style.display = "none";
      }
      const dat = new FormData();
      dat.append("reftext",reftextval);

      //send request
      request.send(dat);

      lastgettstext = reftextval;

      wordlist = reftextval.split(" ");
      for (var i = 0; i < wordlist.length; i++) {
          getttsforword(wordlist[i]);
      }
  }
  else{
      console.log("TTS Audio for given text already exists. You may change ref text");
  }

  return false;
}

//function for onclick of Submit your text button
sbutton.onclick = function () {
  console.log("Submit button clicked.");
  enteredText = inputtext.value;
  readText = speechToTextEvalText;

  document.getElementById("listenwrote").innerText = enteredText;
  document.getElementById("listenexpected").innerText = readText;
  listencomparison.style.display = "block";

  if(enteredText == readText){
      globallistenscore.innerText = "That was the sentence"
      globallistenscore.style.backgroundColor = "lightgreen";
    } else {
      globallistenscore.innerText = "That was not the sentence"
      globallistenscore.style.backgroundColor = "orange";
  }
  document.getElementById("globalListenScore").style.display = "block";
}