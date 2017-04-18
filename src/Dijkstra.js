/**
 * Created by anniinasa on 13/04/17.
 */
var dataUtils = require('./state/DataUtils.js');
var R = require('ramda');

function addNeighbor(paths, neighbor, currShortest) {
  if(!(R.find((R.propEq('name', neighbor.name))))(currShortest)) {
    paths.push(currShortest.concat(neighbor))
  }
}

var runDijkstra = (clockIs,from, to) => {
  console.log('Searching for a route from ' + from + ' to ' + to)
  var nodes=dataUtils.connectedStations();
  if(!R.find(R.propEq('stationShortCode', from))(nodes)) {
    console.log('Ei löytynyt asemaa ' + from + '!')
    return;
  }
  if(!R.find(R.propEq('stationShortCode', to))(nodes)) {
    console.log('Ei löytynyt asemaa ' + to + '!')
    return;
  }
  var paths=[]
  var startStation={name: from, arrivalTime: clockIs, timeTo: 0}

  paths.push([startStation])
  while(true) {
    if(paths.length ==0) {
      console.log('Nothing found, this must be a mistake')
      return paths;
    }
    var distances=R.map(path => path[path.length-1].timeTo)(paths)
    var shortIndex=distances.indexOf(Math.min(...distances));
    var currShortest=paths[shortIndex]

    if(!currShortest) {
      debugger;
    }

    paths.splice(shortIndex, 1)
    var currentNode=currShortest[currShortest.length-1]
    if(currentNode.name==to) {
      debugger;
      currShortest.shift()
      return currShortest;
    }

    var neighbors=getNeighborsWithDistances(currentNode.arrivalTime, currentNode, currShortest[0].arrivalTime, to)
    neighbors=R.reject(train => (R.filter(R.propEq('name', train.name))(paths).length >0), neighbors)
    var lenss=R.lensProp('timeTo')
    //neighbors=R.map(train => R.set(lenss, (train.timeTo+(train.arrivalTime.unix()-currShortest[0].arrivalTime.unix())), train))(neighbors)
    R.forEach(neighbor=>addNeighbor(paths, neighbor, currShortest))(neighbors)

  }

}

function getNeighborsWithDistances(clockIs, currentNode, startTime,to) {
  var trains=dataUtils.trainsLeavingFrom(clockIs, currentNode.name)
  var lenss = R.lensProp('timeTableRows')
  var filteredTrains=R.map(train => R.set(lenss, R.filter(R.propEq('type', 'ARRIVAL'),train.timeTableRows),train))(trains);
  filteredTrains=R.map(train => R.set(lenss, R.filter(R.propEq('trainStopping', true),train.timeTableRows),train))(filteredTrains);
  var neighbors=[]
  for(i=0; i < filteredTrains.length; i++) {
    var found=R.find(R.propEq('stationShortCode', to),filteredTrains[i].timeTableRows)
    var foundInd=filteredTrains[i].timeTableRows.length -1;
    if(found) {
      foundInd=filteredTrains[i].timeTableRows.indexOf(found)
    }
    var firstStation=filteredTrains[i].timeTableRows[foundInd]
    if(firstStation.scheduledTime.unix() < clockIs.unix()) {
      firstStation=R.reject(row => row.scheduledTime.unix() < clockIs.unix(),filteredTrains[i].timeTableRows)[filteredTrains[i].timeTableRows.length -1]
    }

    if(!firstStation) {
      continue;
    }
    if(firstStation.name==to) {
      debugger;
    }
    var arrival=firstStation.scheduledTime
    var number=filteredTrains[i].trainNumber
    var weight=arrival.unix()-startTime.unix()

    var tobe={trainNumber: number, arrivalTime: arrival, timeTo: weight, name: firstStation.stationShortCode}
    var found=R.filter(R.propEq('name',tobe.name), neighbors)
    if(found.length > 0) {
      if(found[0].timeTo > tobe.timeTo) {
        neighbors=R.reject(R.propEq('trainNumber', found[0].trainNumber), neighbors)
        neighbors.push(tobe)
      }
    }
    if(found.length ==0 && tobe.timeTo >= 0 && tobe.name != currentNode.name){
      neighbors.push(tobe)
    }

  }
  if(neighbors.length ==0) {
    debugger;
  }
  console.log(neighbors.length)
  //debugger;
  return neighbors
}

module.exports = {
  run: runDijkstra
}
