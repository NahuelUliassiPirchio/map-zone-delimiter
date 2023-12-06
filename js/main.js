class Point {
    constructor(latlng, group, id) {
        this.latlng = latlng;
        this.group = group;
        this.id = id
    }

    generateCircleMarker() {
        return L.circleMarker(this.latlng,{
            color: this.group.color,
            radius: 3
        });
    }
}

class Zone {
    constructor(name, isActive, color) {
        this.name = name;
        this.isActive = isActive;
        this.color = color || generateRandomHexColor();
    }

    static getZona(zones, zoneName){
        let mainZone;
        mainZone = zones.filter(zone => zone.name === zoneName)[0]
        if(mainZone) return mainZone 
        mainZone = new Zone(zoneName, false)
        zones.push(mainZone)
        return mainZone
    }
}

let points = [];
let circleMarkers = [];
const groups = [new Zone(generateRandomName(), true, generateRandomHexColor())];

const map = window.L.map('map').setView([-34.626056, -58.496659], 12)
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map)

const groupsContainer = document.getElementById('group-buttons')
updateGroups()

const newGroupButton = document.getElementById('new-group')
newGroupButton.addEventListener('click', e => {
    const newGroupName = generateRandomName()
    groups.push(new Zone(newGroupName, true, generateRandomHexColor()))
    setGroupActive({name:newGroupName})
    updateGroups()
})

const exportAsCsvButton = document.getElementById('export-csv')
exportAsCsvButton.addEventListener('click', () => {
    let pointsString = 'data:text/csv;charset=utf-8,\nLocation,Latitud,Longitud\n'
    pointsString += points.map(point => `${point.group.name},${point.latlng.lat},${point.latlng.lng}`).join('\n')
    
    var encodedUri = encodeURI(pointsString);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "my_data.csv");
    document.body.appendChild(link);

    link.click();
})

const importCsvButton = document.getElementById('import-csv')
importCsvButton.addEventListener('change', () => {
    const reader = new FileReader()
    reader.onload = () => {
        reader.result.split('\n').forEach((result, index) => {
            if(index === 0 || index === 1) return
            const [location,lat,lng] = result.split(',')
            const zona = Zone.getZona(groups,location)
            const latLng = L.latLng(lat, lng)
            const id = latLng.lat.toString().slice(-4) + Date.now().toString().slice(-4)
            const newPoint = new Point(latLng, zona, id)
            points.push(newPoint)
    
            const marker = newPoint.generateCircleMarker()
            circleMarkers.push({
                id,
                marker
            })
            marker.addTo(map)
        })
        updateGroups()
        updateSidebar()
    }
    reader.readAsBinaryString(importCsvButton.files[0])
})

function updateSidebar() {
    const sidebar = document.getElementById('points-container');
    sidebar.innerHTML = '';

    points.forEach(point => {
        const li = document.createElement('li')
        li.textContent = `${point.group.name},${point.latlng.lat},${point.latlng.lng}`
        li.addEventListener('dblclick', event => {
            console.log(point.id)
        })

        const deleteButton = document.createElement('button')
        deleteButton.innerHTML = '❌'
        deleteButton.addEventListener('click', event => {
            points = points.filter(deletedPoint => point.id !== deletedPoint.id);

            const markerIndex = circleMarkers.findIndex(marker => marker.id === point.id);
            if (markerIndex !== -1) {
                map.removeLayer(circleMarkers[markerIndex].marker);
                circleMarkers.splice(markerIndex, 1);
            }
            updateSidebar()
        })

        li.appendChild(deleteButton)
        sidebar.appendChild(li)
    })
}

function updateGroups() {
    groupsContainer.innerHTML = ''
    groups.map(group => {
        const groupButton = document.createElement('button')
        groupButton.textContent = group.name
        groupButton.style.borderColor = group.color
        groupButton.addEventListener('click', e => {
            setGroupActive(group)
        })
        const editGroup = document.createElement('button')
        editGroup.textContent = '✏️'
        editGroup.addEventListener('click', e => {
            const groupNameInput = document.createElement('input')
            groupNameInput.type = 'text'
            groupNameInput.value = group.name
            groupButton.innerHTML = ''
            groupNameInput.addEventListener('keydown', e => {
                if (e.key === "Enter") {
                    changeGroupName(group.name, groupNameInput.value)
                    groupButton.innerHTML = groupNameInput.value
                }
                else if (e.key === "Escape") groupButton.innerHTML = group.name
            })
            groupButton.appendChild(groupNameInput)
            groupNameInput.focus()
            groupNameInput.select()
        })
        groupsContainer.appendChild(groupButton)
        groupsContainer.appendChild(editGroup)
    })
}

map.on('click', event => {
    const activeGroup = getActiveGroup()
    
    const id = event.latlng.lat.toString().slice(-4) + Date.now().toString().slice(-4)
    const newPoint = new Point(event.latlng, activeGroup,id)
    points.push(newPoint)
    
    const marker = newPoint.generateCircleMarker()
    circleMarkers.push({
        id,
        marker
    })
    marker.addTo(map)

    updateSidebar()
})

function getActiveGroup() {
    return groups.filter(group => group.isActive)[0]
}

function setGroupActive(activeGroup){
    groups.forEach(group => group.isActive = group.name === activeGroup.name)
}

function changeGroupName(groupName, newName) {
    if(groups.filter(group => group.name === newName).length > 0) throw new Error('A group with that name already exists.')
    groups.forEach(group => {
        if (group.name === groupName) {
            group.name = newName;
        }
    });

    changePointGroup(groupName, newName)
    updateSidebar()
}

function changePointGroup(groupName, newName) {
    points.forEach(point => {
        if (point.group.name === groupName) {
            point.group.name = newName;
        }
    })
}

function generateRandomName() {
    const adjectives = ["Red", "Blue", "Green", "Yellow", "Purple", "Orange"];
    const nouns = ["Elephant", "Lion", "Tiger", "Giraffe", "Zebra", "Kangaroo"];

    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];

    const timestamp = new Date().getTime();
    const shortTimestamp = timestamp.toString().slice(-4);

    return `${randomAdjective}${randomNoun}${shortTimestamp}`;
}

function generateRandomHexColor() {
    const red = Math.floor(Math.random() * 256);
    const green = Math.floor(Math.random() * 256);
    const blue = Math.floor(Math.random() * 256);

    const hexColor = `#${red.toString(16)}${green.toString(16)}${blue.toString(16)}`;

    return hexColor;
}