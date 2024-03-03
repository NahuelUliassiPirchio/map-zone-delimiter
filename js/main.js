function generateUniqueId() {
    const timestamp = new Date().getTime();
    const randomNum = Math.floor(Math.random() * 1000);

    return `${timestamp}${randomNum}`;
}

function calcularProductoVectorial(p1, p2, p3) {
    return (p2.lng - p1.lng) * (p3.lat - p2.lat) - (p2.lat - p1.lat) * (p3.lng - p2.lng);
}

function distanciaEntrePuntos(p1, p2) {
    const deltaX = p2.lng - p1.lng;
    const deltaY = p2.lat - p1.lat;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
}

function jarvisMarch(puntos) {
    if (puntos.length < 3) {
        // No se pueden formar polígonos con menos de 3 puntos
        return puntos;
    }

    // Encontrar el punto con la coordenada y más baja (y mínimo)
    let puntoInicial = puntos.reduce((min, punto) => (punto.lat < min.lat ? punto : min), puntos[0]);

    let result = [puntoInicial];
    let puntoActual = puntoInicial;

    do {
        let siguientePunto = puntos[0];

        for (let i = 1; i < puntos.length; i++) {
            if (puntos[i] === puntoActual) continue;

            let direccion = calcularProductoVectorial(puntoActual, siguientePunto, puntos[i]);
            if (
                !siguientePunto || direccion > 0 ||
                (direccion === 0 && distanciaEntrePuntos(puntoActual, puntos[i]) > distanciaEntrePuntos(puntoActual, siguientePunto))
            ) {
                siguientePunto = puntos[i];
            }
        }

        result.push(siguientePunto);
        puntoActual = siguientePunto;
    } while (puntoActual !== puntoInicial);

    return result;
}


class Point {
    constructor(latlng, group, id) {
        this.latlng = latlng
        this.group = group
        this.id = id
    }

    generateCircleMarker() {
        return L.circleMarker(this.latlng,{
            color: this.group.color,
            radius: 5,
            fillOpacity: 1
        })
    }
}

class Zone {
    constructor(name, isActive, color) {
        this.name = name
        this.isActive = isActive
        this.color = color || generateRandomHexColor()
    }

    static getZona(zones, zoneName){
        let mainZone
        mainZone = zones.filter(zone => zone.name === zoneName)[0]
        if(mainZone) return mainZone 
        mainZone = new Zone(zoneName, false)
        zones.push(mainZone)
        return mainZone
    }

    static orderPolygonCoordinates(coordinates) {
        return jarvisMarch(coordinates)
    }

    getGroupPoints(allPoints){
        return allPoints.filter(point => point.group.name === this.name)
    }

    generatePolygon(allPoints) {
        const latlngs = this.getGroupPoints(allPoints).map(point => point.latlng)
        console.log(latlngs)
        return L.polygon(Zone.orderPolygonCoordinates(latlngs), {color: this.color})
    }
}

let polygons = []
let points = []
let circleMarkers = []
const groups = [new Zone(generateRandomName(), true, generateRandomHexColor())]

const sidebar = document.getElementById('points-container')
const groupsContainer = document.getElementById('group-buttons')

const map = window.L.map('map').setView([-34.626056, -58.496659], 12)
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map)

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
    let pointsString = 'data:text/csvcharset=utf-8,\nLocation,Latitud,Longitud\n'
    pointsString += points.map(point => `${point.group.name},${point.latlng.lat},${point.latlng.lng}`).join('\n')
    
    var encodedUri = encodeURI(pointsString)
    var link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "my_data.csv")
    document.body.appendChild(link)

    link.click()
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
            marker.on('click', event => {
                L.DomEvent.stopPropagation(event)
                const pointListItem= document.getElementById(id)
                pointListItem.scrollIntoView()
                pointListItem.style.backgroundColor = 'red'
        
                const blinkInterval = setInterval(() => {
                    pointListItem.style.backgroundColor = (pointListItem.style.backgroundColor === 'red') ? 'transparent' : 'red'
                }, 500)
        
                setTimeout(() => {
                    clearInterval(blinkInterval)
                    pointListItem.style.backgroundColor = 'initial'
                }, 1000)
            })
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
    sidebar.innerHTML = ''

    points.forEach(point => {
        const li = document.createElement('li')
        li.className = 'point-list-item'
        li.id = point.id

        const groupFlag = document.createElement('div')
        groupFlag.className = 'group-flag'
        groupFlag.innerText = ''
        groupFlag.style.backgroundColor = point.group.color
        li.appendChild(groupFlag)
        
        const liText = document.createTextNode(`${point.group.name}, ${point.latlng.lat.toFixed(5)}, ${point.latlng.lng.toFixed(5)}`)
        li.appendChild(liText)

        const deleteButton = document.createElement('button')
        deleteButton.innerHTML = '❌'
        deleteButton.addEventListener('click', event => {
            points = points.filter(deletedPoint => point.id !== deletedPoint.id)
            const pointGroup = point.group
            const polygonIndex = polygons.findIndex(polygon => polygon.name !== pointGroup.name)

            if(polygonIndex > -1) {
                console.log(map.hasLayer(polygons[polygonIndex].polygon))
                map.removeLayer(polygons[polygonIndex].polygon)
                polygons.splice(polygonIndex,1)
            }

            id = generateUniqueId()
            const polygon = pointGroup.generatePolygon(points)
            polygons.push({
                group: pointGroup.name, /// mmm
                id,
                polygon
            })

            polygon.addTo(map)
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
    
    const id = generateUniqueId()
    const newPoint = new Point(event.latlng, activeGroup, id)
    points.push(newPoint)
    
    const polygonIndex = polygons.findIndex(deletedPolygon => deletedPolygon.group == activeGroup.name)
    
    if(polygonIndex > -1) {
        console.log(map.hasLayer(polygons[polygonIndex].polygon))
        map.removeLayer(polygons[polygonIndex].polygon)
        polygons.splice(polygonIndex,1)
    }
    polygons = polygons.filter(deletedPolygon => deletedPolygon.group !== activeGroup.name)

    const polygon = activeGroup.generatePolygon(points)
    polygon.addTo(map)
    polygons.push({
        group: activeGroup.name, /// mmm
        id,
        polygon
    })

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
            group.name = newName
        }
    })

    changePointGroup(groupName, newName)
    updateSidebar()
}

function changePointGroup(groupName, newName) {
    points.forEach(point => {
        if (point.group.name === groupName) {
            point.group.name = newName
        }
    })
}

function generateRandomName() {
    const adjectives = ["Red", "Blue", "Green", "Yellow", "Purple", "Orange"]
    const nouns = ["Elephant", "Lion", "Tiger", "Giraffe", "Zebra", "Kangaroo"]

    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)]

    const timestamp = new Date().getTime()
    const shortTimestamp = timestamp.toString().slice(-4)

    return `${randomAdjective}${randomNoun}${shortTimestamp}`
}

function generateRandomHexColor() {
    const red = Math.floor(Math.random() * 256)
    const green = Math.floor(Math.random() * 256)
    const blue = Math.floor(Math.random() * 256)

    const hexColor = `#${red.toString(16)}${green.toString(16)}${blue.toString(16)}`

    return hexColor
}