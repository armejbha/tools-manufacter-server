const express = require('express');
const app = express();
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
        // order get from ui 
        app.post('/order', async (req, res) => {
            const data = req.body;
            const order = await orderCollection.insertOne(data)
            res.send(order);
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