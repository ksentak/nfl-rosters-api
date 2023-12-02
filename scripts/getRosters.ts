import axios from 'axios';
import _ from 'lodash';
import { MongoClient } from 'mongodb';
import 'dotenv/config';

const uri = process.env.DB_URI || '';
const client = new MongoClient(uri);

const dbName = 'nfl-players-api';
const collectionName = 'players';

// Connect to db
const connectToMongo = async () => {
  try {
    await client.connect();
    console.log('Connected successfully to MongoDB server');
  } catch (e) {
    console.error('Connection to MongoDB failed', e);
  }
};

// Create team index
const createTeamNameIndex = async () => {
  try {
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Create an index on the "teamName" field
    await collection.createIndex({ teamName: 1 }); // 1 for ascending order

    console.log('Index created on teamName');
  } catch (error) {
    console.error('Error creating index:', error);
  }
};

// ==============================================

// Grabs all teams and gets their names and ids to be used later
const getTeams = async () => {
  const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams`;
  const res = await axios.get(url);
  const { data } = res;

  const teamsArr = data?.sports[0]?.leagues[0]?.teams;
  const teams = teamsArr.map(
    (teamObj: { team: { id: string; name: string } }) => {
      return {
        id: teamObj.team.id,
        name: teamObj.team.name,
      };
    },
  );

  return teams;
};

// Grabs the roster of an individual team and returns it
const fetchRoster = async (id: string) => {
  const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${id}/roster`;
  const res = await axios.get(url);
  const { data } = res;
  const rawRoster = data?.athletes;

  return rawRoster;
};

// First combine arrays of offense, defense, and special teams
// Then extract only the data we want
const transformRoster = (
  rawRoster: any[],
  teamId: string,
  teamName: string,
) => {
  const transformedRoster = _.flatMap(rawRoster, (positionGroup) =>
    positionGroup.items.map(
      (player: { position: any; experience: any; college: any }) => ({
        _id: _.get(player, 'id'),
        number: _.get(player, 'jersey', 'N/A'),
        positionGroup: _.get(positionGroup, 'position'),
        first_name: _.get(player, 'firstName'),
        last_name: _.get(player, 'lastName'),
        position: _.lowerCase(_.get(player.position, 'abbreviation')),
        height: _.get(player, 'displayHeight'),
        weight: _.toString(_.get(player, 'weight')),
        age: _.toString(_.get(player, 'age')),
        years_pro: _.toString(_.get(player.experience, 'years')),
        college: _.get(player.college, 'shortName', 'N/A'),
        teamId,
        teamName,
      }),
    ),
  );

  return transformedRoster;
};

// Writes roster to a json file
const writeRosterToMongoDb = async (officialRoster: any[]) => {
  const db = client.db(dbName);
  const collection = db.collection(collectionName);

  await collection.insertMany(officialRoster);
};

const generateOfficialRoster = async (team: { id: string; name: string }) => {
  const { id, name } = team;

  const rawRosterData = await fetchRoster(id);
  const officialRoster = await transformRoster(rawRosterData, id, name);
  await writeRosterToMongoDb(officialRoster);
};

const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const main = async () => {
  await connectToMongo();
  await client.db(dbName).collection(collectionName).drop();
  await createTeamNameIndex();

  const teams = await getTeams();

  for (const team of teams) {
    await sleep(500);
    await generateOfficialRoster(team);
  }
  await client.close();
};

main();
