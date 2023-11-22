import axios from 'axios';
import _ from 'lodash';

// Grabs all teams and gets their names and ids to be used later
const getTeams = async () => {
  const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams`;
  const res = await axios.get(url);
  const { data } = res;

  const teamsArr = data?.sports[0]?.leagues[0]?.teams;
  const teams = teamsArr.map(
    (teamObj: { team: { id: string; slug: string } }) => {
      return {
        id: teamObj.team.id,
        name: teamObj.team.slug,
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
const transformRoster = (rawRoster) => {};

// Writes roster to a json file
const writeRosterToJsonFile = async (id, name, officialRoster) => {};

const generateOfficialRosterJson = async (team: {
  id: string;
  name: string;
}) => {
  const { id, name } = team;

  const rawRosterData = await fetchRoster(id);
  const officialRoster = await transformRoster(rawRosterData);
  await writeRosterToJsonFile(id, name, officialRoster);
};

const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const main = async () => {
  const teams = await getTeams();

  for (const team of teams) {
    await sleep(1000);
    await generateOfficialRosterJson(team);
  }
};

main();
