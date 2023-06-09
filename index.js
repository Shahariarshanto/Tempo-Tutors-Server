const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 9000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    console.log("decoded", decoded);
    req.decoded = decoded;
    next();
  });
};

// MongoDB Connection URL
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.SECRET_PASS}@cluster0.rilvf9e.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // collection of the database
    const courseCollection = client.db("tempo-tutors").collection("courses");
    const instructorCollection = client
      .db("tempo-tutors")
      .collection("instructors");
    const usersCollection = client.db("tempo-tutors").collection("users");

    // jwt token

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "1d",
      });
      res.send({ token });
      console.log(token);
    });

    // User Register
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      console.log(user);
      const existingUser = await usersCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: "user already exists" });
      }

      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // get all instructors data
    app.get("/instructors", async (req, res) => {
      const query = {};
      const cursor = instructorCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // Get all Class data
    app.get("/all-classes", async (req, res) => {
      const query = {};
      const cursor = courseCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // add a Class data to db
    app.post("/add-class", async (req, res) => {
      const newClass = req.body;
      console.log(newClass);
      const result = await courseCollection.insertOne(newClass);
      res.send(result);
    });

    // check  admin role mongodb 
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const query = { email: email };
      const user = await usersCollection.findOne(query);

      console.log(user);
      const isAdmin = user?.role === "admin";
      res.send({ admin: isAdmin });
    }
       );
 

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Welcome to  Server!");
});

app.listen(port, () => {
  console.log(
    `Tempo-Tutors-Summer-Camp app listening at http://localhost:${port}`
  );
});
