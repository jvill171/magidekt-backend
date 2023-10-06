const axios = require('axios');

/** Validate card data based on UUIDs
 *  cardIds: [cardId, cardId, ....] => data:{ rejected_data, added}
 * 
 */

async function validateCardIDs(cardList){
    // chunkedArrays is an array of max-size 75, as required by scryfall
    let chunkedArrays = []
    for(let idx=0; idx < cardList.length; idx += 75){
        chunkedArrays.push( cardList.slice(idx, idx + 75) )
    }

    const notFound = []
    const foundData = []
    for(let idx=0; idx < chunkedArrays.length; idx++){
        const identifiers = chunkedArrays[idx].map(card=> ({ id: card.cardId }))
        const result = await axios.post(`https://api.scryfall.com/cards/collection`, { identifiers })
        notFound.push(...result.data.not_found);
        foundData.push(...result.data.data)
    }
    // Only grab card.id from scryfall response
    const nf_Data = notFound.map(card =>(card.id))
    const f_Data = foundData.map(card =>(card.id))

    // Split cardList into cards that were found and not found, w/ their quantity
    const not_found = cardList.filter(card => nf_Data.includes(card.cardId))
    const found     = cardList.filter(card => f_Data.includes(card.cardId))
    
    return{ not_found, found };
}

module.exports = { validateCardIDs };
