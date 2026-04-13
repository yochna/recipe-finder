require("dotenv").config();

const express = require("express")
const fetch = require("node-fetch")
const cors = require("cors")
const mongoose = require("mongoose")
const { URL } = require("url")

const app = express()
const PORT = process.env.PORT || 5000
const API_KEY = process.env.SPOONACULAR_KEY
const MONGO_URI = process.env.MONGO_URI

if (!API_KEY) { console.error("Missing SPOONACULAR_KEY"); process.exit(1) }
if (!MONGO_URI) { console.error("Missing MONGO_URI"); process.exit(1) }



app.use(cors({
  origin: [
    'https://recipe-finder-cyan-eight.vercel.app', 
    'http://localhost:3000' // Useful for local testing
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json())

mongoose.connect(MONGO_URI)
  .then(()=> console.log("MongoDB connected"))
  .catch(err => {console.error("MongoDB error;",err); process.exit(1)})

const favoriteSchema = new mongoose.Schema({
  recipeId :{type: Number,required:true,unique:true},
  title: String,
  image:String,
  readyInMinutes: Number,
  servings:Number,
  sourceUrl:String,
})
const Favorite = mongoose.model("Favorite",favoriteSchema)

app.get("/recipeProxy", async (req, res) => {
  const { query, cuisine, diet, type, number } = req.query

  if (!query) return res.status(400).json({ error: "Missing query" })

  try {
    const url = new URL("https://api.spoonacular.com/recipes/complexSearch")
    url.searchParams.append("query", query)
    url.searchParams.append("apiKey", API_KEY)
    url.searchParams.append("number",  Math.min(Number(number) || 12, 20))
    url.searchParams.append("addRecipeInformation", "true")
    if (cuisine) url.searchParams.append("cuisine", cuisine)
    if (diet) url.searchParams.append("diet", diet)
    if (type) url.searchParams.append("type", type)

    const response = await fetch(url.toString())
      if (!response.ok) return res.status(response.status).json({ error: `Spoonacular error: ${response.status}` })
    const data = await response.json()
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get("/favorites",async (req,res)=>{
  const favorites = await Favorite.find()
  res.json(favorites)
})
app.post("/favorites",async(req,res)=>{
  try{
    const favorite = new Favorite(req.body);
    await favorite.save()
    res.status(201).json(favorite)
  }catch(err){
    if(err.code===11000) return res.status(409).json({error:"Already in favorites"})
      res.status(500).json({error:err.message})
  }
})
app.delete("/favorites/:id",async(req,res)=>{
  await Favorite.findOneAndDelete({recipeId:Number(req.params.id)})
 res.json({ success: true })
})

app.listen(PORT, () => console.log(`Local proxy running on http://localhost:${PORT}`))
