const fs = require("fs");
const axios = require("axios");

// Loading the API configuration
const config = JSON.parse(fs.readFileSync("api_config.json", "utf8"));
const baseUrl = config.baseUrl;

// Storing api endpoints as constants
const startEndpoint = config.apiEndpoints.start; // For initiating engine (POST)
const statusEndpoint = config.apiEndpoints.status; // For getting the status of engine (GET). GOAL:  Returns intermix between 0-1. If >0.5, then more matter, else more antimatter
const adjustMatterEndpoint = config.apiEndpoints.adjustMatter; // For adding matter as substance to the engine (POST). Max value 0.2
const adjustAntiMatterEndpoint = config.apiEndpoints.adjustAntiMatter; // For adding antimatter to the engine (POST). Max value 0.2

// Function to fetch Authorization
async function fetchData() {
  try {
    const response = await axios({
      method: startEndpoint.method,
      url: baseUrl + startEndpoint.path,
      data: {
        name: "Mark Andreas Rebane",
        email: "rebane.mark@gmail.com",
      },
    });

    const authorizationCode = response.data.authorizationCode;
    return authorizationCode;
  } catch (error) {
    console.error(error);
  }
}

// Function to adjust matter
async function adjustMatter(authorizationCode, value) {
  try {
    const response = await axios({
      method: adjustMatterEndpoint.method,
      url: `${baseUrl}${adjustMatterEndpoint.path}`,
      data: {
        authorizationCode: authorizationCode,
        value: value,
      },
    });
    return response;
  } catch (error) {
    console.error(error);
  }
}

// Function to adjust antimatter
async function adjustAntiMatter(authorizationCode, value) {
  try {
    const response = await axios({
      method: adjustAntiMatterEndpoint.method,
      url: `${baseUrl}${adjustAntiMatterEndpoint.path}`,
      data: {
        authorizationCode: authorizationCode,
        value: value,
      },
    });
    return response;
  } catch (error) {
    console.error(error);
  }
}

// Function to display status of engine
async function fetchStatus(authorizationCode) {
  try {
    const response = await axios({
      method: statusEndpoint.method,
      url: `${baseUrl}${statusEndpoint.path}?authorizationCode=${authorizationCode}`,
    });

    const { flowRate, intermix } = response.data;
    console.log(response.data);

    let adjustmentValue;
    if (flowRate === "OPTIMAL") {
      if (intermix < 0.5) {
        adjustmentValue = Math.min(0.2, 0.5 - intermix); // If things are optimal, I don't want to increase matter for the maximum value of 0.2 because it can be too much and flowRate would go unnecessarily 'HIGH'
        await adjustMatter(authorizationCode, adjustmentValue);
      } else if (intermix > 0.5) {
        adjustmentValue = Math.min(0.2, intermix - 0.5); // If things are optimal, I don't want to increase antimatter for the maximum value of 0.2 because it can be too much and flowRate would go unnecessarily 'LOW'
        await adjustAntiMatter(authorizationCode, adjustmentValue);
      }
    } else if (flowRate === "LOW") {
      if (intermix < 0.5) {
        adjustmentValue = 0.2;
        await adjustMatter(authorizationCode, adjustmentValue); // If more antimatter, increase matter
      } else if (intermix > 0.5) {
        adjustmentValue = 0.2;
        await adjustAntiMatter(authorizationCode, adjustmentValue); // If more matter, increase antimatter
      } else {
        adjustmentValue = 0.1;
        await adjustMatter(authorizationCode, adjustmentValue);
        await adjustAntiMatter(authorizationCode, adjustmentValue);
      }
    } else if (flowRate === "HIGH") {
      if (intermix < 0.5) {
        adjustmentValue = -0.2;
        await adjustAntiMatter(authorizationCode, adjustmentValue); // If more matter, decrease antimatter
      } else if (intermix > 0.5) {
        adjustmentValue = -0.2;
        await adjustMatter(authorizationCode, adjustmentValue); // If more antimatter, decrease matter
      } else {
        adjustmentValue = -0.1;
        await adjustMatter(authorizationCode, adjustmentValue);
        await adjustAntiMatter(authorizationCode, adjustmentValue);
      }
    }
  } catch (error) {
    console.error(error);
  }
}

// Calling the function and awaiting its completion (running for 1min with one second intervals)
(async () => {
  const authorizationCode = await fetchData();
  console.log(authorizationCode);

  const intervalId = setInterval(async () => {
    await fetchStatus(authorizationCode);
  }, 1000);

  setTimeout(() => {
    clearInterval(intervalId);
  }, 60 * 1000);
})();
