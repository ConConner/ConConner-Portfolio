function getDbContent() {
    return fetch('/data/database/content.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('File could not be loaded');
            }
            return response.json();
        })
}

function addDataToSite(data) {
    console.log(data)

    const contentContainer = document.getElementById('content-container');
    data.content.forEach(hack => {

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
        contentContainer.appendChild(hackCard);

    });
}

document.addEventListener("DOMContentLoaded", function() {
    
    // Get Content
    var data = getDbContent().then(data => addDataToSite(data));
})