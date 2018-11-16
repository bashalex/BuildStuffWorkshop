let CryptoBirds = artifacts.require("./CryptoBirds.sol");
let Breeder = artifacts.require("./Breeder.sol");

module.exports = function(deployer, network) {
  deployer.deploy(CryptoBirds, "CryptoBirds", "CBD");
  deployer.deploy(Breeder);
};
