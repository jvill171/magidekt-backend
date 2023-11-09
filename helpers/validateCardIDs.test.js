const assert = require('assert');
const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const { validateCardIDs } = require('./validateCardIDs');

describe('validateCardIDs', () => {
  it('should validate card IDs and return not_found and found lists', async () => {
    const cardList = [{ cardId: 'id1' }, { cardId: 'id2' }];
    const mock = new MockAdapter(axios);

    // Mock the POST request to scryfall
    mock.onPost('https://api.scryfall.com/cards/collection').reply(200, {
      not_found: [],
      data: [{ id: 'id1' }, { id: 'id2' }],
    });

    const result = await validateCardIDs(cardList);

    // Use the assert module for assertions
    assert.deepEqual(result.not_found, []);
    assert.deepEqual(result.found, cardList);

    // Clean up the mock
    mock.restore();
  });
});
