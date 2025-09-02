// -----------------------------
// CSRF Helper
// -----------------------------
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// -----------------------------
// Submit Map Location to Backend
// -----------------------------
async function submitMapLocation(locationData) {
    try {
        const response = await fetch('/log-location/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
            body: JSON.stringify(locationData)
        });

        const data = await response.json();
        alert(data.message || 'Saved!');
    } catch (err) {
        console.error(err);
        alert('Error saving location.');
    }
}

// -----------------------------
// Load saved locations from backend
// -----------------------------
async function loadSavedLocations(mapId, markedLocations, drawMap, mapImage) {
    try {
        const response = await fetch(`/get-locations/${mapId}/`);
        const data = await response.json();
        data.forEach(loc => markedLocations.push(loc));
        drawMap(mapImage);
    } catch (err) {
        console.error('Failed to load saved locations:', err);
    }
}

// -----------------------------
// Initialize all maps
// -----------------------------
window.onload = function() {
    const mapContainer = document.getElementById('map-container');

    const maps = [
        { id: 'map-raid-1', url: 'https://static.wikia.nocookie.net/shadowfight/images/a/a8/Raid3.jpg/revision/latest/scale-to-width-down/1000?cb=20190814181849', heading: 'Interactive Map 1: Raid 1' },
        { id: 'map-raid-2', url: 'https://static.wikia.nocookie.net/shadowfight/images/0/05/Raid2.jpg/revision/latest/scale-to-width-down/1000?cb=20170417105448', heading: 'Interactive Map 2: Raid 2' },
        { id: 'map-raid-3', url: 'https://static.wikia.nocookie.net/shadowfight/images/2/24/Raids1.jpg/revision/latest/scale-to-width-down/1000?cb=20160325120909', heading: 'Interactive Map 3: Raid 3' },
    ];

    maps.forEach(map => {
        createMapSection(mapContainer, map.id, map.url, map.heading);
    });
};

// -----------------------------
// Create a map section
// -----------------------------
function createMapSection(container, id, imageUrl, headingText) {
    const mapSection = document.createElement('div');
    mapSection.className = 'map-section-wrapper';
    mapSection.id = id;

    const heading = document.createElement('h2');
    heading.textContent = headingText;
    heading.style.textAlign = 'center';

    const instruction = document.createElement('p');
    instruction.textContent = 'Hover over the map to get coordinates. Click to add a location!';
    instruction.style.textAlign = 'center';

    const mapDisplayContainer = document.createElement('div');
    mapDisplayContainer.className = 'map-section';

    const canvas = document.createElement('canvas');
    canvas.className = 'interactive-canvas';
    canvas.width = 800;
    canvas.height = 500;

    const infoBox = document.createElement('div');
    infoBox.className = 'info-box';
    infoBox.innerHTML = `<h3>Details</h3><p><b>X:</b> --</p><p><b>Y:</b> --</p>`;

    const markedLocations = [];
    let tempMarker = null;

    // Draw map and markers
    function drawMap(image) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        markedLocations.forEach(loc => drawMarker(ctx, loc.x, loc.y, loc.category));
        if (tempMarker) drawMarker(ctx, tempMarker.x, tempMarker.y, tempMarker.category);
    }

    function drawMarker(ctx, x, y, category) {
        let color = 'black';
        if (category === 'critical') color = 'red';
        else if (category === 'non-critical') color = 'blue';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2*Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.closePath();
    }

    function getMousePos(event) {
        const rect = canvas.getBoundingClientRect();
        return { x: Math.floor(event.clientX - rect.left), y: Math.floor(event.clientY - rect.top) };
    }

    function showDefaultInfoBox(x, y) {
        infoBox.innerHTML = `<h3>Details</h3><p><b>X:</b> ${x || '--'}</p><p><b>Y:</b> ${y || '--'}</p>`;
    }

    // Show input form for new location
    function showInputForm(x, y) {
        infoBox.innerHTML = `
            <h3>Mark Location</h3>
            <form id="location-form-${id}">
                <p><b>X:</b> ${x}</p>
                <p><b>Y:</b> ${y}</p>
                <label for="category">Category:</label><br>
                <select id="category" name="category" class="w-full text-black rounded p-2 mt-1 mb-2">
                    <option value="unspecified">Unspecified</option>
                    <option value="critical">Critical</option>
                    <option value="non-critical">Non-Critical</option>
                </select>
                <label for="details">Details:</label><br>
                <textarea id="details" name="details" rows="4" cols="25" class="w-full text-black rounded p-2 mt-1 mb-2"></textarea><br>
                <div class="flex gap-2">
                    <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded">Save</button>
                    <button type="button" id="cancel-btn-${id}" class="bg-red-500 text-white px-4 py-2 rounded">Cancel</button>
                </div>
            </form>
        `;

        document.getElementById(`location-form-${id}`).addEventListener('submit', function(event) {
            event.preventDefault();
            const details = document.getElementById('details').value;
            const category = document.getElementById('category').value;

            submitMapLocation({ x: tempMarker.x, y: tempMarker.y, category, details, map_id: id });

            markedLocations.push({ x: tempMarker.x, y: tempMarker.y, category, details });
            tempMarker = null;
            drawMap(mapImage);
            showDefaultInfoBox();
        });

        document.getElementById(`cancel-btn-${id}`).addEventListener('click', function() {
            tempMarker = null;
            drawMap(mapImage);
            showDefaultInfoBox();
        });
    }

    function showSavedDetails(location) {
        infoBox.innerHTML = `
            <h3>Saved Location</h3>
            <p><b>Category:</b> ${location.category}</p>
            <p><b>X:</b> ${location.x}</p>
            <p><b>Y:</b> ${location.y}</p>
            <p><b>Details:</b></p>
            <p>${location.details}</p>
        `;
    }

    mapDisplayContainer.appendChild(canvas);
    mapDisplayContainer.appendChild(infoBox);
    mapSection.appendChild(heading);
    mapSection.appendChild(instruction);
    mapSection.appendChild(mapDisplayContainer);
    container.appendChild(mapSection);

    const mapImage = new Image();
    mapImage.src = imageUrl;

    mapImage.onload = function() {
        drawMap(mapImage);
        loadSavedLocations(id, markedLocations, drawMap, mapImage);
    };

    mapImage.onerror = function() {
        console.error("Error loading image from URL: " + imageUrl);
        infoBox.innerHTML = '<h3>Error</h3><p>Image failed to load.</p>';
    };

    canvas.addEventListener('mousemove', function(event) {
        const pos = getMousePos(event);
        if (!tempMarker) showDefaultInfoBox(pos.x, pos.y);
    });

    canvas.addEventListener('mouseout', function() {
        if (!tempMarker) showDefaultInfoBox();
    });

    canvas.addEventListener('click', function(event) {
        const pos = getMousePos(event);

        const clickedLocation = markedLocations.find(loc => {
            const distance = Math.sqrt(Math.pow(pos.x - loc.x, 2) + Math.pow(pos.y - loc.y, 2));
            return distance < 10;
        });

        if (clickedLocation) {
            showSavedDetails(clickedLocation);
        } else if (!tempMarker) {
            tempMarker = { x: pos.x, y: pos.y, category: 'unspecified' };
            drawMap(mapImage);
            showInputForm(pos.x, pos.y);
        }
    });
}
