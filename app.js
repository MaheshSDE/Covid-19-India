const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server is Running at http://localhost:3001/");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//API-1
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT * FROM state;
    `;
  const statesArray = await db.all(getStatesQuery);
  const ans = (object) => {
    return {
      stateId: object.state_id,
      stateName: object.state_name,
      population: object.population,
    };
  };

  response.send(statesArray.map((eachItem) => ans(eachItem)));
});

//API-2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT * FROM state WHERE state_id=${stateId}
    `;
  const state = await db.get(getStateQuery);
  response.send({
    stateId: state.state_id,
    stateName: state.state_name,
    population: state.population,
  });
});

//API-3
app.post("/districts/", async (request, response) => {
  const bookDetails = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = bookDetails;
  const addDistrictQuery = `
  INSERT INTO district(district_name,state_id,cases,cured,active,deaths)
  VALUES('${districtName}',${stateId},${cases},${cured},${active},${deaths})
  `;
  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

//API-4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT * FROM district WHERE district_id=${districtId};`;
  const district = await db.get(getDistrictQuery);
  const object = {
    districtId: district.district_id,
    districtName: district.district_name,
    stateId: district.state_id,
    cases: district.cases,
    cured: district.cured,
    active: district.active,
    deaths: district.deaths,
  };
  console.log(district);
  response.send(object);
});

//API-5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM district WHERE district_id=${districtId};
    `;
  await db.get(deleteDistrictQuery);
  response.send("District Removed");
});

//API-6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
  UPDATE district SET
            district_name='${districtName}',
            state_id=${stateId},
            cases=${cases},
            cured=${cured},
            active=${active},
            deaths=${deaths}
        WHERE 
            district_id=${districtId};
  `;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//API-7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const statsQuery = `
    SELECT SUM(cases) AS totalCases,
           SUM(cured) AS totalCured,
           SUM(active) AS totalActive,
           SUM(deaths) AS totalDeaths
    FROM district WHERE state_id=${stateId};
    `;
  const statsData = await db.get(statsQuery);
  response.send(statsData);
});

//API-8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const detailsDistrictQuery = `
    SELECT 
        state.state_name As stateName 
    FROM
        state INNER JOIN district ON state.state_id=district.state_id 
    WHERE district_id=${districtId};
    `;
  const stateName = await db.get(detailsDistrictQuery);
  response.send(stateName);
});

module.exports = app;
