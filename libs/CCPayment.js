// Declare variables for the library prefix and the API URL
const libprefix = "ccpayment_";
const API_URL = "https://admin.ccpayment.com/ccpayment/v1/";

// Functions for set APP_ID & APP_SECRET
function setAppId(appId) {
  Bot.setProp(libprefix + "appid", appId, "string");
}

function setAppSecret(appSecret) {
  Bot.setProp(libprefix + "appsecret", appSecret, "string");
}

// Functions for get APP_ID & APP_SECRET
function getAppId() {
  const appId = Bot.getProp(libprefix + "appid");
  // If APP_ID not found or not setuped yet
  if (!appId) { throw new Error("CCPayment lib: Require app ID. Please setup first."); }
  
  return appId;
}

function getAppSecret() {
  const appSecret = Bot.getProp(libprefix + "appsecret");
  // If APP_SECRET not found or not setuped yet
  if (!appSecret) { throw new Error("CCPayment lib: require app secret. Please setup first."); }
  
  return appSecret;
}

// Create timestamp for the request in seconds
function createTimestamp(threshold = 0) {
  return parseInt(Date.now() / 1000, 10) + threshold;
}

// Create SHA256 signature for the request
function createSHA256Signature(message) {
  return CryptoJS.SHA256(message).toString(CryptoJS.enc.Hex);
}

function createRequest(options) {
  options.body = options.body ? JSON.stringify({ ...options.body }) : "";
  
  // Timestamp for the current request
  const timestamp = createTimestamp();
  // Format: "APP_IDAPP_SECRETTIMESTAMPSIGNATURE"
  const message = (getAppId() + getAppSecret() + timestamp + options.body);
  // Signature for the current request
  const signature = createSHA256Signature(message);
  
  // Set the headers for the API request
  let headers = {
    "Content-Type": "application/json;charset=utf-8",
    "Appid": getAppId(),
    "Timestamp": timestamp,
    "Sign": signature
  }
  
  // Define parameters for the HTTP request
  params = {
    url: API_URL + options.path,
    body: options.body,
    headers: headers,
    
    // Set success and error callback functions for the API call
    success: libprefix + "onApiCallSuccess " + options.onSuccess,
    error: libprefix + "onApiCallError"
  }
  
  HTTP.post(params);
}

// Function called when an API response is received
function onApiCallSuccess() {
  // Parse the content of the response, which is in JSON format
  const options = JSON.parse(content);
  
  // Execute the request onSuccess command and pass "options" objects as arguments
  Bot.run({ command: params, options });
}

// Function called when an API request results in an error
function onApiCallError() {
  throw content;
}

// Get all supported currencies
function getAllSupportedCurrencies(options) {
  options.path = "coin/all";
  createRequest(options);
}

// Get coin balance with a specific coin_id
function getBalanceById(options) {
  options.path = "assets";
  
  // Throw an error if no options are passed or if there are no fields specified in the options
  if (!options.body) { throw "CCPayment lib: getCoinBalance needs options.body"; }
  if (!options.body.coin_id) { throw "CCPayment lib: getCoinBalance needs options.body.coin_id"; }
  
  createRequest(options);
}

// Export functions to be used elsewhere
publish({
  getAppId: getAppId,
  getAppSecret: getAppSecret,
  
  setAppId: setAppId,
  setAppSecret: setAppSecret,
  
  createRequest: createRequest,
  getCoinBalance: getCoinBalance,
  getAllSupportedCurrencies: getAllSupportedCurrencies
});

on(libprefix + "onApiCallSuccess", onApiCallSuccess);
on(libprefix + "onApiCallError", onApiCallError);
