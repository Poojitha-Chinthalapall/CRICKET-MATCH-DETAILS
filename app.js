const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const dbpath = path.join(__dirname, 'cricketMatchDetails.db')

const app = express()

app.use(express.json())

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () =>
      console.log('Server is Running at http://localhost:3000/'),
    )
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const convertPlayerDbObjectToResponseObject = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}

const convertMatchDetailsDbObjectToResponseObject = dbObject => {
  return {
    matchID: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  }
}

app.get('/players/', async (request, response) => {
  const getPlayersList = `
    SELECT * 
    FROM
    player_details;`
  const playersArray = await db.all(getPlayersList)
  response.send(
    playersArray.map(eachPlayer =>
      convertPlayerDbObjectToResponseObject(eachPlayer),
    ),
  )
})

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayer = `
    SELECT *
    FROM
    player_details
    WHERE
    player_id = ${playerId};`
  const newPlayer = await db.get(getPlayer)
  response.send(convertPlayerDbObjectToResponseObject(newPlayer))
})

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body
  const updatePlayerQuery = `
    UPDATE 
      player_details
      SET
      player_name = ${playerName}
      WHERE 
      player_id = ${playerId};`
  await db.run(updatePlayerQuery)
  response.send('Player Details Updated')
})

app.get('/matches/:matchId', async (request, response) => {
  const {matchID} = request.params
  const matchDetailsQuery = `
    SELECT *
    FROM
    match_details
    WHERE
    match_id=${matchID};`
  const matchDetails = await db.get(matchDetailsQuery)
  response.send(convertMatchDetailsDbObjectToResponseObject(matchDetails))
})

app.get('/players/:playerId/matches/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerMatchQuery = `
    SELECT *
    FROM player_match_score
    NATURAL JOIN match_details
    WHERE
    player_id = ${playerId};`
  const playerMatches = await db.all(getPlayerMatchQuery)
  response.send(
    playerMatches.map(eachMatch =>
      convertMatchDetailsDbObjectToResponseObject(eachMatch),
    ),
  )
})

app.get('/matches/:matchId/players/', async (request, response) => {
  const {matchID} = request.params
  const getMatchPlayersQuery = `
    SELECT *
    FROM
    player_match_score
    NATURAL JOIN 
    player_details
    WHERE 
    match_id = ${matchID};`
  const playersArray = await db.all(getMatchPlayersQuery)
  response.send(
    playersArray.map(eachPlayer =>
      convertPlayerDbObjectToResponseObject(eachPlayer),
    ),
  )
})

app.get('/players/:playerId/playerScores/', async (request, response) => {
  const {playerId} = request.params
  const getMatchPlayersQuery = `
    SELECT 
    player_id AS playerId,
    player_name AS playerName,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes
    FROM player_match_score
    NATURAL JOIN player_details
    WHERE 
    player_id = ${playerId};`
  const playerMatchDetails = await db.get(getMatchPlayersQuery)
  response.send(playerMatchDetails)
})

module.exports = app
