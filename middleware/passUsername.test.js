"use strict";

const { passUsername } = require("./passUsername");

describe("passUsername", function (){
    test("works", function (){
        expect.assertions(1);
        const req = { params: { username: "test" } };
        const res = {};
        const next = function (err) {
          expect(err).toBeFalsy();
        };
        passUsername(req, res, next);
    })
})

