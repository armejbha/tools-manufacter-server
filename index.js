const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

// middleware 
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.p5yx4.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        await client.connect();
        const productsCollection = client.db('manufacter').collection('products');
        const orderCollection = client.db('manufacter').collection('orders');
        const profileCollection = client.db('manufacter').collection('profiles');
        const reviewCollection = client.db('manufacter').collection('reviews');
        // get all data 
        app.get('/products', async (req, res) => {
            const query = {};
            const curser = productsCollection.find(query);
            const products = await curser.toArray();
            res.send(products);
        })
        // get single data 
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await productsCollection.findOne(query);
            res.send(product);
        })
        // get all order list 
        app.get('/myOrder', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const curser = orderCollection.find(query);
            const myOrder = await curser.toArray()
            res.send(myOrder);
        })
        // get profile data
        app.get('/profile', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const profile = await profileCollection.findOne(query);
            res.send(profile)
        })
        // get reviews 
        app.get('/reviews', async (req, res) => {
            const query = {};
            const curser = reviewCollection.find(query);
            const reviews = await curser.toArray();
            res.send(reviews);
        })
        // get all orders 
        app.get('/orders', verifyToken, async (req, res) => {
            const query = {};
            const curser = orderCollection.find(query);
            const myOrder = await curser.toArray();
            res.send(myOrder);
        })
        // order get from ui 
        app.post('/order', async (req, res) => {
            const data = req.body;
            const order = await orderCollection.insertOne(data)
            res.send(order);
        })
        // review post in database
        app.post('/review', async (req, res) => {
            const allData = req.body;
            const review = await reviewCollection.insertOne(allData);
            res.send(review);
        })
        // update avalaible stock 
        app.put('/products/:id', async (req, res) => {
            const id = req.params.id;
            const update = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    stock: update.newAvailable
                },
            };
            const result = await productsCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })
        //  user data update 
        app.put('/profile/:email', async (req, res) => {
            const email = req.params.email;
            const updateData = req.body;
            const query = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    name: updateData.name,
                    location: updateData.location,
                    education: updateData.education,
                    linkedin: updateData.linkedin,
                    number: updateData.number
                }
            }
            const result = await profileCollection.updateOne(query, updateDoc, options);
            res.send(result)
        })
        // update profile imgage 
        app.put('/picture/:email', async (req, res) => {
            const email = req.params.email;
            const updateData = req.body;
            const query = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    img: updateData.img,
                }
            }
            const result = await profileCollection.updateOne(query, updateDoc, options);
            res.send(result)
        })
        // delete order 
        app.delete('/order/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const deleted = await orderCollection.deleteOne(query);
            res.send(deleted);
        })
    }
    finally {

    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('server running');
})
app.listen(port, () => {
    console.log(`manufacturing app listen on port ${port}`);
})