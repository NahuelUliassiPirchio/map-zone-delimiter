let points = []
let circleMarkers = []

const groups = [
    {
        name: generateRandomName(),
        isActive: true,
        color: generateRandomHexColor()
    }
]

const map = window.L.map('map').setView([-34.626056, -58.496659], 12)
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map)

const groupsContainer = document.getElementById('group-buttons')
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

const newGroupButton = document.getElementById('new-group')
newGroupButton.addEventListener('click', e => {
    const newGroupName = generateRandomName()
    groups.push({
        name: newGroupName,
        isActive: true,
        color: generateRandomHexColor()
    })
    setGroupActive({name:newGroupName})
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
})

const copyToClipboardButton = document.getElementById('copy-to-clipboard')
copyToClipboardButton.addEventListener('click', event => {
    let pointsString = 'Location, Latitud, Longitud\n'
    pointsString += points.map(point => `${point.group}, ${point.latlng.lat}, ${point.latlng.lng}`).join('\n')
    navigator.clipboard.writeText(pointsString)
    alert('Copied to clipboard as csv')
})

function actualizarSidebar() {
    const sidebar = document.getElementById('points-container');
    sidebar.innerHTML = '';

    points.forEach(point => {
    const li = document.createElement('li')
    li.textContent = `${point.group}, ${point.latlng.lat}, ${point.latlng.lng}`
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
        actualizarSidebar()
    })

    li.appendChild(deleteButton)
    sidebar.appendChild(li)
    })
}

map.on('click', event => {
    const activeGroup = getActiveGroup()
    const id = event.latlng.lat.toString().slice(-4) + Date.now().toString().slice(-4)
    points.push({
        latlng: event.latlng,
        group: activeGroup.name,
        id
    })
    const circleMarker = L.circleMarker(event.latlng,{
        color: activeGroup.color,
        radius: 3
    });
    circleMarkers.push({
        id,
        marker: circleMarker
    })
    circleMarker.addTo(map)
    actualizarSidebar()
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
    actualizarSidebar()
}

function changePointGroup(groupName, newName) {
    points.forEach(point => {
        if (point.group === groupName) {
            point.group = newName;
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