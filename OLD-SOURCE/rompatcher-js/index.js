const userLocale = navigator.language || 'en-US';
var VanillaGameData;

function getDbContent() {
    return fetch('/data/database/content.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('File could not be loaded');
            }
            return response.json();
        })
}

function initPatcher(patches) {
    try {
        const patcherSettings = {
            language: 'en',
            requireValidation: false,
            allowDropFiles: true
        };

        // Events
        patcherSettings.onvalidaterom = (romFile, isRomValid) => {
            if (isRomValid) return;
            RomPatcherWeb.setErrorMessage(`This is not a valid ${VanillaGameData.name} [${VanillaGameData.console}] ROM, please select a different one`);
        }

        RomPatcherWeb.initialize(patcherSettings, patches)
    } catch (err) {
        var message = err.message;
        if (/incompatible browser/i.test(message) || /variable RomPatcherWeb/i.test(message))
            message = 'Your browser is outdated and it is not compatible with this app.';

        document.getElementById('rom-patcher-container').innerHTML = message;
        document.getElementById('rom-patcher-container').style.color = 'red';
    }
}

function generatePatchData(patch, baseGameData = null) {
    let patchData = {
        file: patch.path,
        name: patch.name,
        outputName: patch.name
    };
    if (baseGameData != null) patchData.inputCrc32 = baseGameData.CRC32;

    return patchData;
}

function addDataToSite(data, params) {

    // Check if hack exists
    const hack = data.content.find(i => i.id === params);
    if (!hack) {
        document.getElementById('title').textContent = "🫣 Sorry... I did not create this thing yet";
        document.getElementById('go-back').href = `/`;
        return;
    }
    document.getElementById('go-back').href = `/viewcontent/?id=${hack.id}`;
    if (hack.type != 'hack') {
        document.getElementById('title').textContent = `❌ ${hack.name} is not a patch`;
        return;
    }

    //Change content
    document.getElementById('title').textContent = `⬇️ ${hack.name} Patcher ⬇️`;
    document.getElementById('patcher').removeAttribute('hidden');
    VanillaGameData = gameData = data.games[hack.game];
    document.getElementById('subtitle').textContent = `Requires a ${gameData.name} ROM for the ${gameData.console}`;

    //Enable patcher
    initPatcher(generatePatchData(hack.downloads[0], gameData));
}

document.addEventListener("DOMContentLoaded", function() {
    
    // Get Content
    var params = new URLSearchParams(window.location.search);
    var contentParam = params.get('id');
    getDbContent().then(data => addDataToSite(data, contentParam));
})