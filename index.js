const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000
const app = express()

//middlewere

app.use(cors())
app.use(express.json())

function jwtVerify(req,res,next){
    const authHeader = req.headers.authorization
    if(!authHeader){
        return res.status(401).send({message:'unauthorized access'})
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.EXCESS_TOKEN , (err ,decoded )=>{
        if(err){
            return res.status(403).send({message:'Forbiden access'})
        }
        console.log('decoded' , decoded)
        req.decoded =decoded
        next()
    })
    // console.log('jwt',authHeader)
   
}



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kz7ts.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect()
        const seviceCollection = client.db('geniuscar').collection('service')
        const orderCollection = client.db('geniuscar').collection('order')

    //   Auth
         app.post('/login' , async(req,res)=>{
             const user = req.body 
             const accessToken = jwt.sign(user , process.env.EXCESS_TOKEN ,{
                 expiresIn: '1d'
             })
            //  console.log(accessToken);
             res.send({accessToken})
         })
       

        //service api
        app.get('/service', async (req, res) => {
            const query = {}
            const cursor = seviceCollection.find(query)
            const services = await cursor.toArray()
            res.send(services)
        })

        app.get('/service/:id', async(req,res)=>{
           const id = req.params.id 
           const query ={_id: ObjectId(id)}
           const service = await seviceCollection.findOne(query)
           res.send(service)
        })

        // post
        app.post('/service', async(req,res)=>{
            const newService = req.body 
            const result = await seviceCollection.insertOne(newService)
            res.send(result)
        })

        //delete
        app.delete('/service/:id' , async(req,res)=>{
            const id = req.params.id 
            const query = {_id: ObjectId(id)}
            const result = await seviceCollection.deleteOne(query)
            res.send(result)
        })

        //oder collection api

       app.get('/order',jwtVerify ,async(req,res)=>{
            const decodedEmail = req.decoded.email
           const email = req.query.email
           if(email===decodedEmail){
            const query ={email:email}
            const cursor = orderCollection.find(query)
            const orders =await cursor.toArray()
            res.send(orders)
           }
           else{
             res.status(403).send({message:'Forbiden access'})
           }
       })


        app.post('/order', async(req,res)=>{
            const order = req.body 
            const result =await orderCollection.insertOne(order)
            res.send(result)

        })

    }

    finally {

    }
}
run().catch(console.dir)


app.get('/', (req, res) => {
    res.send('Running Genius Server')
})

app.listen(port, () => {
    console.log('Listening to port', port);
})


