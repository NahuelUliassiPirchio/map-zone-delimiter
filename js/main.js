const points = []

const groupInput = document.getElementById('group-input')

function actualizarSidebar() {
    const sidebar = document.getElementById('points-container');
    sidebar.innerHTML = points.map(point => `<li>${point.group},${point.latlng.lat},${point.latlng.lng}</li>`).join('');
}
const map = window.L.map('map').setView([-34.626056, -58.496659], 12);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

map.on('click', event => {
    console.log(event.latlng)
    points.push({
        latlng: event.latlng,
        group: groupInput.value || 'group1'
    })
    L.marker(event.latlng).addTo(map);
    actualizarSidebar()
})