const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cors = require('cors');
const stripe = require("stripe")(process.env.STRIPE_KEY);
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

// middleware 
app.use(cors());
app.use(express.json());

function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ massage: 'Unauthorize access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ massage: 'Forbidden access' });
        }
        req.decoded = decoded;
        next();
    });

}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.p5yx4.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const productsCollection = client.db('manufacter').collection('products');
        const orderCollection = client.db('manufacter').collection('orders');
        const profileCollection = client.db('manufacter').collection('profiles');
        const reviewCollection = client.db('manufacter').collection('reviews');
        const userCollection = client.db('manufacter').collection('users');
        const paymentCollection = client.db('manufacter').collection('payments');

        const verifyAdmin = async (req, res, next) => {
            const requester = req.decoded.email;
            const requestAccount = await userCollection.findOne({ email: requester });
            if (requestAccount.role === 'admin') {
                next();
            } else {
                return res.status(403).send({ massage: 'Forbidden access' });
            }
        }

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
        app.get('/myOrder', verifyToken, async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const curser = orderCollection.find(query);
            const myOrder = await curser.toArray()
            res.send(myOrder);
        })
        // get profile data
        app.get('/profile', verifyToken, async (req, res) => {
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
        app.get('/order', verifyToken, async (req, res) => {
            const query = {};
            const curser = orderCollection.find(query);
            const myOrder = await curser.toArray();
            res.send(myOrder);
        })
        // get all user 
        app.get('/user', verifyToken, verifyToken, async (req, res) => {
            const query = {};
            const curser = userCollection.find(query)
            const user = await curser.toArray();
            res.send(user);
        })

        // get admin 
        app.get('/admin/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin });
        })
        // single order 
        app.get('/order/:id', verifyToken, async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) };
            const myOrder = await orderCollection.findOne(query);
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
        app.post('/product', async (req, res) => {
            const productData = req.body;
            const result = await productsCollection.insertOne(productData);
            res.send(result);
        })

        app.post('/create-payment-intent', verifyToken, async (req, res) => {
            const service = req.body;
            const price = service.totalPrice;
            const amount = price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: ['card']
            })
            res.send({
                clientSecret: paymentIntent.client_secret
            });
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
        // update product info 
        app.put('/editProduct/:id', async (req, res) => {
            const id = req.params.id;
            const updateData = req.body;
            const query = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    name: updateData.name,
                    description: updateData.description,
                    moq: updateData.minOrder,
                    stock: updateData.quantity,
                    price: updateData.price
                }
            }
            const result = await productsCollection.updateOne(query, updateDoc, options);
            res.send(result)
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

        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const query = { email: email };
            const option = { upsert: true };
            const updateDoc = {
                $set: user
            }
            const result = await userCollection.updateOne(query, updateDoc, option);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, { expiresIn: '365d' })
            res.send({ result, token });
        })

        app.put('/user/admin/:email', verifyToken, verifyAdmin, async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const updateDoc = {
                $set: { role: 'admin' }
            }
            const result = await userCollection.updateOne(query, updateDoc);
            return res.send(result);
        })

        app.patch('/order/:id', async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const query = { _id: ObjectId(id) };
            const updateDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const result = await paymentCollection.insertOne(payment)
            const updateOrder = await orderCollection.updateOne(query, updateDoc)
            res.send(updateDoc)
        })

        // delete order 
        app.delete('/order/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const deleted = await orderCollection.deleteOne(query);
            res.send(deleted);
        })
        // delete single product 
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const deleted = await productsCollection.deleteOne(query);
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