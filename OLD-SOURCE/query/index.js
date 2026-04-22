function getDbContent() {
    return fetch('/data/database/content.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('File could not be loaded');
            }
            return response.json();
        })
}

function createHackCard(hack) {
    //Create card for each hack
    const hackCard = document.createElement('aside');
    hackCard.setAttribute('linked_card', '');
    hackCard.setAttribute('image_card', '');
    hackCard.addEventListener('click', function() {
        window.location.href = `/viewcontent?id=${encodeURIComponent(hack.id)}`
    })

    //Get Image
    const hackImage = document.createElement('img')
    hackImage.src = hack.images[0];
    hackImage.alt = hack.name;

    //Create Title
    const hackName = document.createElement('h3');
    hackName.textContent = hack.name;

    //Append elements
    hackCard.appendChild(hackImage);
    hackCard.appendChild(hackName);
    
    return hackCard
}

function addDataToSite(data) {
    const contentContainer = document.getElementById('content-container');

    const params = new URLSearchParams(window.location.search);

    //find matching items
    const matching = data.content.filter(item => {
        return Array.from(params.entries()).every(([key, value]) => {

            if (Array.isArray(item[key])) {
                return item[key].includes(value);
            }
            else if (typeof item[key] === 'string') {
                return item[key].includes(value);
            }
            else {
                return item[key] === value;
            }

        });
    });

    const result = document.getElementById('results');
    if (matching.length <= 0) {
        result.textContent = "😔 No matching items found...";
        return; 
    }
    result.textContent = `Results: ${matching.length}`
    matching.forEach(item => {
        const hackCard = createHackCard(item);
        contentContainer.appendChild(hackCard);
    });
}

document.addEventListener("DOMContentLoaded", function() {
    
    // Get Content
    var data = getDbContent().then(data => addDataToSite(data));
})