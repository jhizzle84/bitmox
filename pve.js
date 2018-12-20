process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const request = require('request');

const conf = require("./conf.js");
console.log("Configured for connection to " + conf.pveHost + " on port " + conf.pvePort + " as " + conf.pveUser + "@" + conf.pveDomain);

const apiRoot = ("https://" + conf.pveHost + ":" + conf.pvePort + "/api2/json/");

const authString = ("username=" + conf.pveUser + "@" + conf.pveDomain + "&password=" + conf.pvePassword);

// Retrieve cookie from API

let authResponse = "";
function postCredentials(callback){
  var clientServerOptions = {
      method: 'POST',
      uri: apiRoot + "access/ticket",
      body: authString,
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
    request(clientServerOptions, function(error, response) {
      authResponse = JSON.parse(response.body).data;
      callback();
})
};

let pveCookie = "";
let pveCSRF = "";
postCredentials(function() {
  pveCookie = "PVEAuthCookie=" + authResponse.ticket
  pveCSRF = authResponse.CSRFPreventionToken
  console.log("Cookie = " + pveCookie);
  console.log("CSRF = " + pveCSRF);
});

// Retrieve the next available VMID from Proxmox as 
// required for LXC post functions.

function getNextID(callback) {
  var clientServerOptions = {
   method: 'GET',
   uri: apiRoot + "/cluster/nextid",
   headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Cookie': pveCookie,
   }

  }
  request(clientServerOptions, function(error, response) {
    pveNextid = JSON.parse(response.body).data;
    console.log("Next VMID: " + pveNextid);
    callback(pveNextid);

  })
}

// Create a new container with specs defined in conf.js

function newContainer(pveNextid) {
  var clientServerOptions = {
    method: 'POST',
    uri: apiRoot + "/nodes/" + conf.pveNode + "/lxc",
    form: {
      net0: "bridge=vmbr0,name=eth0,ip6=auto",
      ostemplate: conf.pveTemplate,
      vmid: pveNextid,
      unprivileged: 1,
      storage: "local-lvm",
      memory: 320,

    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': pveCookie,
      'CSRFPreventionToken': pveCSRF,
    }
  }
  request(clientServerOptions, function(error, response) {
    console.log(response.body);
})
setTimeout(function(){startContainer(pveNextid)}, 30000);
};

// start container (referenced in newContainer)

function startContainer(pveNextid) {
    var clientServerOptions = {
        method: 'POST',
        uri: apiRoot + "/nodes/" + conf.pveNode + "/lxc/" + pveNextid + "/status/start",
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': pveCookie,
            'CSRFPreventionToken': pveCSRF,
        }
    }
    request(clientServerOptions, function(error, response) {
        console.log("derp " + response.body);
})
};

// give the route something to call upon

function callContainer() {
    getNextID(newContainer);
}
module.exports = callContainer;