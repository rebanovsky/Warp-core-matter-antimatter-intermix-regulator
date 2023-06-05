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
    // console.error(error);
  }
}

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
    // console.error(error);
  }
}

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
    // console.error(error);
  }
}

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
        adjustmentValue = Math.min(0.2, 0.5 - intermix);
        await adjustMatter(authorizationCode, adjustmentValue);
      } else if (intermix > 0.5) {
        adjustmentValue = Math.min(0.2, intermix - 0.5);
        await adjustAntiMatter(authorizationCode, adjustmentValue);
      }
    } else if (flowRate === "LOW") {
      if (intermix < 0.5) {
        adjustmentValue = 0.2;
        await adjustMatter(authorizationCode, adjustmentValue);
      } else if (intermix > 0.5) {
        adjustmentValue = 0.2;
        await adjustAntiMatter(authorizationCode, adjustmentValue);
      } else {
        adjustmentValue = 0.1;
        await adjustMatter(authorizationCode, adjustmentValue);
        await adjustAntiMatter(authorizationCode, adjustmentValue);
      }
    } else if (flowRate === "HIGH") {
      if (intermix < 0.5) {
        adjustmentValue = -0.2;
        await adjustAntiMatter(authorizationCode, adjustmentValue); // If matter is more, add antimatter
      } else if (intermix > 0.5) {
        adjustmentValue = -0.2;
        await adjustMatter(authorizationCode, adjustmentValue); // If antimatter is more, add matter
      } else {
        adjustmentValue = -0.1;
        await adjustMatter(authorizationCode, adjustmentValue);
        await adjustAntiMatter(authorizationCode, adjustmentValue);
      }
    }
  } catch (error) {
    // console.error(error);
  }
}

// Call the function and await its completion
(async () => {
  const authorizationCode = await fetchData();
  console.log(authorizationCode);

  // Create an interval to fetch status every second for one minute
  const intervalId = setInterval(async () => {
    await fetchStatus(authorizationCode);
  }, 1000);

  // Clear interval after one minute
  setTimeout(() => {
    clearInterval(intervalId);
  }, 60 * 1000);
})();
