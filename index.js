const express = require("express");
const redis = require("redis");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");

const redisCache = false;

// Create a redis client for local development
const redisClient = redis.createClient();
// Or for production, pass in your production instance's URL
// const redisClient = redis.createClient({ url: "your-production-url"})

const app = express();

const DEFAULT_EXPIRATION = 3600;

app.use(cors());

app.use(bodyParser.json()); //for json req with  Content-type: applciation/json get  json from req.body
app.use(express.urlencoded({ extended: true }));

app.get("/", function (req, res) {
  res.send("hello from node server");
});

app.get("/poke", (req, res, next) => {
  //在redis進行key的搜索，找到之前的資料就直接回送cache資料
  redisClient.get("pokemons", async (error, list) => {
    if (error) {
      console.error({ error });
    }
    if (list !== null) {
      res.json(JSON.parse(list));
      return;
    }
    //當redis 沒有cache資料時，call api
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

app.get("/evo", (req, res) => {
  const { id } = req.query;
  redisClient.get(`pokemon_${id}`, async (err, data) => {
    if (err) {
      console.error({ err });
      return res.send("error");
    }
    if (data !== null) {
      res.json(JSON.parse(data));
      return;
    }
    const payload = await axios({
      url: `https://pokeapi.co/api/v2/pokemon/${id}/`,
      method: "get",
    });

    if (redisCache) {
      redisClient.setex(`pokemon_${id}`, DEFAULT_EXPIRATION, JSON.stringify(payload.data));
    }
    res.json(payload.data);
  });
});

app.listen(9876, () => {
  console.log(" node-server on 9876");
});
