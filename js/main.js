const DEFAULT_RADIUS = 5

class Point {
    constructor({latlng, group, id, radius, type}) {
        this.latlng = latlng;
        this.group = group;
        this.id = id
        this.radius = radius || DEFAULT_RADIUS
        this.type = type
    }

    generateCircleMarker() {
        console.log(this.type)
        console.log(this.radius)
        return this.type === 'radius' ? L.circle(this.latlng, {
            color: this.group.color,
            radius: this.radius,
            fillOpacity: .5
        }):L.circleMarker(this.latlng,{
            color: this.group.color,
            radius: DEFAULT_RADIUS,
            fillOpacity: 1
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

    static orderPolygonCoordinates(coordinates) {
        return jarvisMarch(coordinates)
    }

    getGroupPoints(allPoints){
        return allPoints.filter(point => point.group.name === this.name)
    }

    generatePolygon(allPoints) {
        const latlngs = this.getGroupPoints(allPoints).map(point => point.latlng)
        return L.polygon(Zone.orderPolygonCoordinates(latlngs), {color: this.color})
    }
}

let polygons = []
let points = [];
let circleMarkers = [];
const groups = []
groups.push(new Zone(generateRandomName(), true, generateRandomHexColor()))

const sidebar = document.getElementById('points-container');
const groupsContainer = document.getElementById('group-buttons')
const buttonTypeSelect = document.getElementById('button-type')

const map = window.L.map('map').setView([-34.626056, -58.496659], 12)
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map)
function updateGroups() {
    groupsContainer.innerHTML = ''
    groups.map(group => {
        const groupButton = document.createElement('button')
        groupButton.textContent = group.name
        groupButton.style.borderColor = group.color
        groupButton.addEventListener('click', e => {
            setGroupActive(group)
        })
        const editGroupColor = document.createElement('button')
        editGroupColor.textContent = '🎨'
        editGroupColor.title = 'Change group color'
        editGroupColor.addEventListener('click', () => {
            const colorPicker = document.createElement('input');
            colorPicker.type = 'color';
            colorPicker.style.position = 'absolute';
            colorPicker.style.visibility = 'hidden';
            document.body.appendChild(colorPicker);
        
            colorPicker.click();
        
            colorPicker.addEventListener('input', () => {
                const newColor = colorPicker.value;
        
                group.color = newColor;
        
                const groupIndex = groups.findIndex(g => g.name === group.name);
        
                if (groupIndex !== -1) {
                    groups[groupIndex] = group;

                    const pointsFromGroup = points.filter(point => point.group.name === group.name)
                    pointsFromGroup.forEach(point => {
                        const markerIndex = circleMarkers.findIndex(marker => marker.id === point.id);
                        if (markerIndex !== -1) {
                            map.removeLayer(circleMarkers[markerIndex].marker);
                            circleMarkers.splice(markerIndex, 1);
                        }
                    })
        
                    updateGroups()
                    updateSidebar()
                    updatePolygons(group)

                    pointsFromGroup.forEach(point => {
                        const marker = point.generateCircleMarker()
                        marker.on('click', event => {
                            L.DomEvent.stopPropagation(event);
                            const pointListItem = document.getElementById(point.id)
                            pointListItem.scrollIntoView()
                            pointListItem.style.backgroundColor = 'red'
                    
                            const blinkInterval = setInterval(() => {
                                pointListItem.style.backgroundColor = (pointListItem.style.backgroundColor === 'red') ? 'transparent' : 'red';
                            }, 500);
                    
                            setTimeout(() => {
                                clearInterval(blinkInterval);
                                pointListItem.style.backgroundColor = 'initial';
                            }, 1000);
                        })
                        circleMarkers.push({
                            id:point.id,
                            marker
                        })
                        marker.addTo(map)
                    })

                    updateVoronoi();
                }
        
                document.body.removeChild(colorPicker);
            });
        });
        const editGroup = document.createElement('button')
        editGroup.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <path fill="none" d="M0 0h24v24H0z"/>
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.41-1.41L14.06 7.19l1.41 1.41L6.83 17.25H5.41v-1.41zm14.73-7.34c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
        </svg>
        `
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
        groupsContainer.appendChild(editGroupColor)
        groupsContainer.appendChild(editGroup)
    })
}
updateGroups()

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
        return puntos;
    }

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

function updateVoronoi() {
    voronoiLayer.clearLayers();

    const bounds = map.getBounds();
    const minLng = bounds.getWest();
    const minLat = bounds.getSouth();
    const maxLng = bounds.getEast();
    const maxLat = bounds.getNorth();

    const abstractAreaPoints = points.filter(p => p.type === 'abstract-area')
    const pointsForVoronoi = abstractAreaPoints.map(p => [p.latlng.lng, p.latlng.lat]);

    const delaunay = d3.Delaunay.from(pointsForVoronoi);
    const voronoi = delaunay.voronoi([minLng, minLat, maxLng, maxLat]);

    for (let i = 0; i < abstractAreaPoints.length; i++) {
        const cell = voronoi.cellPolygon(i);
        if (cell) {
            const polygon = L.polygon(cell.map(point => [point[1], point[0]]), {
                color: abstractAreaPoints[i].group.color,
                fillColor: abstractAreaPoints[i].group.color,
                fillOpacity: 0.5,
                weight: 2
            });
            voronoiLayer.addLayer(polygon);
        }
    }
}


const newGroupButton = document.getElementById('new-group')
newGroupButton.addEventListener('click', e => {
    const newGroupName = generateRandomName()
    groups.push(new Zone(newGroupName, true, generateRandomHexColor()))
    setGroupActive({name:newGroupName})
    updateGroups()
})

const exportAsCsvButton = document.getElementById('export-csv')
exportAsCsvButton.addEventListener('click', () => {
    const csvContent = prepareCsvContent(points);
    triggerCsvDownload(csvContent);
});

function prepareCsvContent(points) {
    const includeRadius = points.some(p => p.type === 'radius');
    let csvHeader = includeRadius ? 'Group,Latitud,Longitud,Point-Type,Radius\n' : 'Group,Latitud,Longitud,Point-Type\n';
    let csvRows = points.map(point => {
        return point.type === 'radius' ?
            `${point.group.name},${point.latlng.lat},${point.latlng.lng},${point.type},${point.radius}` :
            `${point.group.name},${point.latlng.lat},${point.latlng.lng},${point.type}${includeRadius ? ',' : ''}`;
    }).join('\n');

    return `data:text/csv;charset=utf-8,${csvHeader}${csvRows}`;
}

function triggerCsvDownload(csvContent) {
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "my_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


const importCsvButton = document.getElementById('import-csv')
importCsvButton.addEventListener('change', () => {
    const reader = new FileReader()
    let polygonGroups = []
    reader.onload = () => {
        reader.result.split('\n').forEach((result, index) => {
            if(index === 0 || index === 1) return
            const [location,lat,lng,type,radius] = result.split(',')
            
            const zona = Zone.getZona(groups,location)
            const latlng = L.latLng(lat, lng)
            const id = generateUniqueId()
            const newPoint = new Point({latlng, group: zona, id, type})
            if(radius) newPoint.radius = radius
            points.push(newPoint)

            if(type === 'polyline-area') polygonGroups.push(zona)
    
            const marker = newPoint.generateCircleMarker()
            marker.on('click', event => {
                L.DomEvent.stopPropagation(event);
                const pointListItem= document.getElementById(id)
                pointListItem.scrollIntoView()
                pointListItem.style.backgroundColor = 'red'
        
                const blinkInterval = setInterval(() => {
                    pointListItem.style.backgroundColor = (pointListItem.style.backgroundColor === 'red') ? 'transparent' : 'red';
                }, 500);
        
                setTimeout(() => {
                    clearInterval(blinkInterval);
                    pointListItem.style.backgroundColor = 'initial';
                }, 1000);
            })
            circleMarkers.push({
                id,
                marker
            })
            marker.addTo(map)
        })
        updateGroups()
        polygonGroups = Array.from(new Map(polygonGroups.map(group => [group.name, group])).values());
        polygonGroups.forEach(group => updatePolygons(group))
        updateVoronoi()
        updateSidebar()
    }
    reader.readAsBinaryString(importCsvButton.files[0])
})

function updateSidebar() {
    sidebar.innerHTML = '';

    points.forEach(point => {
        const li = document.createElement('li');
        li.className = 'point-list-item';
        li.id = point.id;
        
        const groupFlag = document.createElement('div');
        groupFlag.className = 'group-flag';
        groupFlag.innerText = '';
        groupFlag.title = point.group.name
        groupFlag.style.backgroundColor = point.group.color;
        li.appendChild(groupFlag);
        
        const pointDetails = document.createElement('div');
        pointDetails.className = 'point-details';
        const liText = document.createTextNode(`${point.group.name}, ${point.latlng.lat.toFixed(5)}, ${point.latlng.lng.toFixed(5)}`);
        pointDetails.appendChild(liText);
        li.appendChild(pointDetails);
        
        if(point.type === 'radius') {
            const radiusSlider = document.createElement('input');
            radiusSlider.type = 'range';
            radiusSlider.min = Math.max(0, point.radius - 60).toString();
            radiusSlider.max = (point.radius + 60).toString();
            radiusSlider.value = point.radius;
            radiusSlider.addEventListener('change', e => {
                const newRadius = parseInt(e.target.value);
                point.radius = newRadius;
                const markerIndex = circleMarkers.findIndex(marker => marker.id === point.id);
                if (markerIndex !== -1) {
                    circleMarkers[markerIndex].marker.setRadius(newRadius);
                }
                updateSidebar();
            });
            pointDetails.appendChild(radiusSlider);
            
            const radiusLabel = document.createElement('span');
            radiusLabel.textContent = `Radius: ${point.radius}`;
            pointDetails.appendChild(radiusLabel);
        }

        const pointButtons = document.createElement('div');
        pointButtons.className = 'point-buttons';

        const flyToButton = document.createElement('button');
        flyToButton.innerHTML = `<svg width="16px" height="16px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <g fill="none" stroke="black" stroke-width="2">
                <circle cx="12" cy="12" r="4"/>
                <line x1="12" y1="2" x2="12" y2="6"/>
                <line x1="12" y1="18" x2="12" y2="22"/>
                <line x1="2" y1="12" x2="6" y2="12"/>
                <line x1="18" y1="12" x2="22" y2="12"/>
            </g>
        </svg>`;
        flyToButton.className = 'fly-to-button'
        flyToButton.title = 'Center to this point'
        flyToButton.addEventListener('click', () => {
            map.flyTo(point.latlng, 15);
        });
        pointButtons.appendChild(flyToButton);

        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <path fill="none" d="M0 0h24v24H0z"/>
            <path d="M3 6h18v2H3V6zm2 3h14v13c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V9zm3 0v11h2V9H8zm4 0v11h2V9h-2zm4 0v11h2V9h-2zM8.5 4l1-1h5l1 1H20v2H4V4h4.5z"/>
        </svg>`;
        deleteButton.title = 'Delete point'
        deleteButton.addEventListener('click', () => {
            points = points.filter(deletedPoint => point.id !== deletedPoint.id);

            const markerIndex = circleMarkers.findIndex(marker => marker.id === point.id);
            if (markerIndex !== -1) {
                map.removeLayer(circleMarkers[markerIndex].marker);
                circleMarkers.splice(markerIndex, 1);
            }
            if(point.type === 'abstract-area') updateVoronoi();
            else if (point.type === 'polyline-area') updatePolygons(point.group);
            updateSidebar();
        });

        pointButtons.appendChild(deleteButton);
        li.appendChild(pointButtons);
        sidebar.appendChild(li);
    });
}


let voronoiLayer = L.layerGroup().addTo(map);

function updatePolygons(pointGroup) {
    const polygonIndex = polygons.findIndex(polygon => polygon.group == pointGroup.name)

    if(polygonIndex > -1) {
        map.removeLayer(polygons[polygonIndex].polygon)
        polygons.splice(polygonIndex,1)
    }

    id = generateUniqueId()
    const polygon = pointGroup.generatePolygon(points.filter(p => p.type === 'polyline-area'))
    polygons.push({
        group: pointGroup.name,
        id,
        polygon
    })

    polygon.addTo(map)
}

buttonTypeSelect.addEventListener('change', ()=> {
    const hasVoronoi = Object.values(voronoiLayer._layers).length > 0
    if(!hasVoronoi) map.off('moveend',updateVoronoi)
})


map.on('click', event => {
    const activeGroup = getActiveGroup();
    const id = generateUniqueId();
    
    const pointType = buttonTypeSelect.value
    const newPoint = new Point({latlng: event.latlng, group: activeGroup, id, type: pointType});
    points.push(newPoint);
    if(buttonTypeSelect.value == 'abstract-area') {
        map.on('moveend', updateVoronoi)
        updateVoronoi()
    } else if (buttonTypeSelect.value == 'polyline-area'){
        updatePolygons(newPoint.group)
    }
    updateSidebar();


    const marker = newPoint.generateCircleMarker();
    addMarkerToMap(marker, id);
});

function addMarkerToMap(marker, id) {
    marker.off('click').on('click', (markerEvent) => {
        L.DomEvent.stopPropagation(markerEvent);
        highlightPoint(id);
    });
    circleMarkers.push({
        id,
        marker
    });
    marker.addTo(map);
}

function highlightPoint(id) {
    const pointListItem = document.getElementById(id);
    pointListItem.scrollIntoView();
    pointListItem.style.backgroundColor = 'red';

    const blinkInterval = setInterval(() => {
        pointListItem.style.backgroundColor = (pointListItem.style.backgroundColor === 'red') ? 'transparent' : 'red';
    }, 500);

    setTimeout(() => {
        clearInterval(blinkInterval);
        pointListItem.style.backgroundColor = 'initial';
    }, 1000);
}

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

function hasAssignedPoints() {
    return points.length > 0;
}

window.addEventListener('beforeunload', function (event) {
    if (hasAssignedPoints()) {
        const message = 'You have unsaved changes. Are you sure you want to leave?';
        
        event.preventDefault();
        
        event.returnValue = message;
        
        return message;
    }
});

function generateRandomName() {
    const existingNames = groups.map(group => group.name)
    let name;
    do {
        const randomNumber = Math.floor(1000 + Math.random() * 9000); 
        name = `Section${randomNumber}`;
    } while (existingNames.some(existingName => existingName === name ));

    return name;
}

function generateRandomHexColor() {
    const red = Math.floor(Math.random() * 256);
    const green = Math.floor(Math.random() * 256);
    const blue = Math.floor(Math.random() * 256);

    const hexColor = `#${red.toString(16)}${green.toString(16)}${blue.toString(16)}`;

    return hexColor;
}