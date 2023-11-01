const map = window.L.map('map').setView([-34.626056, -58.496659], 12);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

map.on('click', event => {
    L.marker(event.latlng).addTo(map);
})