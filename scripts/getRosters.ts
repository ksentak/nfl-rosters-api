import axios from 'axios';
import _ from 'lodash';

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

  console.log(teams);
  return teams;
};

const main = async () => {
  await getTeams();
};

main();
