# Rate Language version 2 Proof of Concept

## Overview

This application uses Azure Cognitive Speech services to assess the pronunciation of a person.

The feature is explained in Speech Studio [here](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/pronunciation-assessment-tool?tabs=display)

The sample repo with all the code is [here](https://github.com/Azure-Samples/Cognitive-Speech-TTS/tree/master/PronunciationAssessment)

To facilitate the demonstration, we use the `BrowserJS` version, for which we tuned the code and content.

## Requirements

`python`
`pip`

## Installation

Here are the steps to follow on a Windows computer to setup, use, debug and code locally:

- Clone the repository locally `git clone https://github.com/embergershared/rate-lang-v2.git`,

- Create or use an `Azure Speech Service` instance,

- In the blade `Resource Management` / `Keys and Endpoint`, note the `Key 1` (or Key 2) and `Location/Region` values (we'll need them later),

- Launch a terminal **as Admin**,

- `cd` or `Set-Location` in the folder `rate-lang-v2\src\BrowserJS`

- Execute:

```cmd
pip install -r requirements.txt
$env:FLASK_APP = "application.py"
$env:FLASK_ENV = "development"
$env:SPEECH_SERVICE_SUBSCRIPTION_KEY = "<Azure Speech KEY 1 value>"
$env:SPEECH_SERVICE_REGION = "<Azure Speech Location/Region value>"
flask run
```

- Go go the local website with (defaults values here):

[http://127.0.0.1:5000](http://127.0.0.1:5000)

[http://127.0.0.1:5000/readalong](http://127.0.0.1:5000/readalong)
