const userLocale = navigator.language || 'en-US';

function getDbContent() {
    return fetch('/data/database/content.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('File could not be loaded');
            }
            return response.json();
        })
}

function getDownloadLink(patch, name=null) {
    href = document.createElement('a')
    href.href = patch.path;
    if (!name) href.textContent = patch.name;
    else href.textContent = name;

    return href;
}

function addDataToSite(data, params) {
    const item = data.content.find(i => i.id === params);
    if (!item) {
        document.getElementById('title').textContent = "🫣 Sorry... I did not create this thing yet"
        return;
    }

    const title = document.getElementById('title');
    const desc = document.getElementById('description');
    const images = document.getElementById('images');
    const downloads = document.getElementById('downloads');
    const quickdownload = document.getElementById('quick-download');
    const authors = document.getElementById('authors');
    const game = document.getElementById('game');
    const patcher = document.getElementById('patcher');
    const patcherUrl = document.getElementById('patcher-url');

    title.textContent = item.name;
    desc.textContent = item.description;

    //Authors
    authors.textContent = item.authors.join(' - ');

    //Game info
    if (item.type === 'hack') {
        gameData = data.games[item.game];

        game.textContent = `ROM-Hack of ${gameData.name} [${gameData.console}]`
        patcher.removeAttribute('hidden')
        patcherUrl.href = `/patcher/?id=${item.id}`
    } else gameData = null;

    //Images
    item.images.forEach(image => {

        imageElement = document.createElement('img');
        imageLink = document.createElement('a');

        imageElement.src = image;
        imageLink.href = image;
        imageLink.target = "_blank";
        imageLink.rel = "noopener noreferrer"

        imageLink.appendChild(imageElement)
        images.appendChild(imageLink);

    });

    //Downloads
    if (item.downloads.length != 0) {

        if (gameData != null) {
            quickDownloadLink = document.createElement('a');
            quickDownloadLink.href = `/patcher/?id=${item.id}`;
            quickDownloadLink.textContent = 'Download'
        }
        else quickDownloadLink = getDownloadLink(item.downloads[0], "Download");
        quickdownload.appendChild(quickDownloadLink);

        document.getElementById('download-heading').textContent = "Downloads";
        item.downloads.forEach(patch => {

            listItem = document.createElement('li')

            //Get date created
            if (patch.date != "") {
                var date = new Date(patch.date);
                var formattedDate = date.toLocaleDateString(userLocale, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                listItem.textContent = `${formattedDate}: `
            }

            listItem.appendChild(getDownloadLink(patch));
            downloads.appendChild(listItem);

        })
    }

    if (item.type === 'hack') {
        document.getElementById('howto').removeAttribute('hidden')
    }
}

document.addEventListener("DOMContentLoaded", function() {
    
    // Get Content
    var params = new URLSearchParams(window.location.search);
    var contentParam = params.get('id')
    var data = getDbContent().then(data => addDataToSite(data, contentParam));
})