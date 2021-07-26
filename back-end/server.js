const express = require("express");
const cors = require("cors");
const mysql = require('mysql');
const session = require('express-session');
const app = express();

var corsOptions = {
  origin: "http://localhost:8081"
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(express.json());
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

const db = require("./app/models");
db.sequelize.sync();


// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to bezkoder application." });
});


var connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'root',
	password : '',
	database : 'dundermifflin'
});

app.post('/cart', function(request, response){
	var title = request.body.title;
	var description = request.body.description;
	var quantity = request.body.quantity;
	connection.query('SELECT * FROM cart WHERE title=? AND description=?', [title, description], (error, results, fields) => {
		if(results.length > 0){
			var prev_quantity = results[0].quantity;
			//console.log("prev: ", prev_quantity);
			var new_quantity = prev_quantity+parseInt(quantity);
			//console.log("new: ", new_quantity);
			connection.query('UPDATE cart SET quantity=? WHERE title=? AND description=?', [new_quantity, title, description], (err, res, fie) => {
				console.log("Carrello Aggiornato");
				//response.send("Prodotto nel carrello aggiornato correttamente.");
			})
			//response.end();
		} else{
			connection.query('INSERT INTO cart (title, description, quantity) VALUES (?, ?, ?)', [title, description, quantity], (error, results, fields) =>{
				console.log("Inserito nel carrello");
				//response.send("Prodotto Inserito nel carrello correttamente.");
			})
		}
	});
	connection.query('SELECT * FROM products WHERE title=? AND description=?', [title, description], (error, results, fields) => {
		if(results.length > 0){
			var prev_quantity = results[0].quantity;
			//console.log("prev: ", prev_quantity);
			var new_quantity = prev_quantity-parseInt(quantity);
			//console.log("new: ", new_quantity);
			connection.query('UPDATE products SET quantity=? WHERE title=? AND description=?', [new_quantity, title, description], (err, res, fie) => {
				response.send("Giacenza del prodotto aggiornata correttamente.");
				response.end();
			})
			//response.end();
		} else{
			response.send("Errore");
			response.end();
		}
	});
	
	
});

app.delete('/cart', function(request, response){
	connection.query('TRUNCATE TABLE cart', (error, results, fields) => {
		response.send("Carrello Svuotato Correttamente.");
		response.end();
	})
});

app.post('/cartproduct', function(request, response){
	var title = request.body.title;
	var description = request.body.description;
	var quantity = request.body.quantity;
	console.log(`${title}, ${description}, ${quantity}`)
	connection.query('DELETE FROM cart WHERE title=? AND description=?', [title, description], (error, results, fields) => {
		console.log("Delete");
		connection.query('SELECT * FROM products WHERE title=? AND description=?', [title, description], (error, results, fields) => {
			console.log("Select");
			if(results.length > 0){
				var prev_quantity = results[0].quantity;
				var new_quantity = prev_quantity+parseInt(quantity);
				connection.query('UPDATE products SET quantity=? WHERE title=? AND description=?', [new_quantity, title, description], (error, results, fields) => {
					console.log("Update");
					response.send("Giacenze aggiornate correttamente dopo l'eliminazione di un prodotto dal carrello.");
					response.end();
				})
			} else{
				response.send("Errore nell'aggiornamento del prodotto nella lista.");
				response.end();
			}
			
		})
	})
})

app.get('/cart', function(request, response){
	connection.query('SELECT * FROM cart', (error, results, fields) => {
		response.send(results);
		response.end();
	})
})

app.post('/auth', function(request, response) {
	var username = request.body.username;
	var password = request.body.password;
	var mode = request.body.mode;
	if (username && password) {
		if(mode == "client"){
			connection.query('SELECT * FROM clients WHERE username=? and password=?', [username, password], (error, results, fields) => {
				//console.log(results);    
				if (results.length > 0) {
						  response.json({
							  message: "success",
							  mode: "client",
							  user: username
					});
						  request.session.loggedin = true;
						  request.session.username = username;
						//response.redirect('/home');
					} else {
						response.json({message: "error"});
					}	
					response.end();
				});
		} else if(mode == "owner"){
			connection.query('SELECT * FROM owners WHERE username=? and password=?', [username, password], (error, results, fields) => {
				//console.log(results);    
				if (results.length > 0) {
						  response.json({
							  message: "success",
							  mode: "owner",
							  user: username
					});
						  request.session.loggedin = true;
						  request.session.username = username;
						//response.redirect('/home');
					} else {
						response.json({message: "error"});
					}	
					response.end();
				});
		}
		
	} else {
		response.json({message: "error"});
		response.end();
	}
});

app.get('/home', function(request, response) {
	if (request.session.loggedin) {
		response.send('Welcome back, ' + request.session.username + '!');
	} else {
		response.send('Please login to view this page!');
	}
	response.end();
});

require("./app/routes/product.routes")(app);
// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});