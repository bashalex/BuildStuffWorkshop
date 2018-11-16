pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721Full.sol";

contract CryptoBirds is ERC721Full {

	uint256 public last_price = 1 ether;

	constructor(string name, string symbol) ERC721Full(name, symbol)
    	public
    {

    }

    function buy()
    	public
    	payable
    {
    	require(msg.value >= last_price);
    	_mint(msg.sender, uint256(keccak256(totalSupply() + block.timestamp)) / 1e70);
    	if (msg.value > last_price) {
    		msg.sender.transfer(msg.value - last_price);
    	}
    }

    function sell(uint256 id)
    	public
    {
    	_burn(msg.sender, id);
    	msg.sender.transfer(last_price / 2);
    }
}