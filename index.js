const express = require("express");
const Redis = require("redis");
const axios = require("axios");
const cors = require("cors");

// Create a Redis client for local development
const redisClient = Redis.createClient();
// Or for production, pass in your production instance's URL
// const redisClient = Redis.createClient({ url: "your-production-url"})

const app = express();

const DEFAULT_EXPIRATION = 3600;

app.use(cors());

app.use(express.urlencoded({ extended: true }));

app.get("/", function (req, res) {
  res.send("hello world");
});

app.get("/todo", async (req, res, next) => {
  //在redis進行key的搜索，找到之前的資料就直接回送cache資料
  redisClient.get("todoList", async (error, todos) => {
    if (todos) {
      console.log({ error });
    }
    if (data !== null) {
      res.json(JSON.stringify(todos));
      return;
    }
  });

  //當redis 沒有cache資料時，才call api拉資料
  const payload = await axios({
    url: "https://jsonplaceholder.typicode.com/todos",
    method: "get",
  });
  console.log({ test: payload.data });
  redisClient.setex(
    "todoList",
    DEFAULT_EXPIRATION,
    JSON.stringify(payload.data)
  );
  res.json(payload.data);
});

app.listen(9876, () => {
  console.log(" listening on 9876");
});
