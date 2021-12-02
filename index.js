const express = require("express");
const redis = require("redis");
const axios = require("axios");
const cors = require("cors");

const redisCache = false;

// Create a redis client for local development
const redisClient = redis.createClient();
// Or for production, pass in your production instance's URL
// const redisClient = redis.createClient({ url: "your-production-url"})

const app = express();

const DEFAULT_EXPIRATION = 3600;

app.use(cors());

app.use(express.urlencoded({ extended: true }));

app.get("/", function (req, res) {
  res.send("hello from node server");
});

app.get("/poke", async (req, res, next) => {
  //在redis進行key的搜索，找到之前的資料就直接回送cache資料
  redisClient.get("pokemons", async (error, list) => {
    if (error) {
      console.error({ error });
    }
    if (list !== null) {
      res.json(JSON.parse(list));
      return;
    }
    //當redis 沒有cache資料時，才call api拉資料
    const payload = await axios({
      url: "https://pokeapi.co/api/v2/pokemon",
      method: "get",
    });
    // console.log({ payload });
    if (redisCache) {
      redisClient.setex("pokemons", DEFAULT_EXPIRATION, JSON.stringify(payload.data.results));
    }
    res.json(payload.data.results);
  });
});

app.listen(9876, () => {
  console.log(" node-server on 9876");
});
