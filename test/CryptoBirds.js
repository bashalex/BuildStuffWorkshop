const Breeder = artifacts.require("./Breeder.sol");
const CryptoBirds = artifacts.require("./CryptoBirds.sol");

const assertRevert = require('./helpers/AssertRevert');

contract('CryptoBirds', function ([owner, recipient, anotherAccount]) {

	const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
	const initial_price = web3.toWei(1, 'ether');

	describe('verify buy() function', function () {

		let breeder;
		let token;

		it(' - deploy contracts', async function () {
			this.breeder = await Breeder.new();
			this.token = await CryptoBirds.new("CryptoBirdsTest", "CBDT");
		});

		it(' - verify the price', async function () {
			let last_price = await this.token.last_price.call();
			assert.equal(initial_price, last_price);
		});


		it(' - try to buy a bird', async function () {
			let amount = initial_price;
			await this.token.buy({ from: recipient, value: amount, gas: 200000});

			// Check that total number of birds is equal to 1 now
			assert.equal(await this.token.totalSupply.call(), 1);

			// Check that the number of birds owned by the recipient is equal to 1 now
			assert.equal(await this.token.balanceOf.call(recipient), 1);

			// Check that number the new bird is owned by the recipient
			let new_bird_id = await this.token.tokenByIndex.call(0);
			assert.equal(await this.token.ownerOf(new_bird_id), recipient);
		});

		it(' - try to buy a bird for the same price again', async function () {
			// Such an attempt is expected to be reverted
			await assertRevert(this.token.buy({ from: recipient, value: initial_price, gas: 200000}));
		});
	});

});